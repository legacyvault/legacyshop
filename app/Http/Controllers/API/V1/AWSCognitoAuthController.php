<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Traits\Cognito;
use App\Models\Profile;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class AWSCognitoAuthController extends Controller
{
    use Cognito;

    public function registerUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'email' => 'required|unique:users,email|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[0-9])(?=.*[\W_]).+$/'
            ],
            'confirm_password' => [
                'required',
                'string',
                'same:password'
            ],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        //Create Cognito User
        $ip = $request->header('X-Forwarded-For') ?? $request->ip();
        if (env('APP_ENV') == 'local') {
            $ip = '36.84.152.11';
        }

        $response = Http::get("https://pro.ip-api.com/json/{$ip}", [
            'key' => config('services.ip_api.key'),
        ]);
        
        $location = $response->json();

        if ($location['status'] == 'fail') {
            return redirect()->back()->with('error', 'Failed to register');
        }

        $createCognitoUser = $this->customCreateUser($request->all());

        if ($createCognitoUser == 'SUCCESS') {

            $createUser = User::create([
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role' => 'user'
            ]);

            if ($createUser) {

                $createProfile = Profile::create([
                    'user_id' => $createUser->id,
                    'name' => $request->name,
                    'country' => $location['countryCode'] ?? null,
                ]);

                return redirect()->route('login')->with('alert', [
                    'type' => 'success',
                    'message' => 'Sign Up successful.',
                ]);
            } else {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Failed to create user.',
                        'status_code' => Response::HTTP_FORBIDDEN
                    ]
                ];

                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Failed to sign up.',
                ]);
            }
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to create cognito user.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to sign up.',
            ]);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        Log::info('Security Audit: User ' . $request->email . ' trying to login.');
        //Cognito initiate auth
        $result = $this->initiateAuth($request->email, $request->password);

        if ($result['status'] == 'SUCCESS') {
            Log::info('Security Audit: User ' . $request->email . ' requested to login.');
            $credentials = $request->only('email', 'password');
            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                Auth::login($user);
                $user->auth_token = $result['access_token'];
                $user->refresh_token = $result['refresh_token'];
                $user->save();

                Log::info('Security Audit: User ' . $request->email . ' login successfully.');

                // choose redirect path based on role
                $redirectUrl = $user->role === 'admin' ? 'dashboard' : 'home';

                return redirect()->route($redirectUrl)->with('alert', [
                    'type' => 'success',
                    'message' => 'Login successful.',
                ]);
            } else {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Login failed',
                ]);
            }
        } else {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Login failed. Wrong Password',
            ]);
        }
    }

    public function callback(Request $request)
    {
        $code = $request->get('code');

        $clientId = env('AWS_COGNITO_CLIENT_ID');
        $clientSecret = env('AWS_COGNITO_CLIENT_SECRET');
        $redirectUri = 'http://127.0.0.1:8000/callback';

        $response = Http::asForm()->post('https://<your-domain>.auth.ap-southeast-1.amazoncognito.com/oauth2/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'redirect_uri' => $redirectUri,
        ]);

        $tokens = $response->json();

        if (isset($tokens['access_token'])) {
            // Decode id_token untuk dapat email/nama user
            $idToken = $tokens['id_token'];
            $payload = json_decode(base64_decode(explode('.', $idToken)[1]), true);

            $email = $payload['email'] ?? null;

            // Cari user di DB, kalau belum ada, create
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $payload['name'] ?? '']
            );

            // Simpan token ke user
            $user->auth_token = $tokens['access_token'];
            $user->refresh_token = $tokens['refresh_token'] ?? null;
            $user->save();

            // Login ke Laravel
            Auth::login($user);

            return redirect()->route('dashboard')->with('success', 'Logged in with Google!');
        }

        return redirect()->route('login')->with('error', 'Google login failed');
    }

    public function logout(Request $request)
    {
        try {

            $user = Auth::user();

            if (!$user) {
                return redirect()->back()->with('error', 'Logout failed');
            }

            $refresh_token = $user->refresh_token;
            $revoke_token = $this->revokeTokenFromCognito($refresh_token);

            if (!$revoke_token) {
                return redirect()->back()->with('error', 'Logout failed');
            }

            $user->auth_token = null;
            $user->refresh_token = null;
            $user->save();

            Auth::logout();

            return redirect()->route('login')->with('success', 'Logout successful.');
        } catch (\Exception $e) {
            Log::error('Failed to logout: ' . $e);
            return redirect()->back()->with('error', 'Logout failed');
        }
    }

    public function sendResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                    'message'     => $validator->errors()->first(),
                ],
                'data' => null,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Soft-check: make sure the email actually exists in our DB
        // before hitting Cognito (prevents user-enumeration via Cognito errors).
        $userExists = User::where('email', $request->email)->exists();

        if (!$userExists) {
            // Return a generic success so we don't leak whether an email is registered.
            Log::info('Password reset requested for unknown email: ' . $request->email);

            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_OK,
                    'message'     => 'If that email is registered, a verification code has been sent.',
                ],
                'data' => null,
            ]);
        }

        $result = $this->forgotPassword($request->email);

        if ($result['status'] === 'SUCCESS') {
            Log::info('Security Audit: Password reset code sent to ' . $request->email);

            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_OK,
                    'message'     => 'Verification code sent to your email.',
                ],
                'data' => null,
            ]);
        }

        // Map known Cognito error codes to friendlier messages.
        $friendlyMessage = match ($result['code'] ?? '') {
            $this->USER_NOT_FOUND   => 'If that email is registered, a verification code has been sent.',
            $this->EXPIRED_CODE     => 'The code has expired. Please request a new one.',
            default                 => 'Failed to send verification code. Please try again.',
        };

        return response()->json([
            'meta' => [
                'status_code' => Response::HTTP_BAD_REQUEST,
                'message'     => $friendlyMessage,
            ],
            'data' => null,
        ], Response::HTTP_BAD_REQUEST);
    }

    public function verifyResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                    'message'     => $validator->errors()->first(),
                ],
                'data' => null,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Store verified email + code in the session so Step 3 can use them
        // without the FE having to re-send them (prevents tampering).
        session([
            'pwd_reset_email' => $request->email,
            'pwd_reset_code'  => $request->code,
            'pwd_reset_verified_at' => now()->timestamp,
        ]);

        Log::info('Security Audit: Password reset code verified (session) for ' . $request->email);

        return response()->json([
            'meta' => [
                'status_code' => Response::HTTP_OK,
                'message'     => 'Code accepted. Please enter your new password.',
            ],
            'data' => null,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[0-9])(?=.*[\W_]).+$/',   // matches your registration rule
            ],
            'confirm_new_password' => [
                'required',
                'string',
                'same:new_password',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                    'message'     => $validator->errors()->first(),
                ],
                'data' => null,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Retrieve the session values placed by Step 2.
        $email = session('pwd_reset_email');
        $code  = session('pwd_reset_code');
        $verifiedAt = session('pwd_reset_verified_at');

        if (!$email || !$code) {
            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_BAD_REQUEST,
                    'message'     => 'Reset session expired. Please restart the forgot-password flow.',
                ],
                'data' => null,
            ], Response::HTTP_BAD_REQUEST);
        }

        // Guard: session must not be older than 10 minutes.
        if (now()->timestamp - $verifiedAt > 600) {
            session()->forget(['pwd_reset_email', 'pwd_reset_code', 'pwd_reset_verified_at']);

            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_BAD_REQUEST,
                    'message'     => 'Reset session expired. Please restart the forgot-password flow.',
                ],
                'data' => null,
            ], Response::HTTP_BAD_REQUEST);
        }

        // Call Cognito — this verifies the code AND sets the password atomically.
        $result = $this->confirmForgotPassword($email, $code, $request->new_password);

        if ($result['status'] === 'SUCCESS') {

            // Keep local DB password hash in sync with Cognito.
            User::where('email', $email)->update([
                'password' => Hash::make($request->new_password),
            ]);

            // Clean up session.
            session()->forget(['pwd_reset_email', 'pwd_reset_code', 'pwd_reset_verified_at']);

            Log::info('Security Audit: Password reset successfully for ' . $email);

            return response()->json([
                'meta' => [
                    'status_code' => Response::HTTP_OK,
                    'message'     => 'Password reset successfully. Please log in with your new password.',
                ],
                'data' => null,
            ]);
        }

        // Map Cognito errors.
        $friendlyMessage = match ($result['code'] ?? '') {
            $this->CODE_MISMATCH    => 'Invalid verification code. Please check and try again.',
            $this->EXPIRED_CODE     => 'The verification code has expired. Please request a new one.',
            $this->INVALID_PASSWORD => 'Password does not meet the required policy.',
            $this->USER_NOT_FOUND   => 'User not found.',
            default                 => 'Failed to reset password. Please try again.',
        };

        return response()->json([
            'meta' => [
                'status_code' => Response::HTTP_BAD_REQUEST,
                'message'     => $friendlyMessage,
            ],
            'data' => null,
        ], Response::HTTP_BAD_REQUEST);
    }
}
