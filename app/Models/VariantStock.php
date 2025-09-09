<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VariantStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'variant_stock';

    protected $fillable = [
        'quantity',
        'variant_id',
        'remarks'
    ];

    public function variant()
    {
        return $this->belongsTo(Variant::class, 'variant_id', 'id');
    }
}
