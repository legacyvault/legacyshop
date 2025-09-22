<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasUuids;

    protected $table = 'products';

    protected $fillable = [
        'product_name',
        'product_sku',
        'description',
        'unit_id',
        'product_price',
        'product_usd_price',
        'product_discount'
    ];

    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tags::class, 'product_tag', 'product_id', 'tag_id');
    }


    public function categories()
    {
        return $this->belongsToMany(Category::class, 'product_category');
    }

    public function subcategories()
    {
        return $this->belongsToMany(SubCategory::class, 'product_sub_category')
            ->withPivot(['use_subcategory_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function divisions()
    {
        return $this->belongsToMany(Division::class, 'product_division')
            ->withPivot(['use_division_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function variants()
    {
        return $this->belongsToMany(Variant::class, 'product_variant')
            ->withPivot(['use_variant_discount', 'manual_discount', 'stock'])
            ->withTimestamps();
    }

    public function pictures()
    {
        return $this->hasMany(ProductPictures::class);
    }
}
