<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItems extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'order_items';

    protected $fillable = [
        'id',
        'order_id',

        'product_id',
        'product_name',
        'product_sku',
        'product_description',
        'product_image',

        'category_id',
        'category_name',
        'category_description',

        'sub_category_id',
        'sub_category_name',
        'sub_category_description',

        'division_id',
        'division_name',
        'division_description',

        'variant_id',
        'variant_name',
        'variant_description',

        'quantity',
        'price',
        'total',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
