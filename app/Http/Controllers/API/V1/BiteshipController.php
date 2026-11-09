<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BiteshipController extends Controller
{
    private $baseUrl = "https://api.biteship.com/v1";
    private $apiKey;

    /** Used only if Biteship's GET /couriers is unreachable (snapshot 2026-11-09). */
    private const FALLBACK_COURIER_CODES = [
        'anteraja', 'borzo', 'dash_express', 'deliveree', 'gojek', 'grab', 'idexpress',
        'jne', 'jnt', 'jntcargo', 'lalamove', 'lion', 'ninja', 'paxel', 'pos', 'rpx',
        'sap', 'sentralcargo', 'sicepat', 'tiki', 'tlx', 'wahana',
    ];

    public function __construct()
    {
        $this->apiKey = config('services.biteship.api_key');
    }

    /**
     * Courier codes we ask Biteship to quote, and accept at checkout.
     *
     * Default: every courier Biteship supports (GET /couriers, cached 24 h). That
     * endpoint ignores activation, but the rates endpoint only returns couriers
     * ACTIVATED in the Biteship Courier Marketplace, so turning a courier on/off
     * in Biteship is reflected at checkout without a deploy.
     * If BITESHIP_COURIERS is set, only those codes are used.
     * The request's `couriers` value is always ignored.
     */
    public static function allowedCouriers(): array
    {
        $restricted = (array) config('services.biteship.couriers', []);
        if (!empty($restricted)) {
            return $restricted;
        }

        $cached = Cache::get('biteship:courier_codes');
        if (is_array($cached) && !empty($cached)) {
            return $cached;
        }

        try {
            $response = Http::timeout(10)
                ->withToken(config('services.biteship.api_key'))
                ->get('https://api.biteship.com/v1/couriers');

            $codes = collect($response->json('couriers') ?? [])
                ->pluck('courier_code')
                ->filter()
                ->map(fn ($code) => strtolower((string) $code))
                ->unique()
                ->values()
                ->all();

            if ($response->successful() && !empty($codes)) {
                Cache::put('biteship:courier_codes', $codes, now()->addDay());

                return $codes;
            }

            Log::warning('Biteship courier list unavailable, using fallback: ' . $response->status());
        } catch (\Exception $e) {
            Log::warning('Biteship courier list unavailable, using fallback: ' . $e->getMessage());
        }

        // Not cached, so the next request retries Biteship.
        return self::FALLBACK_COURIER_CODES;
    }

    /**
     * Drop any rate whose courier isn't allowed, in case Biteship returns extras.
     */
    private function filterAllowedRates($rates)
    {
        if (is_array($rates) && isset($rates['pricing']) && is_array($rates['pricing'])) {
            $allowed = self::allowedCouriers();
            $rates['pricing'] = array_values(array_filter(
                $rates['pricing'],
                fn ($rate) => in_array(strtolower((string) ($rate['courier_code'] ?? '')), $allowed, true)
            ));
        }

        return $rates;
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

        if (empty(self::allowedCouriers())) {
            return redirect()->route('checkout.page')
                ->with('rates', ['success' => false, 'code' => 422, 'error' => 'No couriers configured.', 'pricing' => []]);
        }

        $response = Http::withToken($this->apiKey)->post(
            'https://api.biteship.com/v1/rates/couriers',
            [
                'origin_postal_code'       => (float) $request->input('origin_postal_code'),
                'destination_postal_code'  => (float) $request->input('destination_postal_code'),
                'couriers'              => implode(',', self::allowedCouriers()),
                'items' => collect($request->input('items', []))->map(fn($i) => [
                    'name'     => (string) $i['name'],
                    'sku'      => (string) $i['sku'],
                    'value'    => (float)  $i['value'],
                    'quantity' => (int)    $i['quantity'],
                    'weight'   => (float)  $i['weight'], // grams
                ])->all(),
            ]
        );

        $rates = $this->filterAllowedRates($response->json());

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

        if (empty(self::allowedCouriers())) {
            return redirect()->route('checkout.page')
                ->with('rates', ['success' => false, 'code' => 422, 'error' => 'No couriers configured.', 'pricing' => []]);
        }

        $response = Http::withToken($this->apiKey)->post(
            'https://api.biteship.com/v1/rates/couriers',
            [
                'origin_area_id'       => (string) $request->input('origin_area_id'),
                'destination_area_id'      => (string) $request->input('destination_area_id'),
                'couriers'              => implode(',', self::allowedCouriers()),
                'items' => collect($request->input('items', []))->map(fn($i) => [
                    'name'     => (string) $i['name'],
                    'sku'      => (string) $i['sku'],
                    'value'    => (float)  $i['value'],
                    'quantity' => (int)    $i['quantity'],
                    'weight'   => (float)  $i['weight'], // grams
                ])->all(),
            ]
        );

        $rates = $this->filterAllowedRates($response->json());

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
                "couriers" => implode(',', self::allowedCouriers()),
                "items" => $request->items
            ]);

        return $this->filterAllowedRates($response->json());
    }
}
