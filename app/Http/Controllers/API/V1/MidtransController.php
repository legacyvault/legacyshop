<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MidtransController extends Controller
{
    protected $serverKey;
    protected $clientKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->serverKey = env('MIDTRANS_SERVER_KEY');
        $this->clientKey = env('MIDTRANS_CLIENT_KEY');
        $this->apiUrl = 'https://api.sandbox.midtrans.com';
    }

    public function generateQRIS(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'value'       => 'required',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $validityPeriod = now('UTC')->addMinutes(30)->toIso8601String();
        Log::info('Test');
        $body = [
            "partnerReferenceNo" => "2020102900000000000001",
            "amount" => [
                "value" => $request->value,
                "currency" => "IDR"
            ],
            "merchantId" => env('MIDTRANS_MERCHANT_ID'),
            "validityPeriod" => $validityPeriod,
            "additionalInfo" => [
                "acquirer" => "gopay"
            ]
        ];

        // Tentukan versi API Midtrans
        $version = "v2";

        // Endpoint QRIS
        $endpoint = "{$this->apiUrl}/{$version}/qr/qr-mpm-generate";

        try {
            $response = Http::withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($endpoint, $body);

            // Cek response dari Midtrans
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json()
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'status' => $response->status(),
                    'error' => $response->json(),
                ], $response->status());
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Request to Midtrans failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
