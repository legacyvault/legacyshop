<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Carts;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\OrderShipments;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\DeliveryAddress;
use App\Models\Division;
use App\Models\Events;
use App\Models\Guest;
use App\Models\Product;
use App\Models\Profile;
use App\Models\SubCategory;
use App\Models\Variant;
use App\Models\VoucherModel;
use App\Models\Warehouse;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\File;
use Milon\Barcode\DNS1D;

class OrderController extends Controller
{
    use AwsS3;

    protected $serverKey;
    protected $clientKey;
    protected $apiUrl;
    private $baseUrlBiteship = "https://api.biteship.com/v1";
    private $biteshipApiKey;

    public function __construct()
    {
        $this->serverKey = env('MIDTRANS_SERVER_KEY');
        $this->clientKey = env('MIDTRANS_CLIENT_KEY');
        $this->apiUrl = 'https://api.sandbox.midtrans.com';
        $this->biteshipApiKey = env('BITESHIP_API_KEY');
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
            'voucher_code'            => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|uuid',
            'items.*.product_name' => 'required|string',
            'items.*.product_description' => 'nullable|string',
            'items.*.product_sku' => 'required|string',
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


        DB::beginTransaction();

        $isManualInvoice = $request->boolean('is_manual_invoice') || $request->input('source') === 'manual_invoice';
        $items = $request->items;

        $activeEvents = Events::with('event_products')
            ->where('is_active', true)
            ->get();

        $eventProductDiscounts = [];

        foreach ($activeEvents as $event) {
            foreach ($event->event_products as $ep) {
                $eventProductDiscounts[$ep->product_id] = $event->discount;
            }
        }

        $shippingFee = $request->shipping_fee;
        $subtotal = 0;
        $eventDiscountTotal = 0;

        foreach ($items as &$item) {
            $lineTotal = $item['quantity'] * $item['price'];
            $subtotal += $lineTotal;

            $eventDiscount = 0;

            if (
                !empty($item['product_id']) &&
                isset($eventProductDiscounts[$item['product_id']])
            ) {
                $eventDiscount = min(
                    $eventProductDiscounts[$item['product_id']] * $item['quantity'],
                    $lineTotal
                );
            }

            $item['event_discount'] = $eventDiscount;
            $item['total_after_event'] = $lineTotal - $eventDiscount;

            $eventDiscountTotal += $eventDiscount;
        }
        unset($item);

        $subtotalAfterEvent = max(0, $subtotal - $eventDiscountTotal);
        $voucherDiscount = 0;
        $eligibleProductIds = [];

        if ($request->filled('voucher_code')) {
            $voucher = VoucherModel::with('products')
                ->where('voucher_code', $request->voucher_code)
                ->lockForUpdate()
                ->first();

            if ($voucher) {
                $productIdsInCart = collect($items)->pluck('product_id')->filter()->toArray();

                $eligibleProductIds = $voucher->products()
                    ->whereIn('products.id', $productIdsInCart)
                    ->pluck('products.id')
                    ->toArray();

                if (!empty($eligibleProductIds) && (!$voucher->is_limit || $voucher->limit > 0)) {
                    $voucherBaseTotal = 0;

                    foreach ($items as &$item) {
                        if (!empty($item['product_id']) && in_array($item['product_id'], $eligibleProductIds)) {
                            $voucherBaseTotal += $item['total_after_event'];
                            $item['voucher_discount'] = min($voucher->discount, $item['total_after_event']);
                        } else {
                            $item['voucher_discount'] = 0;
                        }
                    }
                    unset($item);

                    $voucherDiscount = min($voucher->discount, $voucherBaseTotal);
                }
            }
        }

        $grandTotal = max(
            0,
            $subtotalAfterEvent - $voucherDiscount + $shippingFee
        );

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
                'voucher_code' => $voucher?->voucher_code,
                'shipping_fee' => $shippingFee,
                'grand_total' => $grandTotal,
                'payment_method' => $request->payment_method,
                'payment_status' => $isManualInvoice ? 'payment_received' : 'awaiting_payment',
                'status' => $isManualInvoice ? 'finished' : 'pending',
                'paid_at' => $isManualInvoice ? now() : null,
            ]);

            if ($voucher && $voucher->is_limit && $voucherDiscount > 0) {
                $voucher->decrement('limit', 1);
            }

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
                    'product_sku' => $item['product_sku'] ?? null,
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

            // Minus stock
            try {
                foreach ($items as $item) {
                    if (!empty($item['variant_id'])) {
                        $variant = Variant::find($item['variant_id']);
                        if ($variant) {
                            $newStock = max(0, $variant->total_stock - $item['quantity']);
                            $variant->update(['total_stock' => $newStock]);
                        }
                    }
                    if (!empty($item['division_id'])) {
                        $division = Division::find($item['division_id']);
                        if ($division) {
                            $newStock = max(0, $division->total_stock - $item['quantity']);
                            $division->update(['total_stock' => $newStock]);
                        }
                    }

                    if (!empty($item['sub_category_id'])) {
                        $subCategory = SubCategory::find($item['sub_category_id']);
                        if ($subCategory) {
                            $newStock = max(0, $subCategory->total_stock - $item['quantity']);
                            $subCategory->update(['total_stock' => $newStock]);
                        }
                    }

                    if (!empty($item['product_id'])) {
                        $product = Product::find($item['product_id']);
                        if ($product) {
                            $newStock = max(0, $product->total_stock - $item['quantity']);
                            $product->update(['total_stock' => $newStock]);
                        }
                    }
                }
            } catch (Exception $e) {
                Log::error('Error Calculating Stock Checkout: ' . $e);
                throw $e;
            }

            //Create Shipment
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
            $this->createBiteshipDraftOrder($order, $items, $request);

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

    private function createBiteshipDraftOrder($order, $items, $request)
    {
        try {
            $warehouse = Warehouse::where('is_active', 1)->first();

            if ($request->customer_type === 'guest') {
                $destinationName = $request->contact_name;
                $destinationPhone = $request->contact_phone;
                $destinationEmail = $request->email ?? null;
                $destinationAddress = $request->address;
                $destinationPostalCode = $request->postal_code;
                $destinationLatitude = (float) $request->latitude;
                $destinationLongitude = (float) $request->longitude;
            } else {
                $user = Auth::user();
                $profile = Profile::where('user_id', $user->id)->first();
                $delivery_address = DeliveryAddress::where([
                    'profile_id' => $profile->id,
                    'is_active' => 1,
                ])->first();

                $destinationName = $request->receiver_name;
                $destinationPhone = $request->receiver_phone;
                $destinationEmail = $request->user()->email ?? null;
                $destinationAddress = $request->receiver_address;
                $destinationPostalCode = $request->receiver_postal_code;
                $destinationLatitude = (float) optional($delivery_address)->latitude;
                $destinationLongitude = (float) optional($delivery_address)->longitude;
            }

            $pickup_schedule = (int) $warehouse->pickup_schedule;
            $deliveryDate = now()->addDays($pickup_schedule)->format('Y-m-d');
            $deliveryTime = "13:00";


            $payload = [
                'origin_contact_name' => $warehouse->contact_name,
                'origin_contact_phone' => $warehouse->contact_phone,
                'origin_address' => $warehouse->address,
                'origin_postal_code' => $warehouse->postal_code,
                'origin_collection_method' => 'pickup',
                'origin_coordinate' => [
                    'latitude' => $warehouse->latitude,
                    'longitude' => $warehouse->longitude,
                ],

                'destination_contact_name' => $destinationName,
                'destination_contact_phone' => $destinationPhone,
                'destination_contact_email' => $destinationEmail,
                'destination_address' => $destinationAddress,
                'destination_postal_code' => $destinationPostalCode,
                'destination_coordinate' => [
                    'latitude' => $destinationLatitude,
                    'longitude' => $destinationLongitude,
                ],

                'delivery_type' => 'now',
                // 'delivery_date' => $deliveryDate,
                // 'delivery_time' => $deliveryTime,
                'courier_company' => $request->courier_code,
                'courier_type' => $request->courier_service,
                'order_note' => $order->order_number,

                'items' => collect($items)->map(function ($item) {
                    $product = Product::find($item['product_id']);
                    $productWeight = $product ? (float) $product->product_weight : 0;
                    $quantity = (int) ($item['quantity'] ?? 1);
                    $price = (float) ($item['price'] ?? 0);
                    $total = $price * $quantity;

                    return [
                        'name' => $item['product_name'] ?? '-',
                        'description' => $item['product_description'] ?? '-',
                        'value' => $total,
                        'quantity' => $quantity,
                        'weight' => $productWeight * $quantity,
                    ];
                })->toArray(),
            ];

            $response = Http::withToken($this->biteshipApiKey)
                ->post($this->baseUrlBiteship . '/draft_orders', $payload);

            if (!$response->successful()) {
                Log::error('Biteship Draft Order Failed: ' . $response->body());
                return null;
            }

            $data = $response->json();

            $orderShipment = OrderShipments::where('order_id', $order->id)->first();
            if ($orderShipment) {
                $orderShipment->biteship_draft_order_id = $data['id'];
                $orderShipment->save();
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Error Creating Biteship Draft Order: ' . $e->getMessage());
            return null;
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

    //Currently use SNAP
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
                    'payment_status' => 'awaiting_payment',
                    'status' => 'pending',
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
            if (isset($statusData['transaction_status']) && $statusData['transaction_status'] === 'pending') {
                $redirectUrl = 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $order->snap_token;

                return response()->json([
                    'status' => 'pending',
                    'snap_token' => $order->snap_token,
                    'order_id' => $order->order_number,
                    'redirect_url' => $redirectUrl,
                    'message' => 'Transaction still pending, using existing Snap token.'
                ]);
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

    public function handleNotification(Request $request)
    {
        try {
            $notification = $request->all();

            $orderId = $notification['order_id'] ?? null;
            $transaction_id = $notification['transaction_id'] ?? null;
            $transaction_status = $notification['transaction_status'] ?? null;
            $expiry_time = $notification['expiry_time'] ?? null;

            if (!$orderId) {
                return response()->json(['error' => 'Missing order_id'], 400);
            }

            $order = Order::where('order_number', $orderId)->first();

            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            if ($transaction_status == 'expire') {

                $orderItems = $order->items()->get();

                foreach ($orderItems as $item) {
                    try {
                        if (!empty($item->variant_id)) {
                            $variant = Variant::find($item->variant_id);
                            if ($variant) {
                                $variant->update([
                                    'total_stock' => $variant->total_stock + $item->quantity
                                ]);
                            }
                        }

                        if (!empty($item->division_id)) {
                            $division = Division::find($item->division_id);
                            if ($division) {
                                $division->update([
                                    'total_stock' => $division->total_stock + $item->quantity
                                ]);
                            }
                        }

                        if (!empty($item->sub_category_id)) {
                            $subCategory = SubCategory::find($item->sub_category_id);
                            if ($subCategory) {
                                $subCategory->update([
                                    'total_stock' => $subCategory->total_stock + $item->quantity
                                ]);
                            }
                        }
                        if (!empty($item->product_id)) {
                            $product = Product::find($item->product_id);
                            if ($product) {
                                $product->update([
                                    'total_stock' => $product->total_stock + $item->quantity
                                ]);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error("Failed to restore stock for item {$item->id}: " . $e->getMessage());
                    }
                }

                // Restore voucher limit
                if ($order->voucher_code) {
                    $voucher = VoucherModel::where('voucher_code', $order->voucher_code)->first();

                    if ($voucher && $voucher->is_limit) {
                        $voucher->increment('limit', 1);
                    }
                }

                $order->update([
                    'transaction_status' => $transaction_status,
                    'transaction_expiry_time' => $expiry_time,
                    'payment_status' => 'payment_failed',
                    'status' => 'order_failed',
                ]);

                Log::info("Order {$orderId} expired — stock restored and order updated.");
            } else if ($transaction_status == 'settlement') {
                $order->update([
                    'transaction_status' => $transaction_status,
                    'transaction_expiry_time' => $expiry_time,
                    'payment_status' => 'payment_received',
                    'status' => 'preparing_order',
                ]);
            } else if ($transaction_status == 'pending') {
                $order->update([
                    'transaction_status' => $transaction_status,
                    'transaction_expiry_time' => $expiry_time,
                ]);
            }
            return response()->json(['message' => 'OK'], 200);
        } catch (Exception $e) {
            Log::error('[SECURITY AUDIT] Error handle notification: ' . $e);
            return response()->json(['error' => 'Handle notification failed'], 500);
        }
    }

    public function confirmOrder($id)
    {
        try {
            $order = Order::with(['user.profile', 'guest', 'items.product', 'shipment'])->findOrFail($id);
            $orderShipment = $order->shipment;

            if (!$orderShipment) {
                return response()->json(['error' => 'Shipment data is missing for this order.'], 422);
            }

            if (empty($orderShipment->biteship_draft_order_id)) {
                return response()->json(['error' => 'Biteship draft order is not available for this shipment.'], 422);
            }

            $confirmResponse = Http::retry(3, 500)
                ->withToken($this->biteshipApiKey)
                ->post($this->baseUrlBiteship . '/draft_orders/' . $orderShipment->biteship_draft_order_id . '/confirm')
                ->throw();

            // Log::info('Order confirmed and draft order finalized.', [
            //     'order_id' => $order->id,
            //     'order_number' => $order->order_number,
            //     'biteship_response' => $confirmResponse->json(),
            // ]);

            $biteshipData = $confirmResponse->json();
            $logoPath = public_path('logo.png');
            $logoBase64 = null;

            if (is_readable($logoPath)) {
                $logoBase64 = 'data:image/' . pathinfo($logoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoPath));
            }

            $items = collect($order->items ?? []);
            $awbNumber = trim($biteshipData['courier']['waybill_id'] ?? '') ?: $order->order_number;
            $awbBarcode = null;
            $shippingFeeValue = $order->shipping_fee ?? $orderShipment->shipping_fee ?? 0;
            $totalWeight = (int) round($items->sum(function ($item) {
                $weight = $item->product->product_weight ?? 0;
                $quantity = (int) ($item->quantity ?? 0);

                return (float) $weight * $quantity;
            }));

            if (!empty($awbNumber)) {
                $barcodeStoragePath = storage_path('app/barcodes/');

                if (!File::isDirectory($barcodeStoragePath)) {
                    File::makeDirectory($barcodeStoragePath, 0755, true);
                }

                $barcodeGenerator = new DNS1D();
                $barcodeGenerator->setStorPath($barcodeStoragePath);
                $awbBarcode = $barcodeGenerator->getBarcodePNG($awbNumber, 'C128', 2, 70);
            }


            $pdf = Pdf::loadView('pdf.shipping-label', [
                'order' => $order,
                'shipment' => $orderShipment,
                'items' => $items,
                'customer' => $order->user ?? $order->guest,
                'logoBase64' => $logoBase64,
                'awbNumber' => $awbNumber,
                'awbBarcode' => $awbBarcode,
                'shippingFeeValue' => $shippingFeeValue,
                'totalWeight' => $totalWeight,
                'confirmedAt' => now(),
            ])->setPaper('a5', 'portrait');

            $fileName = 'shipping-label-' . $order->order_number . '.pdf';
            $pdfContent = $pdf->output();
            $pathPrefix = "shipping-labels/" . date('Y/m/d');
            $fullPath = "{$pathPrefix}/{$fileName}";

            // Upload ke S3
            $s3Url = $this->uploadPdfToS3($pdfContent, $fullPath);

            $orderShipment->shipping_label_url = $s3Url;
            $orderShipment->tracking_url = $biteshipData['courier']['link'];
            $orderShipment->waybill_number = $biteshipData['courier']['waybill_id'];
            $orderShipment->save();

            $order->status = 'order_confirmed';
            $order->save();

            return $pdf->stream($fileName);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Order not found.'], 404);
        } catch (Exception $e) {
            Log::error('[SECURITY AUDIT] Error Handle Confirm Order: ' . $e);
            return response()->json(['error' => 'Handle Confirm Order Failed'], 500);
        }
    }
}
