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

    protected $appends = ['price_per_product'];

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

    public function getPricePerProductAttribute()
    {
        $total = 0;

        if ($this->product) {
            $price = $this->product->product_price;

            $eventDiscount = ($this->product->event && ($this->product->event->is_active ?? false)) ? $this->product->event->discount : 0;
            $productDiscount = $this->product->product_discount ?? 0;
            $appliedDiscount = $eventDiscount > 0 ? $eventDiscount : $productDiscount;

            if ($appliedDiscount) {
                $discountPercent = $appliedDiscount;
                $price = $price - ($price * $discountPercent / 100);
            }

            $total += $price;
        }

        if ($this->subCategory) {
            $price = $this->subCategory->price ?? 0;

            $pivot = $this->product?->subcategories()
                ->where('sub_category_id', $this->sub_category_id)
                ->first()?->pivot;

            if ($pivot) {
                if ($pivot->use_subcategory_discount && $this->subCategory->discount) {
                    $discountPercent = $this->subCategory->discount;
                    $price = $price - ($price * $discountPercent / 100);
                }

                if ($pivot->manual_discount) {
                    $discountPercent = $pivot->manual_discount;
                    $price = $price - ($price * $discountPercent / 100);
                }
            }

            $total += $price;
        }

        if ($this->division) {
            $price = $this->division->price ?? 0;

            $pivot = $this->product?->divisions()
                ->where('division_id', $this->division_id)
                ->first()?->pivot;

            if ($pivot) {
                if ($pivot->use_division_discount && $this->division->discount) {
                    $discountPercent = $this->division->discount;
                    $price = $price - ($price * $discountPercent / 100);
                }

                if ($pivot->manual_discount) {
                    $discountPercent = $pivot->manual_discount;
                    $price = $price - ($price * $discountPercent / 100);
                }
            }

            $total += $price;
        }

        if ($this->variant) {
            $price = $this->variant->price ?? 0;

            $pivot = $this->product?->variants()
                ->where('variant_id', $this->variant_id)
                ->first()?->pivot;

            if ($pivot) {
                if ($pivot->use_variant_discount && $this->variant->discount) {
                    $discountPercent = $this->variant->discount;
                    $price = $price - ($price * $discountPercent / 100);
                }

                if ($pivot->manual_discount) {
                    $discountPercent = $pivot->manual_discount;
                    $price = $price - ($price * $discountPercent / 100);
                }
            }

            $total += $price;
        }

        return max($total, 0);
    }
}
