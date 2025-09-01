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
                'min:8',
                'regex:/^(?=.*[0-9])(?=.*[\W_]).+$/'
            ],
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }

        if ($request->password != $request->confirm_password) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to register. Password not match.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];

            return response()->json($response, Response::HTTP_FORBIDDEN);
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

                if ($createProfile) {
                    $response = [
                        'data' => '',
                        'meta' => [
                            'message' => 'Registration successful.',
                            'status_code' => Response::HTTP_OK
                        ]
                    ];

                    return response()->json($response, Response::HTTP_OK);
                }
            } else {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Failed to create user.',
                        'status_code' => Response::HTTP_FORBIDDEN
                    ]
                ];

                return response()->json($response, Response::HTTP_FORBIDDEN);
            }
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to create cognito user.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];

            return response()->json($response, Response::HTTP_FORBIDDEN);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }
        Log::info('Security Audit: User ' . $request->email . ' trying to login.');
        //Cognito initiate auth
        $result = $this->initiateAuth($request->email, $request->password);
        if ($result['status'] == 'SUCCESS') {
            Log::info('Security Audit: User ' . $request->email . 'requested to login.');
            $userData = User::where('email', $request->email)->first();
            if ($userData) {
                Auth::login($userData);
                $user = Auth::user();
                $userData->password = $request->password;
                $userData->auth_token = $result['access_token'];
                $userData->refresh_token = $result['refresh_token'];
                $userData->save();
                $status = "LOGIN_SUCCESSFUL";
                Log::info('Security Audit: User ' . $request->email . ' login successfully.');
                $data = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => null,
                    'role' => $user->role,
                    'status' => $status
                ];

                $response = [
                    'data' => $data,
                    'auth_token' => $result['access_token'],
                    'session_token' => null,
                    'meta' => [
                        'message' => 'Login successful',
                        'status_code' => Response::HTTP_OK
                    ]
                ];

                return response()->json($response, Response::HTTP_OK);
            } else {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Login failed. User not found.',
                        'status_code' => Response::HTTP_BAD_REQUEST
                    ]
                ];

                return response()->json($response, Response::HTTP_BAD_REQUEST);
            }
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Login failed. Wrong password.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];

            return response()->json($response, Response::HTTP_FORBIDDEN);
        }
    }

    public function logout(Request $request)
    {
        try {

            $token = $request->header('Authorization');

            if (strpos($token, 'Bearer ') === 0) {
                $token = substr($token, 7);
                $user = User::where('auth_token', $token)->first();

                if (!$user) {
                    $response = [
                        'data' => '',
                        'meta' => [
                            'message' => 'Logout failed',
                            'status_code' => Response::HTTP_UNAUTHORIZED
                        ]
                    ];
                    return response()->json($response, Response::HTTP_UNAUTHORIZED);
                }

                $refresh_token = $user->refresh_token;
                $revoke_token = $this->revokeTokenFromCognito($refresh_token);

                if (!$revoke_token) {
                    $response = [
                        'data' => '',
                        'meta' => [
                            'message' => 'Logout failed',
                            'status_code' => Response::HTTP_UNAUTHORIZED
                        ]
                    ];
                    return response()->json($response, Response::HTTP_UNAUTHORIZED);
                }

                $user->auth_token = null;
                $user->refresh_token = null;
                $user->save();
            }

            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Logout successful',
                    'status_code' => Response::HTTP_OK
                ]
            ];

            return response()->json($response, Response::HTTP_OK);
        } catch (\Exception $e) {
            // Something went wrong whilst attempting to encode the token
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Logout failed : ' . $e,
                    'status_code' => Response::HTTP_UNAUTHORIZED
                ]
            ];

            return response()->json($response, Response::HTTP_UNAUTHORIZED);
        }
    }
}
