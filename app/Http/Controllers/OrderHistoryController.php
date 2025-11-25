<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItems;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderHistoryController extends Controller
{
    public function getUserOrderHistory(Request $request)
    {
        $user = Auth::user();
        $perPage = max((int) $request->input('per_page', 15), 1);

        $search          = $request->input('q');
        $status          = $request->input('status');
        $paymentStatus   = $request->input('payment_status');
        $transactionStat = $request->input('transaction_status');
        $productCategory = $request->input('product_category');

        $ordersQuery = Order::with(
            [
                'items' => function($query) {
                    $query->orderBy('product_name', 'asc');
                }, 
                'shipment'
            ])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc');

        if ($search) {
            $ordersQuery->where(function ($query) use ($search) {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery->where('product_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('shipment', function ($shipmentQuery) use ($search) {
                        $shipmentQuery->where('receiver_name', 'like', "%{$search}%")
                            ->orWhere('receiver_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status && $status !== 'all') {
            $ordersQuery->where('status', $status);
        }

        if ($paymentStatus && $paymentStatus !== 'all') {
            $ordersQuery->where('payment_status', $paymentStatus);
        }

        if ($transactionStat && $transactionStat !== 'all') {
            $ordersQuery->where('transaction_status', $transactionStat);
        }

        if ($productCategory && $productCategory !== 'all') {
            $ordersQuery->whereHas('items', function ($itemQuery) use ($productCategory) {
                $itemQuery->where(function ($match) use ($productCategory) {
                    $match->where('category_name', $productCategory)
                        ->orWhere('category_id', $productCategory);
                });
            });
        }

        return $ordersQuery->paginate($perPage)->appends($request->query());
    }

    public function getAllOrderHistory(Request $request)
    {
        $perPage = max((int) $request->input('per_page', 15), 1);
        $search          = $request->input('q');
        $status          = $request->input('status');
        $paymentStatus   = $request->input('payment_status');
        $transactionStat = $request->input('transaction_status');
        $createdFrom     = $request->input('created_from');
        $createdTo       = $request->input('created_to');

        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['order_number', 'payment_status', 'status', 'grand_total', 'created_at', 'transaction_status'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        $ordersQuery = Order::with(
            [
                'items' => function($query) {
                    $query->orderBy('product_name', 'asc');
                }, 
                'shipment', 
                'user.profile', 
                'guest'
            ]);

        if ($search) {
            $ordersQuery->where(function ($query) use ($search) {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('email', 'like', "%{$search}%")
                            ->orWhereHas('profile', function ($profileQuery) use ($search) {
                                $profileQuery->where('name', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('guest', function ($guestQuery) use ($search) {
                        $guestQuery->where('email', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('shipment', function ($shipmentQuery) use ($search) {
                        $shipmentQuery->where('receiver_name', 'like', "%{$search}%")
                            ->orWhere('receiver_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status && $status !== 'all') {
            $ordersQuery->where('status', $status);
        }

        if ($paymentStatus && $paymentStatus !== 'all') {
            $ordersQuery->where('payment_status', $paymentStatus);
        }

        if ($transactionStat && $transactionStat !== 'all') {
            $ordersQuery->where('transaction_status', $transactionStat);
        }

        if ($createdFrom) {
            try {
                $from = Carbon::parse($createdFrom)->startOfDay();
                $ordersQuery->where('created_at', '>=', $from);
            } catch (\Throwable $e) {
                // ignore invalid date input
            }
        }

        if ($createdTo) {
            try {
                $to = Carbon::parse($createdTo)->endOfDay();
                $ordersQuery->where('created_at', '<=', $to);
            } catch (\Throwable $e) {
                // ignore invalid date input
            }
        }

        return $ordersQuery
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());
    }

    public function getOrderItemsSummary(Request $request)
    {
        $perPage = max((int) $request->input('per_page', 15), 1);
        $search = $request->input('q');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $itemsQuery = OrderItems::query()
            ->select(['order_items.*', 'orders.order_number', 'orders.created_at as order_created_at'])
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->with(['order.user.profile', 'order.guest', 'order.shipment'])
            ->where('orders.payment_status', 'payment_received')
            ->where('orders.status', 'preparing_order')
            ->orderBy('orders.created_at', 'desc');

        if ($search) {
            $itemsQuery->where(function ($query) use ($search) {
                $query->where('order_items.product_name', 'like', "%{$search}%")
                    ->orWhere('order_items.product_sku', 'like', "%{$search}%")
                    ->orWhere('orders.order_number', 'like', "%{$search}%")
                    ->orWhereHas('order.user.profile', function ($profileQuery) use ($search) {
                        $profileQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('order.guest', function ($guestQuery) use ($search) {
                        $guestQuery->where('contact_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('order.shipment', function ($shipmentQuery) use ($search) {
                        $shipmentQuery->where('receiver_name', 'like', "%{$search}%")
                            ->orWhere('receiver_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($dateFrom) {
            try {
                $from = Carbon::parse($dateFrom)->startOfDay();
                $itemsQuery->where('orders.created_at', '>=', $from);
            } catch (\Throwable $e) {
                // ignore invalid date input
            }
        }

        if ($dateTo) {
            try {
                $to = Carbon::parse($dateTo)->endOfDay();
                $itemsQuery->where('orders.created_at', '<=', $to);
            } catch (\Throwable $e) {
                // ignore invalid date input
            }
        }

        return $itemsQuery
            ->paginate($perPage)
            ->appends($request->query());
    }
}
