<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'variant';

    protected $fillable = [
        'name',
        'description',
        'division_id',
        'price',
        'discount',
        'total_stock'
    ];

    public function stocks()
    {
        return $this->hasMany(DivisionStock::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'division_id', 'id');
    }
}
