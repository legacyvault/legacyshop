<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GeoNames\Client as GeoNamesClient;

class LocationController extends Controller
{
    public function getProvinceList()
    {
        $user = Auth::user();
        $profile = Profile::where('user_id', $user->id)->first();
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

        return redirect()->back()->with([
            'success' => 'Successfully get province.',
            'provinces' => $provinces,
        ]);
    }

    public function getCitiesList($geonameId)
    {
        $cityResponse = Http::get("http://api.geonames.org/childrenJSON", [
            'geonameId' => $geonameId,
            'username'  => env('GEONAMES_USERNAME'),
        ]);

        $cities = [];
        if ($cityResponse->successful()) {
            $cityData = $cityResponse->json();
            $cities = collect($cityData['geonames'])->map(function ($item) {
                return [
                    'id'   => $item['geonameId'],
                    'name' => $item['name'],
                ];
            });
        } else {
            return redirect()->back()->with('error', 'Failed get cities.');
        }

        return redirect()->back()->with([
            'success' => 'Successfully get cities.',
            'cities' => $cities,
        ]);
    }

    public function getPostalCodeList($cityName)
    {
        $user = Auth::user();
        $profile = Profile::where('user_id', $user->id)->first();

        $postalResponse = Http::get("http://api.geonames.org/postalCodeSearchJSON", [
            'placename' => $cityName,
            'country'   => $profile->country,
            'username'  => env('GEONAMES_USERNAME'),
        ]);

        $postalCodes = [];
        if ($postalResponse->successful()) {
            $postalData = $postalResponse->json();
            $postalCodes = collect($postalData['postalCodes'])->map(function ($item) {
                return [
                    'postalCode' => $item['postalCode'],
                ];
            });
        } else {
            return redirect()->back()->with('error', 'Failed get cities.');
        }

        return redirect()->back()->with([
            'success' => 'Successfully get postal code list.',
            'postal_code' => $postalCodes,
        ]);
    }
}
