<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategoryStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sub_category_stock';

    protected $fillable = [
        'quantity',
        'sub_category_id',
        'remarks'
    ];

    public function sub_category()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id', 'id');
    }
}
