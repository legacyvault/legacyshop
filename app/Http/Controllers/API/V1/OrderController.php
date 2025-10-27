<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Carts;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\OrderShipments;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Guest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
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

    public function checkout(Request $request)
    {
        $request->validate([
            'customer_type' => 'required|in:guest,user',
            'is_manual_invoice' => 'sometimes|boolean',
            'source' => 'nullable|string',
            'payment_method' => 'required|string',
            'bank_payment' => 'nullable',
            'courier_code' => 'required|string',
            'courier_name' => 'required|string',
            'courier_service' => 'required|string',
            'courier_service_name' => 'required|string',
            'shipping_fee' => 'required|numeric',
            'receiver_name' => 'required|string',
            'receiver_phone' => 'required|string',
            'receiver_address' => 'required|string',
            'receiver_postal_code' => 'required|string',
            'receiver_city' => 'required|string',
            'receiver_province' => 'required|string',
            'receiver_country' => 'nullable|string',
            'shipping_duration_range' => 'nullable|string',
            'shipping_duration_unit' => 'nullable|string',
            'biteship_destination_id' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|uuid',
            'items.*.product_name' => 'required|string',
            'items.*.product_description' => 'nullable|string',
            'items.*.product_image' => 'nullable|string',
            'items.*.category_id' => 'nullable|uuid',
            'items.*.category_name' => 'nullable|string',
            'items.*.category_description' => 'nullable|string',
            'items.*.sub_category_id' => 'nullable|uuid',
            'items.*.sub_category_name' => 'nullable|string',
            'items.*.sub_category_description' => 'nullable|string',
            'items.*.division_id' => 'nullable|uuid',
            'items.*.division_name' => 'nullable|string',
            'items.*.division_description' => 'nullable|string',
            'items.*.variant_id' => 'nullable|uuid',
            'items.*.variant_name' => 'nullable|string',
            'items.*.variant_description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',

            // Guest validation
            'email' => 'required_if:customer_type,guest|email',
            'contact_name' => 'required_if:customer_type,guest|string',
            'contact_phone' => 'required_if:customer_type,guest|string',
            'latitude' => 'required_if:customer_type,guest|numeric',
            'longitude' => 'required_if:customer_type,guest|numeric',
            'country' => 'required_if:customer_type,guest',
            'province' => 'required_if:customer_type,guest',
            'address' => 'required_if:customer_type,guest',
            'city' => 'required_if:customer_type,guest',
            'district' => 'nullable|string',
            'village' => 'nullable|string',
            'postal_code' => 'required_if:customer_type,guest',
        ]);

        $isManualInvoice = $request->boolean('is_manual_invoice') || $request->input('source') === 'manual_invoice';
        $items = $request->items;
        $subtotal = collect($items)->sum(fn($item) => $item['quantity'] * $item['price']);
        $shippingFee = $request->shipping_fee;
        $grandTotal = $subtotal + $shippingFee;

        DB::beginTransaction();
        try {
            $userId = null;
            $guestId = null;

            // Handle Guest or User
            if ($request->customer_type === 'guest') {
                $guest = Guest::create([
                    'email' => $request->email,
                    'contact_name' => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'biteship_destination_id' => $request->biteship_destination_id ?? null,
                    'country' => $request->receiver_country ?? $request->country ?? 'Indonesia',
                    'province' => $request->receiver_province ?? $request->province,
                    'city' => $request->receiver_city ?? $request->city,
                    'district' => $request->district ?? null,
                    'village' => $request->village ?? null,
                    'address' => $request->receiver_address ?? $request->address,
                    'postal_code' => $request->receiver_postal_code ?? $request->postal_code,
                    'latitude' => $request->latitude !== null ? (float) $request->latitude : 0,
                    'longitude' => $request->longitude !== null ? (float) $request->longitude : 0,
                ]);
                $guestId = $guest->id;
            } else {
                $userId = $request->user()->id;
            }

            // Create Order
            $order = Order::create([
                'id' => Str::uuid(),
                'user_id' => $userId,
                'guest_id' => $guestId,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'grand_total' => $grandTotal,
                'payment_method' => $request->payment_method,
                'payment_status' => $isManualInvoice ? 'paid' : 'unpaid',
                'status' => $isManualInvoice ? 'finished' : 'pending',
                'paid_at' => $isManualInvoice ? now() : null,
            ]);

            if ($isManualInvoice) {
                $order->forceFill([
                    'transaction_status' => 'settlement',
                    'transaction_time' => now(),
                    'transaction_expiry_time' => null,
                    'snap_token' => null,
                ])->save();
            }

            // Create Order Items
            foreach ($items as $item) {
                OrderItems::create([
                    'id' => Str::uuid(),
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? null,
                    'product_description' => $item['product_description'] ?? null,
                    'product_image' => $item['product_image'] ?? null,
                    'category_id' => $item['category_id'] ?? null,
                    'category_name' => $item['category_name'] ?? null,
                    'category_description' => $item['category_description'] ?? null,
                    'sub_category_id' => $item['sub_category_id'] ?? null,
                    'sub_category_name' => $item['sub_category_name'] ?? null,
                    'sub_category_description' => $item['sub_category_description'] ?? null,
                    'division_id' => $item['division_id'] ?? null,
                    'division_name' => $item['division_name'] ?? null,
                    'division_description' => $item['division_description'] ?? null,
                    'variant_id' => $item['variant_id'] ?? null,
                    'variant_name' => $item['variant_name'] ?? null,
                    'variant_description' => $item['variant_description'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $item['quantity'] * $item['price'],
                ]);
            }

            // 🚚 Create Shipment
            OrderShipments::create([
                'id' => Str::uuid(),
                'order_id' => $order->id,
                'courier_code' => $request->courier_code,
                'courier_name' => $request->courier_name,
                'courier_service' => $request->courier_service,
                'courier_service_name' => $request->courier_service_name,
                'shipping_duration_range' => $request->shipping_duration_range ?? null,
                'shipping_duration_unit' => $request->shipping_duration_unit ?? null,
                'shipping_fee' => $shippingFee,
                'receiver_name' => $request->receiver_name,
                'receiver_phone' => $request->receiver_phone,
                'receiver_address' => $request->receiver_address,
                'receiver_postal_code' => $request->receiver_postal_code,
                'receiver_city' => $request->receiver_city,
                'receiver_province' => $request->receiver_province,
            ]);

            // Delete cart if user
            if ($userId) {
                $productIds = collect($items)->pluck('product_id')->filter()->toArray();
                if (!empty($productIds)) {
                    Carts::where('user_id', $userId)
                        ->whereIn('product_id', $productIds)
                        ->delete();
                }
            }

            DB::commit();

            if ($isManualInvoice) {
                $order->load(['items', 'shipment', 'guest', 'user']);

                return response()->json([
                    'message' => 'Order created successfully without payment processing.',
                    'order' => $order,
                ], 201);
            }

            // Call payment gateway
            return $this->createMidtransSnapPayment($order);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Checkout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createMidtransPayment($order, $payment_method, $bank)
    {
        try {
            $user = $order->user;
            $orderItems = $order->items()->with('product')->get();
            $itemDetails = $orderItems->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'price' => (int) $item->price,
                    'quantity' => (int) $item->quantity,
                    'name' => substr($item->product->name ?? 'Unknown Product', 0, 50),
                ];
            })->toArray();

            $itemDetails[] = [
                'id' => 'shipping_fee',
                'price' => (int) $order->shipping_fee,
                'quantity' => 1,
                'name' => 'Shipping Fee',
            ];

            if ($payment_method == 'qris') {
                $payload = [
                    'payment_type' => 'qris',
                    'transaction_details' => [
                        'order_id' => $order->order_number,
                        'gross_amount' => (int) $order->grand_total,
                    ],
                    'item_details' => $itemDetails,
                    'customer_details' => [
                        'first_name' => $user->name,
                        'last_name' => '',
                        'email' => $user->email ?? 'noemail@example.com',
                        'phone' => $order->shipment->receiver_phone ?? '',
                    ],
                    'qris' => [
                        'acquirer' => 'gopay',
                    ],
                ];
            } else if ($payment_method == 'bank_transfer') {
                $payload = [
                    'payment_type' => 'bank_transfer',
                    'transaction_details' => [
                        'order_id' => $order->order_number,
                        'gross_amount' => (int) $order->grand_total,
                    ],
                    'item_details' => $itemDetails,
                    'customer_details' => [
                        'first_name' => $user->name,
                        'last_name' => '',
                        'email' => $user->email ?? 'noemail@example.com',
                        'phone' => $order->shipment->receiver_phone ?? '',
                    ],
                    'bank_transfer' => [
                        'bank' => $bank,
                    ],
                ];
            }


            // 🔹 Panggil API Midtrans
            $response = Http::withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->apiUrl . '/v2/charge', $payload);

            $result = $response->json();

            // Cek jika berhasil
            if ($response->successful()) {
                // Simpan response QRIS ke order
                $order->update([
                    'payment_status' => 'pending',
                    'status' => 'awaiting_payment',
                    'transaction_id' => $result['transaction_id'],
                    'transaction_status' => $result['transaction_status'],
                    'transaction_time' => $result['transaction_time'],
                    'transaction_expiry_time' => $result['expiry_time'],
                ]);

                return response()->json([
                    'message' => 'Order created and QRIS generated successfully',
                    'order' => $order->load(['items', 'shipment']),
                    'midtrans_response' => $result,
                ]);
            }

            return response()->json([
                'message' => 'Failed to create QRIS payment',
                'response' => $result,
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Error Create Midtrans Payment : ' . $e);
            return response()->json([
                'message' => 'Error creating Midtrans payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getTransactionStatus($transaction_id)
    {
        $url = "{$this->apiUrl}/v2/{$transaction_id}/status";

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders([
                'Accept' => 'application/json',
            ])
            ->get($url);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans Transaction Status Error', [
            'transaction_id' => $transaction_id,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return redirect()->back()->withErrors('Failed to get transaction status.')->withInput();
    }

    public function createMidtransSnapPayment($order)
    {
        try {
            $customer = $order->user ?? $order->guest;
            $orderItems = $order->items()->with('product')->get();

            $itemDetails = $orderItems->map(function ($item) {
                return [
                    'id' => $item->product_id ?? Str::uuid()->toString(),
                    'price' => (int) $item->price,
                    'quantity' => (int) $item->quantity,
                    'name' => substr($item->product->name ?? $item->product_name ?? 'Unknown Product', 0, 50),
                ];
            })->toArray();

            $itemDetails[] = [
                'id' => 'shipping_fee',
                'price' => (int) $order->shipping_fee,
                'quantity' => 1,
                'name' => 'Shipping Fee',
            ];

            $customerDetails = [
                'first_name' => $customer->name ?? $customer->contact_name ?? 'Guest',
                'last_name'  => '',
                'email'      => $customer->email ?? 'noemail@example.com',
                'phone'      => $order->shipment->receiver_phone ?? $customer->contact_phone ?? '',
            ];

            // Payload
            $payload = [
                'transaction_details' => [
                    'order_id' => $order->order_number,
                    'gross_amount' => (int) $order->grand_total,
                ],
                'item_details' => $itemDetails,
                'customer_details' => $customerDetails,
            ];

            $response = Http::withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post('https://app.sandbox.midtrans.com/snap/v1/transactions', $payload);

            $result = $response->json();

            if ($response->successful()) {
                $order->update([
                    'payment_status' => 'pending',
                    'status' => 'awaiting_payment',
                    'snap_token' => $result['token'],
                ]);

                return $result;
            }

            Log::error('Midtrans Snap Error Response: ' . json_encode($result));
            return redirect()->back()->withErrors('Failed to create payment');
        } catch (\Exception $e) {
            Log::error('Error Create Midtrans Snap Payment: ' . $e->getMessage());
            return redirect()->back()->withErrors('Failed to create payment');
        }
    }

    public function reopenSnapPayment($orderNumber): JsonResponse
    {
        try {
            $order = Order::where('order_number', $orderNumber)->firstOrFail();

            $statusResponse = Http::withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->get($this->apiUrl . '/v2/' . $order->order_number . '/status');


            $statusData = $statusResponse->json();
            $transactionStatus = $statusData['transaction_status'] ?? null;

            if (in_array($transactionStatus, ['expire', 'expired', 'cancel', 'deny', 'failure'], true)) {
                $snapResult = $this->createMidtransSnapPayment($order);

                if (is_array($snapResult) && isset($snapResult['token'])) {
                    $redirectUrl = $snapResult['redirect_url'] ?? ('https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $snapResult['token']);

                    return response()->json([
                        'status' => 'requires_payment',
                        'snap_token' => $snapResult['token'],
                        'order_id' => $order->order_number,
                        'redirect_url' => $redirectUrl,
                        'message' => 'Generated new Snap token because the previous transaction was not completed.',
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to create payment session. Please try again later.',
                ], 500);
            }

            return response()->json([
                'status' => $transactionStatus ?? 'unknown',
                'order_id' => $order->order_number,
                'message' => 'Transaction cannot be reopened in the current state.',
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to re-open payment.',
            ], 500);
        }
    }
}
