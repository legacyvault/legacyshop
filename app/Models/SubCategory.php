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
        'discount',
        'total_stock'
    ];

    public function stocks()
    {
        return $this->hasMany(SubCategoryStock::class);
    }
}
