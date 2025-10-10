<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderShipments extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'order_shipments';

    protected $fillable = [
        'id',
        'order_id',
        'courier_code',
        'courier_name',
        'courier_service',
        'courier_service_name',
        'shipping_duration_range',
        'shipping_duration_unit',
        'shipping_fee',
        'waybill_number',
        'receiver_name',
        'receiver_phone',
        'receiver_address',
        'receiver_postal_code',
        'receiver_city',
        'receiver_province',
        'status',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
