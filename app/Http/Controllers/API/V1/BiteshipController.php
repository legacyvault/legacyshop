<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class BiteshipController extends Controller
{
    private $baseUrl = "https://api.biteship.com/v1";
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('BITESHIP_API_KEY');
    }

    public function getBiteshipOriginWarehouse($biteship_warehouse_id)
    {
        $response = Http::withToken($this->apiKey)
            ->get("{$this->baseUrl}/locations/{$biteship_warehouse_id}");

        if (!$response->successful()) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'System failed. Please contact Legacy Vault.',
            ]);
        }

        return $response;
    }

    public function getBiteshipDestinationID($biteship_destination_id)
    {
        $response = Http::withToken($this->apiKey)
            ->get("{$this->baseUrl}/locations/{$biteship_destination_id}");

        if (!$response->successful()) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'System failed. Please contact Legacy Vault.',
            ]);
        }

        return $response;
    }

    public function getCourierList()
    {
        $response = Http::withToken($this->apiKey)
            ->get("{$this->baseUrl}/couriers");

        if (!$response->successful()) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'System failed. Please contact Legacy Vault.',
            ]);
        }

        return $response;
    }

    public function getDeliveryRates(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_latitude'       => 'required|string',
            'origin_longitude'      => 'required|string',
            'destination_latitude'        => 'required|string',
            'destination_longitude'       => 'required|string',
            'couriers'              => 'string',
            'items'                 => 'required|array',
            'items.*.name'          => 'required|string',
            'items.*.sku'           => 'required|string',
            'items.*.value'         => 'required|numeric|min:0',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.weight'        => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $response = Http::withToken($this->apiKey)
            ->post('https://api.biteship.com/v1/rates/couriers', [
                'origin_latitude'          => $request->origin_latitude,
                'origin_longitude'  => $request->origin_longitude,
                'destination_latitude' => $request->destination_latitude,
                'destination_longitude'       => $request->destination_longitude,
                'couriers'          => $request->couriers,
                'items'   => $request->items
            ]);

        if (!$response->successful()) {
            return redirect()->back()->with('error', 'Failed to get courier rates');
        }

        if (!$response->successful()) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'System failed. Please contact Legacy Vault.',
            ]);
        }

        return $response;
    }

    public function getRates(Request $request)
    {
        $response = Http::withToken($this->apiKey)
            ->post($this->baseUrl . '/rates/couriers', [
                "origin_latitude" => $request->origin_lat,
                "origin_longitude" => $request->origin_lng,
                "destination_latitude" => $request->destination_lat,
                "destination_longitude" => $request->destination_lng,
                "couriers" => "jne,jnt,sicepat",
                "items" => $request->items
            ]);

        return $response->json();
    }
}
