<?php

// app/Models/Invoice.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Invoice extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'invoice_number',
        'status',
        'issued_at',
        'due_at',
        'subtotal',
        'discount_total',
        'tax_total',
        'shipping_total',
        'grand_total',
        'bill_to_name',
        'bill_to_email',
        'bill_to_phone',
        'bill_to_address',
        'bill_to_city',
        'bill_to_province',
        'bill_to_postal_code',
        'bill_to_country',
        'pdf_path',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'due_at'    => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
