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

        return $response->json();
    }

    public function getDeliveryRates(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_postal_code'       => 'required|numeric',
            'destination_postal_code'        => 'required|numeric',
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

        $response = Http::withToken($this->apiKey)->post(
            'https://api.biteship.com/v1/rates/couriers',
            [
                'origin_postal_code'       => (float) $request->input('origin_postal_code'),
                'destination_postal_code'  => (float) $request->input('destination_postal_code'),
                'couriers'              => (string) $request->input('couriers'),
                'items' => collect($request->input('items', []))->map(fn($i) => [
                    'name'     => (string) $i['name'],
                    'sku'      => (string) $i['sku'],
                    'value'    => (float)  $i['value'],
                    'quantity' => (int)    $i['quantity'],
                    'weight'   => (float)  $i['weight'], // grams
                ])->all(),
            ]
        );

        $rates = $response->json();

        return redirect()->route('checkout.page')
            ->with('rates', $rates)
            ->with('message', 'Courier rates loaded');

        // if (!$response->successful()) {
        //     return back()->with('alert', [
        //         'type' => 'error',
        //         'message' => 'System failed. Please contact Legacy Vault.',
        //     ]);
        // }

        // $rates = $response;

        // return redirect()->route('checkout.page')
        // ->with('rates', $rates)
        // ->with('message', 'Courier rates loaded');
    }

    public function getDeliveryRatesByLocationID(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_area_id'       => 'required|string',
            'destination_area_id'       => 'required|string',
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

        $response = Http::withToken($this->apiKey)->post(
            'https://api.biteship.com/v1/rates/couriers',
            [
                'origin_area_id'       => (string) $request->input('origin_area_id'),
                'destination_area_id'      => (string) $request->input('destination_area_id'),
                'couriers'              => (string) $request->input('couriers'),
                'items' => collect($request->input('items', []))->map(fn($i) => [
                    'name'     => (string) $i['name'],
                    'sku'      => (string) $i['sku'],
                    'value'    => (float)  $i['value'],
                    'quantity' => (int)    $i['quantity'],
                    'weight'   => (float)  $i['weight'], // grams
                ])->all(),
            ]
        );

        $rates = $response->json();

        return redirect()->route('checkout.page')
            ->with('rates', $rates)
            ->with('message', 'Courier rates loaded');

        // if (!$response->successful()) {
        //     return back()->with('alert', [
        //         'type' => 'error',
        //         'message' => 'System failed. Please contact Legacy Vault.',
        //     ]);
        // }

        // $rates = $response;

        // return redirect()->route('checkout.page')
        // ->with('rates', $rates)
        // ->with('message', 'Courier rates loaded');
    }

    public function getRates(Request $request)
    {
        $response = Http::withToken($this->apiKey)
            ->post($this->baseUrl . '/rates/couriers', [
                "origin_postal_code" => $request->origin_postal_code,
                "destination_postal_code" => $request->destination_postal_code,
                "couriers" => "jne,sicepat,jnt,anteraja",
                "items" => $request->items
            ]);

        return $response->json();
    }
}
