<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    protected $user;

    public function __construct(Request $request)
    {
        $this->user = $this->authenticateUser($request->header('Authorization'));
    }

    public function authenticateUser($token)
    {

        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
            $user = User::where('auth_token', $token)->first();

            return $user;
        }
    }

    public function getProfile()
    {
        $profile = Profile::where('user_id', Auth::id())->first();

        return Inertia::render('profile/index', [
            'profile' => $profile
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'phone' => 'required|string|regex:/^\d+$/',
            'address' => 'required|string',
            'city' => 'required|string',
            'province' => 'required|string',
            'country' => 'required|string',
            'postal_code' => 'required|string|regex:/^\d+$/',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {

            $user = Profile::where('user_id', Auth::id())->first();

            if ($user) {
                $user->name = $request->name;
                $user->address = $request->address;
                $user->phone = $request->phone;
                $user->city = $request->city;
                $user->province = $request->province;
                $user->country = $request->country;
                $user->postal_code = $request->postal_code;
                $user->save();

                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Profile data updated.',
                        'status_code' => Response::HTTP_OK
                    ]
                ];
                return response()->json($response, Response::HTTP_OK);
            } else {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'User not found.',
                        'status_code' => Response::HTTP_BAD_REQUEST
                    ]
                ];
                return response()->json($response, Response::HTTP_BAD_REQUEST);
            }
        } catch (Exception $e) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to update profile.' . $e,
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];
            return response()->json($response, Response::HTTP_FORBIDDEN);
        }
    }
}
