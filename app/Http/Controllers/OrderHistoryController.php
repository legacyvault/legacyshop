<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderHistoryController extends Controller
{
    public function getUserOrderHistory(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['items', 'shipment'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return $orders;
    }

    public function getAllOrderHistory(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

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

        $ordersQuery = Order::with(['items', 'shipment', 'user']);

        if ($search) {
            $ordersQuery->where(function ($query) use ($search) {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('shipment', function ($shipmentQuery) use ($search) {
                        $shipmentQuery->where('receiver_name', 'like', "%{$search}%")
                            ->orWhere('receiver_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $ordersQuery->where('status', $status);
        }

        if ($paymentStatus) {
            $ordersQuery->where('payment_status', $paymentStatus);
        }

        if ($transactionStat) {
            $ordersQuery->where('transaction_status', $transactionStat);
        }

        $orders = $ordersQuery
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return $orders;
    }
}
