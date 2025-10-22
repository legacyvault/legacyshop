<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaCity;
use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaVillage;
use App\Models\IndonesiaPostalCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GeoNames\Client as GeoNamesClient;

class LocationController extends Controller
{
    protected function getUserProfile(): ?Profile
    {
        $user = Auth::user();

        if (!$user) {
            return null;
        }

        return Profile::where('user_id', $user->id)->first();
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

    public function getProvincePublicList(Request $request, string $country): JsonResponse
    {
        $country = strtoupper(trim($country));

        if ($country === '') {
            return response()->json([]);
        }

        if ($this->isIndonesiaCountry($country)) {
            $provinces = IndonesiaProvince::orderBy('name')
                ->get()
                ->map(function ($province) {
                    $code = $province->code;

                    return [
                        'id'         => $code,
                        'name'       => $province->name,
                        'code'       => $code,
                        'iso_code'   => $code,
                        'geoname_id' => $code,
                    ];
                })
                ->values();

            return response()->json($provinces->all());
        }

        $username = env('GEONAMES_USERNAME');
        if (!$username) {
            Log::warning('GeoNames username not configured while fetching public provinces.', [
                'country' => $country,
            ]);

            return response()->json([], 500);
        }

        $response = Http::get('http://api.geonames.org/searchJSON', [
            'country'    => $country,
            'featureCode'=> 'ADM1',
            'maxRows'    => 1000,
            'username'   => $username,
        ]);

        if (!$response->successful()) {
            Log::error('Failed to fetch provinces from GeoNames.', [
                'country' => $country,
                'status'  => $response->status(),
            ]);

            return response()->json([], $response->status());
        }

        $data = $response->json();
        $items = collect($data['geonames'] ?? [])->map(function ($item) {
            $geonameId = isset($item['geonameId']) ? (string) $item['geonameId'] : null;
            $name = $item['name'] ?? $item['toponymName'] ?? null;

            if (!$geonameId || !$name) {
                return null;
            }

            return [
                'id'         => $geonameId,
                'name'       => $name,
                'code'       => $geonameId,
                'iso_code'   => $item['adminCodes1']['ISO3166_2'] ?? null,
                'geoname_id' => $geonameId,
            ];
        })->filter()->values();

        return response()->json($items->all());
    }

    public function getProvinceList()
    {
        $profile = $this->getUserProfile();

        if ($profile && $this->isIndonesiaCountry($profile->country)) {
            return IndonesiaProvince::orderBy('name')
                ->get()
                ->map(function ($province) {
                    $code = $province->code;

                    return [
                        'id'   => $code,
                        'name' => $province->name,
                        'code' => $code,
                    ];
                });
        }

        if (!$profile || !$profile->country) {
            return collect();
        }

        $g = new GeoNamesClient(env('GEONAMES_USERNAME'));

        $country = $g->search([
            'country' => 'IS',
            'featureCode' => 'PCLI',
            'maxRows' => 1
        ]);

        if (empty($country)) {
            return redirect()->back()->with('error', 'Country not found.');
        }

        $geonameId = $country[0]->geonameId;

        $response = Http::get("http://api.geonames.org/childrenJSON", [
            'geonameId' => $geonameId,
            'username'  => env('GEONAMES_USERNAME'),
        ]);

        if (!$response->successful()) {
            return redirect()->back()->with('error', 'Failed get province.');
        }

        $data = $response->json();
        $provinces = collect($data['geonames'])->map(function ($item) {
            return [
                'id'   => (string) $item['geonameId'],
                'name' => $item['name'],
                'code' => $item['adminCodes1']['ISO3166_2'] ?? null,
            ];
        });

        return $provinces;
    }

    public function getPublicCityList(Request $request, string $country, string $province): JsonResponse
    {
        $country = strtoupper(trim($country));
        $province = urldecode($province);

        if ($country === '') {
            return response()->json(['cities' => []]);
        }

        if ($this->isIndonesiaCountry($country)) {
            $cities = IndonesiaCity::where('province_code', $province)
                ->orderBy('type')
                ->orderBy('name')
                ->get()
                ->map(function ($city) {
                    $prefix = $city->type === 'kota' ? 'Kota' : 'Kabupaten';

                    return [
                        'id'         => $city->code,
                        'name'       => trim($prefix . ' ' . $city->name),
                        'code'       => $city->code,
                        'geoname_id' => $city->code,
                    ];
                })
                ->values();

            return response()->json(['cities' => $cities->all()]);
        }

        $username = env('GEONAMES_USERNAME');
        if (!$username) {
            Log::warning('GeoNames username not configured while fetching public cities.', [
                'country'  => $country,
                'province' => $province,
            ]);

            return response()->json(['cities' => []], 500);
        }

        $provinceGeonameId = ctype_digit($province) ? $province : $this->resolveProvinceGeonameId($country, $province);

        if (!$provinceGeonameId) {
            Log::warning('Unable to resolve province GeoName ID.', [
                'country'  => $country,
                'province' => $province,
            ]);

            return response()->json(['cities' => []]);
        }

        $cityResponse = Http::get('http://api.geonames.org/childrenJSON', [
            'geonameId' => $provinceGeonameId,
            'username'  => $username,
        ]);

        if (!$cityResponse->successful()) {
            Log::error('Failed to fetch cities from GeoNames.', [
                'country'     => $country,
                'province_id' => $provinceGeonameId,
                'status'      => $cityResponse->status(),
            ]);

            return response()->json(['cities' => []], $cityResponse->status());
        }

        $cities = collect($cityResponse->json()['geonames'] ?? [])->map(function ($item) {
            $geonameId = isset($item['geonameId']) ? (string) $item['geonameId'] : null;
            $name = $item['name'] ?? $item['toponymName'] ?? null;

            if (!$geonameId || !$name) {
                return null;
            }

            return [
                'id'         => $geonameId,
                'name'       => $name,
                'code'       => $geonameId,
                'geoname_id' => $geonameId,
            ];
        })->filter()->values();

        return response()->json(['cities' => $cities->all()]);
    }

    public function getCitiesList(Request $request, $geonameId)
    {
        $profile = $this->getUserProfile();

        if ($profile && $this->isIndonesiaCountry($profile->country)) {
            $cities = IndonesiaCity::where('province_code', $geonameId)
                ->orderBy('type')
                ->orderBy('name')
                ->get()
                ->map(function ($city) {
                    $prefix = $city->type === 'kota' ? 'Kota' : 'Kabupaten';

                    return [
                        'id'   => $city->code,
                        'name' => trim($prefix . ' ' . $city->name),
                    ];
                })
                ->values();

            if ($request->expectsJson()) {
                return response()->json(['cities' => $cities->all()]);
            }

            return redirect()->back()->with([
                'success' => 'Successfully get cities.',
                'cities'  => $cities,
            ]);
        }

        if (!$profile || !$profile->country) {
            return $request->expectsJson()
                ? response()->json(['cities' => []])
                : redirect()->back()->with('error', 'Failed get cities.');
        }

        $cityResponse = Http::get("http://api.geonames.org/childrenJSON", [
            'geonameId' => $geonameId,
            'username'  => env('GEONAMES_USERNAME'),
        ]);

        $cities = collect();
        if ($cityResponse->successful()) {
            $cityData = $cityResponse->json();
            $cities = collect($cityData['geonames'])->map(function ($item) {
                return [
                    'id'   => (string) $item['geonameId'],
                    'name' => $item['name'],
                ];
            })->values();
        } else {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Failed get cities.'], 500);
            }

            return redirect()->back()->with('error', 'Failed get cities.');
        }

        if ($request->expectsJson()) {
            return response()->json(['cities' => $cities->all()]);
        }

        return redirect()->back()->with([
            'success' => 'Successfully get cities.',
            'cities' => $cities,
        ]);
    }

