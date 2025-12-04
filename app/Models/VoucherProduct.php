<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherProduct extends Model
{
    protected $table = 'voucher_product';

    protected $fillable = [
        'voucher_id',
        'product_id'
    ];
}
