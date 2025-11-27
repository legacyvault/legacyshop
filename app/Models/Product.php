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
        'product_group_id',
        'description',
        'total_stock',
        'unit_id',
        'sub_unit_id',
        'product_price',
        'product_usd_price',
        'product_weight',
        'product_discount',
        'is_showcase_top',
        'is_showcase_bottom'
    ];

    protected $casts = [
        'is_showcase_top' => 'boolean',
        'is_showcase_bottom' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($product) {
            // Only generate SKU if it's empty
            if (empty($product->product_sku)) {
                $product->product_sku = self::generateSku($product);
            }
        });
    }

    public static function generateSku($product)
    {
        // Ensure sub_unit exists
        $subUnit = SubUnit::find($product->sub_unit_id);

        if (!$subUnit) {
            throw new \Exception("Sub unit not found for SKU generation.");
        }

        // Prefix = first letter of SubUnit + first letter of Product name
        $subUnitInitial = strtoupper(substr($subUnit->name, 0, 1));
        $productInitial = strtoupper(substr($product->product_name, 0, 1));

        $prefix = $subUnitInitial . $productInitial; // Example: PC

        // Get the most recent SKU starting with this prefix
        $lastProduct = self::where('product_sku', 'like', $prefix . '%')
            ->orderBy('product_sku', 'desc')
            ->first();

        if ($lastProduct) {
            // Extract the number at the end (no zero padding)
            preg_match('/(\d+)$/', $lastProduct->product_sku, $matches);
            $number = isset($matches[1]) ? intval($matches[1]) + 1 : 1;
        } else {
            $number = 1;
        }

        return $prefix . $number; // PC1, PC2, PC3, ...
    }

    public function product_group()
    {
        return $this->belongsTo(ProductGroup::class);
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'id');
    }

    public function sub_unit()
    {
        return $this->belongsTo(SubUnit::class, 'sub_unit_id', 'id');
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
