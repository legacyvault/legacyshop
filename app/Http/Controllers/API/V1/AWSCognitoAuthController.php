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
                ]);

                return redirect()->route('login')->with('success', 'Sign Up successful.');
            } else {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Failed to create user.',
                        'status_code' => Response::HTTP_FORBIDDEN
                    ]
                ];

                return redirect()->route('login')->with('error', 'Failed to sign up.');
            }
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to create cognito user.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];

            return redirect()->route('login')->with('error', 'Failed to sign up.');
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

                return redirect()->route($redirectUrl)->with('success', 'Registration successful.');
            } else {
                return redirect()->route('login')->with('error', 'Login failed.');
            }
        } else {
            return redirect()->route('login')->with('error', 'Login failed. Wrong password');
        }
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

            return redirect()->route('login')->with('success', 'Logout successful.');
        } catch (\Exception $e) {
            Log::error('Failed to logout: ' . $e);
            return redirect()->back()->with('error', 'Logout failed');
        }
    }
}
