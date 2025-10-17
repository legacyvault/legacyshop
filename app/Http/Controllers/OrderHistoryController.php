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
        $orders = Order::with(['items', 'shipment'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $orders;
    }
}