    public function getPublicDistrictList(Request $request, string $cityCode): JsonResponse
    {
        $country = strtoupper(trim((string) $request->query('country', '')));

        if (!$this->isIndonesiaCountry($country)) {
            return response()->json(['districts' => []]);
        }

        $districts = IndonesiaDistrict::where('city_code', $cityCode)
            ->orderBy('name')
            ->get()
            ->map(function ($district) {
                return [
                    'code'       => $district->code,
                    'name'       => $district->name,
                    'id'         => $district->code,
                    'geoname_id' => $district->code,
                ];
            })
            ->values();

        return response()->json(['districts' => $districts->all()]);
    }

    public function getDistrictList(Request $request, string $cityCode)
    {
        $profile = $this->getUserProfile();

        if (!$profile || !$this->isIndonesiaCountry($profile->country)) {
            return $request->expectsJson()
                ? response()->json(['districts' => []])
                : redirect()->back()->with('error', 'District list is available for Indonesian addresses only.');
        }

        $districts = IndonesiaDistrict::where('city_code', $cityCode)
            ->orderBy('name')
            ->get()
            ->map(function ($district) {
                return [
                    'code' => $district->code,
                    'name' => $district->name,
                ];
            })
            ->values();

        if ($request->expectsJson()) {
            return response()->json(['districts' => $districts->all()]);
        }

        return redirect()->back()->with([
            'success'   => 'Successfully get districts.',
            'districts' => $districts,
        ]);
    }

