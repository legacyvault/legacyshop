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
use Illuminate\Support\Facades\Log;

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

                return redirect()->back()->with('success', 'Profile data updated.');
            } else {
                return redirect()->back()->with('error', 'User not found');
            }
        } catch (Exception $e) {
            Log::error('Update Profile Failed: ' . $e);
            return redirect()->back()->with('error', 'Failed to update profile.');
        }
    }
}
