<?php

namespace App\Http\Controllers;

use App\Models\Carts;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\OrderShipments;
use Illuminate\Http\Request;
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
            'payment_method' => 'required|string', // e.g. qris
            'courier_code' => 'required|string',
            'courier_name' => 'required|string',
            'courier_service' => 'required|string',
            'courier_service_name' => 'required|string',
            'shipping_fee' => 'required|numeric',
            'shipping_duration_range' => 'nullable|string',
            'shipping_duration_unit' => 'nullable|string',
            'receiver_name' => 'required|string',
            'receiver_phone' => 'required|string',
            'receiver_address' => 'required|string',
            'receiver_postal_code' => 'required|string',
            'receiver_city' => 'required|string',
            'receiver_province' => 'required|string',
        ]);

        $user = $request->user();

        $cartItems = Carts::with([
            'product',
            'category',
            'subCategory',
            'division',
            'variant',
            'product.unit',
            'product.categories',
            'product.subcategories',
            'product.divisions',
            'product.variants',
            'product.pictures',
        ])->where('user_id', $user->id)->get();
        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        $subtotal = $cartItems->sum(function ($cart) {
            return $cart->price_per_product * $cart->quantity;
        });

        $shippingFee = $request->shipping_fee;
        $grandTotal = $subtotal + $shippingFee;

        DB::beginTransaction();
        try {
            $order = Order::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'grand_total' => $grandTotal,
                'payment_method' => $request->payment_method,
                'payment_status' => 'unpaid',
                'status' => 'pending',
            ]);

            foreach ($cartItems as $item) {
                OrderItems::create([
                    'id' => Str::uuid(),
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'category_id' => $item->category_id,
                    'sub_category_id' => $item->sub_category_id,
                    'division_id' => $item->division_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price_per_product,
                    'total' => $item->quantity * $item->price_per_product,
                ]);
            }

            OrderShipments::create([
                'id' => Str::uuid(),
                'order_id' => $order->id,
                'courier_code' => $request->courier_code,
                'courier_name' => $request->courier_name,
                'courier_service' => $request->courier_service,
                'courier_service_name' => $request->courier_service_name,
                'shipping_duration_range' => $request->shipping_duration_range,
                'shipping_duration_unit' => $request->shipping_duration_unit,
                'shipping_fee' => $shippingFee,
                'receiver_name' => $request->receiver_name,
                'receiver_phone' => $request->receiver_phone,
                'receiver_address' => $request->receiver_address,
                'receiver_postal_code' => $request->receiver_postal_code,
                'receiver_city' => $request->receiver_city,
                'receiver_province' => $request->receiver_province,
            ]);

            Carts::where('user_id', $user->id)->delete();

            DB::commit();

            // 5️⃣ (Opsional) Kirim ke Midtrans QRIS untuk payment
            return $this->createMidtransPayment($order);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Checkout failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function createMidtransPayment($order)
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
}
