<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAddress;
use App\Models\Profile;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Lang;

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
        $profile = Profile::where('user_id', Auth::id())->with('delivery_address')->first();

        return $profile;
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'phone' => 'required|string|regex:/^\d+$/',
            'date_of_birth' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {

            $user = Profile::where('user_id', Auth::id())->first();

            if ($user) {
                $user->name = $request->name;
                $user->date_of_birth = $request->date_of_birth;
                $user->phone = $request->phone;
                $user->save();

                return redirect()->back()->with('alert', [
                    'type' => 'success',
                    'message' => 'Profile data updated.',
                ]);
            } else {
                return redirect()->back()->with('alert', [
                    'type' => 'error',
                    'message' => 'User not found',
                ]);
            }
        } catch (Exception $e) {
            Log::error('Update Profile Failed: ' . $e);
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to update profile.',
            ]);
        }
    }

    public function createDeliveryAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'country' => 'required|string',
            'province' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'postal_code' => 'required|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $user = Auth::user();
        $profile = Profile::where('user_id', $user->id)->first();
        $hasAddress = DeliveryAddress::where('profile_id', $profile->id)->exists();
        
        $create = DeliveryAddress::create([
            'profile_id' => $profile->id,
            'country' => $request->country,
            'province' => $request->province,
            'address' => $request->address,
            'city' => $request->city,
            'postal_code' => $request->postal_code,
            'is_active' => $hasAddress ? 0 : 1,
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create delivery address.');
        } else {
            return redirect()->back()->with('error', 'Failed to create delivery address.');
        }
    }
}
