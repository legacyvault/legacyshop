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
        'unit_id',
        'sub_unit_id',
        'description',
        'total_stock',
        'product_price',
        'product_usd_price',
        'product_weight',
        'product_discount',
        'is_showcase_top',
        'is_showcase_bottom'
    ];

    protected $appends = [
        'thumbnail_url',
        'thumbnail_picture_id',
    ];

    protected $casts = [
        'is_showcase_top' => 'boolean',
        'is_showcase_bottom' => 'boolean',
    ];

    // protected static function booted()
    // {
    //     static::creating(function ($product) {
    //         // Only generate SKU if it's empty
    //         if (empty($product->product_sku)) {
    //             $product->product_sku = self::generateSku($product);
    //         }
    //     });
    // }

    public static function generateSku($product)
    {
        $subUnit = SubUnit::find($product->sub_unit_id);

        if (!$subUnit) {
            throw new \Exception("Sub unit not found for SKU generation.");
        }

        $subInitial = strtoupper(substr($subUnit->name, 0, 1));
        $prodInitial = strtoupper(substr($product->product_name, 0, 1));

        $prefix = $subInitial . $prodInitial; // Example: PC

        $last = self::where('product_sku', 'like', $prefix . '%')
            ->orderBy('product_sku', 'desc')
            ->first();

        if ($last && preg_match('/(\d+)$/', $last->product_sku, $m)) {
            $num = intval($m[1]) + 1;
        } else {
            $num = 1;
        }

        return $prefix . $num;
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'id');
    }

    public function subUnit()
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
        // Keep a consistent order so the first picture is the implicit thumbnail
        return $this->hasMany(ProductPictures::class)->orderBy('sort_order')->orderBy('created_at');
    }
    
    public function event_product()
    {
        return $this->hasOne(EventProducts::class, 'product_id', 'id');
    }

    public function event()
    {
        return $this->hasOneThrough(
            Events::class,
            EventProducts::class,
            'product_id', // Foreign key on EventProducts
            'id',         // Foreign key on Events
            'id',         // Local key on Product
            'event_id'    // Local key on EventProducts
        );
    }

    public function getThumbnailUrlAttribute()
    {
        $pictures = $this->relationLoaded('pictures')
            ? $this->pictures
            : $this->pictures()->limit(1)->get();

        return optional($pictures->first())->url;
    }

    public function getThumbnailPictureIdAttribute()
    {
        $pictures = $this->relationLoaded('pictures')
            ? $this->pictures
            : $this->pictures()->select('id', 'product_id')->limit(1)->get();

        return optional($pictures->first())->id;
    }
}
