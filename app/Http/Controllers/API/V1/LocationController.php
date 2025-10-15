<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaCity;
use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaVillage;
use App\Models\IndonesiaPostalCode;
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
            'country' => $profile->country,
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
                'id'   => $item['geonameId'],
                'name' => $item['name'],
                'code' => $item['adminCodes1']['ISO3166_2'] ?? null,
            ];
        });

        return $provinces;
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
                    'id'   => $item['geonameId'],
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
}
