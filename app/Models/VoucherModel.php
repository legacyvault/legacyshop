<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoucherModel extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'voucher';

    protected $fillable = [
        'name',
        'voucher_code',
        'limit',
        'is_limit',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'voucher_product', 'voucher_id', 'product_id')
            ->withTimestamps();
    }
}
