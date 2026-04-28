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
use Illuminate\Support\Facades\Cache;
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

    protected function isIndonesiaCountry(?string $country): bool
    {
        if (!$country) {
            return false;
        }

        $normalized = strtoupper(trim($country));

        if (in_array($normalized, ['ID', 'IDN'], true)) {
            return true;
        }

        return str_contains(strtolower($country), 'indonesia');
    }

    /**
     * Return the real client IP.
     *
     * SECURITY: Never read X-Forwarded-For directly from the request — it is a
     * user-controlled header and trivially spoofable. Use Laravel's trusted-proxy
     * resolution ($request->ip()), which only honours proxy headers when the
     * request originates from a configured trusted proxy address.
     *
     * If you run behind a load-balancer / CDN, configure its IP(s) in
     * config/trustedproxies.php (or via TRUSTED_PROXIES in .env) instead of
     * reading the header manually.
     */
    protected function getClientIp(Request $request): string
    {
        // In local dev we use a fixed Indonesian IP so tests are reproducible.
        if (env('APP_ENV') === 'local') {
            return '36.84.152.11';
        }

        // $request->ip() already honours X-Forwarded-For only for trusted proxies.
        return $request->ip();
    }

    /**
     * Resolve the ISO country code for the current request via IP geo-lookup.
     * Returns null when the lookup fails rather than blocking the caller.
     */
    protected function resolveCountryCodeFromIp(Request $request): ?string
    {
        $ip = $this->getClientIp($request);

        // Cache each unique IP for 24 hours so repeated requests (including
        // bot-traffic flooding from spoofed IPs) don't hammer ip-api.com's
        // free-plan quota and cause HTTP 429s that block real users.
        return Cache::remember("geo_ip:{$ip}", now()->addHours(24), function () use ($ip) {
            try {
                $response = Http::timeout(5)->get("http://ip-api.com/json/{$ip}?fields=status,countryCode");
                $data = $response->json();

                if (isset($data['status']) && $data['status'] !== 'fail') {
                    return strtoupper($data['countryCode'] ?? '') ?: null;
                }
            } catch (\Exception $e) {
                Log::warning("IP geo-lookup failed for {$ip}: " . $e->getMessage());
            }

            // Return null on failure. Cache::remember stores this null so we
            // won't retry a failing IP every request within the TTL window.
            return null;
        });
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
        $user = Auth::user();
        $profile = Profile::where('user_id', $user?->id)->first();

        if (!$profile) {
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Profile not found.',
            ]);
        }

        // SECURITY: Resolve country from the server-side IP lookup — never from the
        // user-submitted form field. A user can freely forge $request->country to
        // skip Biteship registration or bypass district/village validation.
        // resolveCountryCodeFromIp() uses $request->ip() (trusted-proxy-aware) and
        // falls back gracefully to null rather than blocking the save.
        $resolvedCountryCode = $this->resolveCountryCodeFromIp($request);

        // If the IP lookup cannot determine the country, fall back to the profile's
        // known country as a secondary signal (also server-side, not user-controlled).
        if (!$resolvedCountryCode && $profile->country) {
            $resolvedCountryCode = strtoupper($profile->country);
        }

        $isIndonesia = $this->isIndonesiaCountry($resolvedCountryCode);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'contact_name' => 'required|string',
            'contact_phone' => 'required|string',
            'province' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'district' => [$isIndonesia ? 'required' : 'nullable', 'string'],
            'village' => [$isIndonesia ? 'required' : 'nullable', 'string'],
            'postal_code' => 'required|string',
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'is_active' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => $validator->errors()->first(),
            ]);
        }

        try {
            DB::beginTransaction();

            $hasAddress = DeliveryAddress::where('profile_id', $profile->id)->exists();
            $isActive = (bool) ($request->is_active ?? false);

            $biteshipDestinationId = null;

            // Create lokasi di Biteship
            if ($isIndonesia) {
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
                $biteshipDestinationId = $biteshipData['id'] ?? null;
            }

            if ($hasAddress && $isActive) {
                DeliveryAddress::where('profile_id', $profile->id)
                    ->update(['is_active' => false]);
            }

            DeliveryAddress::create([
                'name'                    => $request->name,
                'contact_name'            => $request->contact_name,
                'contact_phone'           => $request->contact_phone,
                'biteship_destination_id' => $biteshipDestinationId,
                'profile_id'              => $profile->id,
                'country'                 => $resolvedCountryCode ?: null,
                'province'                => $request->province,
                'address'                 => $request->address,
                'city'                    => $request->city,
                'district'                => $isIndonesia ? ($request->district ?: null) : null,
                'village'                 => $isIndonesia ? ($request->village ?: null) : null,
                'postal_code'             => $request->postal_code,
                'latitude'                => $request->latitude,
                'longitude'               => $request->longitude,
                'is_active'               => $hasAddress ? $isActive : ($request->is_active ?? true),
            ]);

            DB::commit();

            return redirect()->back()->with('alert', [
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

    public function deleteDeliveryAddress($addressId)
    {
        try {
            DB::beginTransaction();

            $address = DeliveryAddress::findOrFail($addressId);
            $profileId = $address->profile_id;

            // Only block deletion if the address being removed is the last active one.
            // Inactive addresses can always be deleted freely.
            if ($address->is_active) {
                $otherActiveCount = DeliveryAddress::where('profile_id', $profileId)
                    ->where('is_active', true)
                    ->where('id', '!=', $address->id)
                    ->count();

                if ($otherActiveCount === 0) {
                    throw new \Exception("Cannot delete this address — there must be at least one active delivery address.");
                }
            }

            $address->delete();

            // Optional: hapus di Biteship
            if ($address->biteship_destination_id) {
                try {
                    Http::withToken($this->apiKey)
                        ->delete("https://api.biteship.com/v1/locations/{$address->biteship_destination_id}");
                } catch (\Exception $e) {
                    Log::warning("Failed to delete delivery address in Biteship: " . $e->getMessage());
                }
            }

            DB::commit();

            return redirect()->back()->with('alert', [
                'type' => 'success',
                'message' => "Successfully deleted delivery address '{$address->name}'.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to delete delivery address: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to delete delivery address: ' . $e->getMessage(),
            ]);
        }
    }

    public function updateDeliveryAddress(Request $request)
    {
        // Use the address's own country (not the profile country) so validation
        // and Biteship sync are correct when users have addresses in multiple countries.
        $existingAddress = DeliveryAddress::find($request->id);
        $isIndonesia = $this->isIndonesiaCountry($existingAddress?->getRawAttributeValue('country') ?? $request->country);

        $validator = Validator::make($request->all(), [
            'id'            => 'required|exists:delivery_address,id',
            'name'          => 'required|string',

            'contact_name'  => 'required|string',
            'contact_phone' => 'required|string',
            'province'      => 'required|string',
            'address'       => 'required|string',
            'city'          => 'required|string',
            'district'      => [$isIndonesia ? 'required' : 'nullable', 'string'],
            'village'       => [$isIndonesia ? 'required' : 'nullable', 'string'],
            'postal_code'   => 'required|string',
            'latitude'      => 'required|string',
            'longitude'     => 'required|string',
            'is_active'     => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => $validator->errors()->first(),
            ]);
        }

        try {
            DB::beginTransaction();

            $deliveryAddress = DeliveryAddress::findOrFail($request->id);

            if ($isIndonesia) {

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
                    DB::rollBack();
                    return redirect()->back()->with('alert', [
                        'type' => 'error',
                        'message' => 'Gagal update lokasi di Biteship'
                    ]);
                }
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
            $deliveryAddress->district      = $isIndonesia ? ($request->district ?: null) : null;
            $deliveryAddress->village       = $isIndonesia ? ($request->village ?: null) : null;
            $deliveryAddress->postal_code   = $request->postal_code;
            $deliveryAddress->latitude      = $request->latitude;
            $deliveryAddress->longitude     = $request->longitude;
            $deliveryAddress->save();

            DB::commit();
            return redirect()->back()->with('alert', [
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
        $profile = Profile::where('user_id', Auth::id())->first();

        $data = DeliveryAddress::where('profile_id', $profile?->id)
            ->orderBy('is_active', 'desc')
            ->get();

        return $data;
    }

    public function getActiveDeliveryAddress()
    {
        $profile = Profile::where('user_id', Auth::id())->first();

        $data = DeliveryAddress::where('profile_id', $profile?->id)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->first();

        return $data;
    }

    public function getDeliveryAddressById($id)
    {
        $data = DeliveryAddress::where('id', $id)->first();

        return $data;
    }

    public function getDeliveryAddresBasedCountryCode(Request $request)
    {
        $user = Auth::user();
        $profile = Profile::where('user_id', $user?->id)->first();

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        // SECURITY: Use trusted-proxy-aware IP resolution instead of raw X-Forwarded-For.
        $countryCode = $this->resolveCountryCodeFromIp($request);

        if (!$countryCode) {
            return response()->json(['message' => 'Failed to fetch location from IP.'], 422);
        }

        $data = DeliveryAddress::where('profile_id', $profile->id)
            ->where('country', $countryCode)
            ->orderBy('is_active', 'desc')
            ->get();

        return $data;
    }
}