    public function getPublicVillageList(Request $request, string $districtCode): JsonResponse
    {
        $country = strtoupper(trim((string) $request->query('country', '')));

        if (!$this->isIndonesiaCountry($country)) {
            return response()->json(['villages' => []]);
        }

        $villages = IndonesiaVillage::where('district_code', $districtCode)
            ->orderBy('name')
            ->get()
            ->map(function ($village) {
                return [
                    'code'       => $village->code,
                    'name'       => $village->name,
                    'id'         => $village->code,
                    'geoname_id' => $village->code,
                ];
            })
            ->values();

        return response()->json(['villages' => $villages->all()]);
    }

    public function getVillageList(Request $request, string $districtCode)
    {
        $profile = $this->getUserProfile();

        if (!$profile || !$this->isIndonesiaCountry($profile->country)) {
            return $request->expectsJson()
                ? response()->json(['villages' => []])
                : redirect()->back()->with('error', 'Village list is available for Indonesian addresses only.');
        }

        $villages = IndonesiaVillage::where('district_code', $districtCode)
            ->orderBy('name')
            ->get()
            ->map(function ($village) {
                return [
                    'code' => $village->code,
                    'name' => $village->name,
                ];
            })
            ->values();

        if ($request->expectsJson()) {
            return response()->json(['villages' => $villages->all()]);
        }

        return redirect()->back()->with([
            'success'  => 'Successfully get villages.',
            'villages' => $villages,
        ]);
    }

    public function getPublicPostalCodeList(Request $request, string $location): JsonResponse
    {
        $country = strtoupper(trim((string) $request->query('country', '')));
        $scope = strtolower((string) $request->query('scope', 'city'));
        $location = urldecode($location);

        if ($this->isIndonesiaCountry($country)) {
            $postalCodesQuery = IndonesiaPostalCode::query()
                ->select('indonesia_postal_codes.postal_code')
                ->join('indonesia_villages', 'indonesia_villages.code', '=', 'indonesia_postal_codes.village_code');

            if ($scope === 'village') {
                $postalCodesQuery->where('indonesia_villages.code', $location);
            } elseif ($scope === 'district') {
                $postalCodesQuery->where('indonesia_villages.district_code', $location);
            } else {
                $postalCodesQuery->where('indonesia_villages.city_code', $location);
            }

            $postalCodes = $postalCodesQuery
                ->orderBy('indonesia_postal_codes.postal_code')
                ->distinct()
                ->pluck('indonesia_postal_codes.postal_code')
                ->map(function ($code) {
                    return [
                        'code'       => $code,
                        'postalCode' => $code,
                    ];
                })
                ->values();

            return response()->json(['postal_codes' => $postalCodes->all()]);
        }

        if ($country === '') {
            return response()->json(['postal_codes' => []]);
        }

        $username = env('GEONAMES_USERNAME');
        if (!$username) {
            Log::warning('GeoNames username not configured while fetching public postal codes.', [
                'country'  => $country,
                'location' => $location,
            ]);

            return response()->json(['postal_codes' => []], 500);
        }

        $placename = $location;
        if (ctype_digit($location)) {
            $resolvedName = $this->resolveGeonameName($location);
            if ($resolvedName) {
                $placename = $resolvedName;
            }
        }

        if ($placename === '') {
            return response()->json(['postal_codes' => []]);
        }

        $postalResponse = Http::get('http://api.geonames.org/postalCodeSearchJSON', [
            'placename' => $placename,
            'country'   => $country,
            'maxRows'   => 100,
            'username'  => $username,
        ]);

        if (!$postalResponse->successful()) {
            Log::error('Failed to fetch postal codes from GeoNames.', [
                'country'   => $country,
                'placename' => $placename,
                'status'    => $postalResponse->status(),
            ]);

            return response()->json(['postal_codes' => []], $postalResponse->status());
        }

        $postalCodes = collect($postalResponse->json()['postalCodes'] ?? [])->map(function ($item) {
            $code = $item['postalCode'] ?? null;

            if (!$code) {
                return null;
            }

            return [
                'postalCode' => (string) $code,
                'code'       => (string) $code,
            ];
        })->filter()->values();

        return response()->json(['postal_codes' => $postalCodes->all()]);
    }

