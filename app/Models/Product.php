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
        'product_price',
        'product_discount',
        'category_id',
        'type_id'
    ];

    public function tags()
    {
        return $this->belongsToMany(Tags::class, 'product_tag', 'product_id', 'tag_id');
    }

    public function pictures()
    {
        return $this->hasMany(ProductPictures::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    public function type()
    {
        return $this->belongsTo(Type::class, 'type_id', 'id');
    }
}
