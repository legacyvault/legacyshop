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
        'order_number',
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
            // Find last order
            $latestOrder = self::latest('created_at')->first();

            $lastNumber = $latestOrder
                ? intval(substr($latestOrder->order_number, 4))
                : 0;

            $newNumber = str_pad($lastNumber + 1, 10, '0', STR_PAD_LEFT);

            $order->order_number = 'ORD-' . $newNumber;
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
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
}
