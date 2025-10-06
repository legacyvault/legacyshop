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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Lang;

class UserController extends Controller
{
    protected $user;

    private $apiKey;

    public function __construct(Request $request)
    {
        $this->user = $this->authenticateUser($request->header('Authorization'));
        $this->apiKey = env('BITESHIP_API_KEY');
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
            'name' => 'required|string',
            'contact_name' => 'required|string',
            'contact_phone' => 'required|string',
            'province' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'postal_code' => 'required|string',
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'is_active' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $user = Auth::user();
            $profile = Profile::where('user_id', $user->id)->first();

            $hasAddress = DeliveryAddress::where('profile_id', $profile->id)->exists();
            $isActive = (bool) ($request->is_active ?? false);

            // Ambil lokasi IP user
            $ip = $request->header('X-Forwarded-For') ?? $request->ip();
            if (env('APP_ENV') == 'local') {
                $ip = '36.84.152.11';
            }

            $response = Http::get("http://ip-api.com/json/{$ip}?fields=status,country,countryCode,regionName,city,zip");
            $location = $response->json();

            if (!isset($location['status']) || $location['status'] === 'fail') {
                return redirect()->back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Failed to fetch location from IP.'
                ]);
            }

            // Create lokasi di Biteship
            $response = Http::withToken($this->apiKey)
                ->post('https://api.biteship.com/v1/locations', [
                    'name'          => $request->name,
                    'contact_name'  => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'address'       => $request->address,
                    'note'          => null,
                    'postal_code'   => $request->postal_code,
                    'latitude'      => $request->latitude,
                    'longitude'     => $request->longitude,
                    'type'          => 'destination',
                ]);

            if (!$response->successful()) {
                DB::rollBack();
                return redirect()->back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Gagal create lokasi di Biteship.'
                ]);
            }

            $biteshipData = $response->json();

            if ($hasAddress && $isActive) {
                DeliveryAddress::where('profile_id', $profile->id)
                    ->update(['is_active' => false]);
            }

            DeliveryAddress::create([
                'name'                    => $request->name,
                'contact_name'            => $request->contact_name,
                'contact_phone'           => $request->contact_phone,
                'biteship_destination_id' => $biteshipData['id'],
                'profile_id'              => $profile->id,
                'country'                 => $location['countryCode'] ?? null,
                'province'                => $request->province,
                'address'                 => $request->address,
                'city'                    => $request->city,
                'postal_code'             => $request->postal_code,
                'latitude'                => $request->latitude,
                'longitude'               => $request->longitude,
                'is_active'               => $hasAddress ? $isActive : ($request->is_active ?? true),
            ]);

            DB::commit();

            return redirect()->route('settings/delivery-address')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create delivery address.'
            ]);
        } catch (Exception $e) {
            Log::error('Failed to create delivery address: ' . $e->getMessage());
            DB::rollBack();

            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create delivery address.'
            ]);
        }
    }

    public function updateDeliveryAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'            => 'required|exists:delivery_address,id',
            'name'          => 'required|string',
            'contact_name'  => 'required|string',
            'contact_phone' => 'required|string',
            'province'      => 'required|string',
            'address'       => 'required|string',
            'city'          => 'required|string',
            'postal_code'   => 'required|string',
            'latitude'      => 'required|string',
            'longitude'     => 'required|string',
            'is_active'     => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $deliveryAddress = DeliveryAddress::findOrFail($request->id);

            $response = Http::withToken($this->apiKey)
                ->post("https://api.biteship.com/v1/locations/{$deliveryAddress->biteship_destination_id}", [
                    'name'          => $request->name,
                    'contact_name'  => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'address'       => $request->address,
                    'note'          => null,
                    'postal_code'   => $request->postal_code,
                    'latitude'      => $request->latitude,
                    'longitude'     => $request->longitude
                ]);

            if (!$response->successful()) {
                return redirect()->back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Gagal create lokasi di Biteship'
                ]);
            }

            if ($request->has('is_active') && $request->is_active) {
                DeliveryAddress::where('profile_id', $deliveryAddress->profile_id)
                    ->where('id', '!=', $deliveryAddress->id)
                    ->update(['is_active' => false]);
                $deliveryAddress->is_active = true;
            }

            $deliveryAddress->name          = $request->name;
            $deliveryAddress->contact_name  = $request->contact_name;
            $deliveryAddress->contact_phone = $request->contact_phone;
            $deliveryAddress->province      = $request->province;
            $deliveryAddress->address       = $request->address;
            $deliveryAddress->city          = $request->city;
            $deliveryAddress->postal_code   = $request->postal_code;
            $deliveryAddress->latitude      = $request->latitude;
            $deliveryAddress->longitude     = $request->longitude;
            $deliveryAddress->save();

            DB::commit();
            return redirect()->route('settings/delivery-address')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully update delivery address.'
            ]);
        } catch (Exception $e) {
            DB::rollback();
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to update delivery address.'
            ]);
        }
    }

    public function getAllDeliveryAddress()
    {
        $data = DeliveryAddress::orderBy('name', 'asc')->get();

        return $data;
    }

    public function getActiveDeliveryAddress()
    {
        $data = DeliveryAddress::where('is_active', true)
            ->orderBy('name', 'asc')
            ->first();

        return $data;
    }
}
