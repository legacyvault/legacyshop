<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'orders';

    protected $fillable = [
        'id',
        'user_id',
        'guest_id',
        'order_number',
        'transaction_id',
        'transaction_status',
        'transaction_time',
        'transaction_expiry_time',
        'snap_token',
        'subtotal',
        'shipping_fee',
        'grand_total',
        'payment_method',
        'payment_status',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            // Ambil order terakhir berdasarkan urutan angka di order_number
            $latestOrder = self::orderBy('created_at', 'desc')->first();

            if ($latestOrder && preg_match('/ORDERTESTNEWASD-(\d+)/', $latestOrder->order_number, $matches)) {
                $lastNumber = intval($matches[1]);
            } else {
                $lastNumber = 0;
            }

            $newNumber = str_pad($lastNumber + 1, 10, '0', STR_PAD_LEFT);
            $order->order_number = 'ORDERTESTNEWA-' . $newNumber;
        });
    }


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItems::class);
    }

    public function shipment()
    {
        return $this->hasOne(OrderShipments::class);
    }

    public function totalQuantity()
    {
        return $this->items->sum('quantity');
    }

    public function getCustomerAttribute()
    {
        return $this->user ?? $this->guest;
    }
}