    public function getPostalCodeList(Request $request, $cityName)
    {
        $profile = $this->getUserProfile();

        if ($profile && $this->isIndonesiaCountry($profile->country)) {
            $scope = strtolower((string) $request->query('scope', 'city'));

            $postalCodesQuery = IndonesiaPostalCode::query()
                ->select('indonesia_postal_codes.postal_code')
                ->join('indonesia_villages', 'indonesia_villages.code', '=', 'indonesia_postal_codes.village_code');

            if ($scope === 'village') {
                $postalCodesQuery->where('indonesia_villages.code', $cityName);
            } elseif ($scope === 'district') {
                $postalCodesQuery->where('indonesia_villages.district_code', $cityName);
            } else {
                $postalCodesQuery->where('indonesia_villages.city_code', $cityName);
            }

            $postalCodes = $postalCodesQuery
                ->orderBy('indonesia_postal_codes.postal_code')
                ->distinct()
                ->pluck('indonesia_postal_codes.postal_code')
                ->map(function ($code) {
                    return [
                        'code' => $code,
                    ];
                })
                ->values();

            if ($request->expectsJson()) {
                return response()->json(['postal_codes' => $postalCodes->all()]);
            }

            return redirect()->back()->with([
                'success'      => 'Successfully get postal code list.',
                'postal_codes' => $postalCodes,
            ]);
        }

        if (!$profile || !$profile->country) {
            return $request->expectsJson()
                ? response()->json(['postal_codes' => []])
                : redirect()->back()->with('error', 'Failed get postal code list.');
        }

        $postalResponse = Http::get("http://api.geonames.org/postalCodeSearchJSON", [
            'placename' => $cityName,
            'country'   => $profile->country,
            'username'  => env('GEONAMES_USERNAME'),
        ]);

        $postalCodes = collect();
        if ($postalResponse->successful()) {
            $postalData = $postalResponse->json();
            $postalCodes = collect($postalData['postalCodes'])->map(function ($item) {
                return [
                    'postalCode' => $item['postalCode'],
                ];
            });
        } else {
            return $request->expectsJson()
                ? response()->json(['postal_codes' => []], 500)
                : redirect()->back()->with('error', 'Failed get cities.');
        }

        if ($request->expectsJson()) {
            return response()->json(['postal_codes' => $postalCodes->values()->all()]);
        }

        return redirect()->back()->with([
            'success'      => 'Successfully get postal code list.',
            'postal_code' => $postalCodes,
        ]);
    }

    protected function resolveProvinceGeonameId(string $country, string $identifier): ?string
    {
        $username = env('GEONAMES_USERNAME');
        if (!$username) {
            return null;
        }

        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        $query = [
            'country'  => $country,
            'featureCode' => 'ADM1',
            'maxRows'  => 1,
            'username' => $username,
        ];

        if (str_contains($identifier, '-')) {
            $parts = explode('-', $identifier);
            $query['adminCode1'] = end($parts);
        } else {
            $query['name_equals'] = $identifier;
        }

        $response = Http::get('http://api.geonames.org/searchJSON', $query);

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();
        $first = $data['geonames'][0] ?? null;

        if (!$first || empty($first['geonameId'])) {
            return null;
        }

        return (string) $first['geonameId'];
    }

    protected function resolveGeonameName(string $geonameId): ?string
    {
        $username = env('GEONAMES_USERNAME');
        if (!$username) {
            return null;
        }

        if (!ctype_digit($geonameId)) {
            return null;
        }

        $response = Http::get('http://api.geonames.org/getJSON', [
            'geonameId' => $geonameId,
            'username'  => $username,
        ]);

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();
        $name = $data['name'] ?? $data['toponymName'] ?? null;

        return is_string($name) && $name !== '' ? $name : null;
    }
}
