<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'division';

    protected $fillable = [
        'name',
        'description',
        'sub_category_id',
        'price',
        'discount',
        'total_stock'
    ];

    public function stocks()
    {
        return $this->hasMany(DivisionStock::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_division')
            ->withPivot(['use_division_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function sub_category()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id', 'id');
    }

    public function variants()
    {
        return $this->hasMany(Variant::class);
    }
}
