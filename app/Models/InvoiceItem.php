<?php

// app/Models/InvoiceItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InvoiceItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'invoice_id',

        'product_id',
        'product_name',
        'product_description',
        'product_image',
        'product_sku',

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

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
