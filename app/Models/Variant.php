<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'variant';

    protected $fillable = [
        'name',
        'description',
        'division_id',
        'price',
        'discount',
        'total_stock',
        'type',
        'color'
    ];

    public function stocks()
    {
        return $this->hasMany(VariantStock::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_variant')
            ->withPivot(['use_variant_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'division_id', 'id');
    }
}
