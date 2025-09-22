<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sub_category';

    protected $fillable = [
        'name',
        'description',
        'category_id',
        'price',
        'usd_price',
        'discount',
        'total_stock'
    ];

    public function stocks()
    {
        return $this->hasMany(SubCategoryStock::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_sub_category')
            ->withPivot(['use_subcategory_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }
}
