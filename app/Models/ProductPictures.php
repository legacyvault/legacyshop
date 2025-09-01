<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductPictures extends Model
{
    use HasUuids;

    protected $table = 'product_pictures';

    protected $fillable = [
        'url',
        'product_id',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
