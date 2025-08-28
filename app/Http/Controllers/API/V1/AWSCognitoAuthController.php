<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Traits\Cognito;
use App\Models\Profile;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class AWSCognitoAuthController extends Controller
{
    use Cognito;

    public function registerUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'email' => 'required|unique:users,email|email',
            'password' => 'required|password|string',
            'confirm_password' => 'required|string',
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
}
