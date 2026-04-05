<?php

namespace App\Jobs;

use App\Models\Division;
use App\Models\Order;
use App\Models\Product;
use App\Models\SubCategory;
use App\Models\Variant;
use App\Models\VoucherModel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;


class ExpirePendingOrdersJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $expiredOrders = Order::where('payment_status', 'awaiting_payment')
            ->where('status', 'pending')
            ->where('transaction_status', '!=', 'expire')
            ->where('created_at', '<=', Carbon::now()->subHours(3))
            ->get();

        foreach ($expiredOrders as $order) {
            try {
                Log::info("Processing expired order: {$order->id}");

                $orderItems = $order->items()->get();

                foreach ($orderItems as $item) {
                    try {
                        if (!empty($item->variant_id)) {
                            $variant = Variant::find($item->variant_id);
                            if ($variant) {
                                $variant->increment('total_stock', $item->quantity);
                            }
                        }

                        if (!empty($item->division_id)) {
                            $division = Division::find($item->division_id);
                            if ($division) {
                                $division->increment('total_stock', $item->quantity);
                            }
                        }

                        if (!empty($item->sub_category_id)) {
                            $subCategory = SubCategory::find($item->sub_category_id);
                            if ($subCategory) {
                                $subCategory->increment('total_stock', $item->quantity);
                            }
                        }

                        if (!empty($item->product_id)) {
                            $product = Product::find($item->product_id);
                            if ($product) {
                                $product->increment('total_stock', $item->quantity);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error("Stock restore failed for item {$item->id}: " . $e->getMessage());
                    }
                }

                // Restore voucher
                if ($order->voucher_code) {
                    $voucher = VoucherModel::where('voucher_code', $order->voucher_code)->first();
                    if ($voucher && $voucher->is_limit) {
                        $voucher->increment('limit', 1);
                    }
                }

                $order->update([
                    'transaction_status' => 'expire',
                    'payment_status' => 'payment_failed',
                    'status' => 'order_failed',
                ]);
            } catch (\Exception $e) {
                Log::error("Failed processing order {$order->id}: " . $e->getMessage());
            }
        }
    }
}
