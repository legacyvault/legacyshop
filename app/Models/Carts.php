<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Carts extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'carts';

    protected $fillable = [
        'user_id',
        'product_id',
        'category_id',
        'sub_category_id',
        'division_id',
        'variant_id',
        'quantity'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }
}
