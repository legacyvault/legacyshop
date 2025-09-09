<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'divison';

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
}
