<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderHistoryController extends Controller
{
    public function getUserOrderHistory(Request $request)
    {
        $user = $request->user();
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
                'shipment', 
                'guest'
            ])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('guest', function ($guestQuery) use ($user) {
                        $guestQuery->where('email', $user->email);
                    });
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

        return $ordersQuery
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());
    }
}
