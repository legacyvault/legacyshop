<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DivisionStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'division_stock';

    protected $fillable = [
        'quantity',
        'division_id',
        'remarks'
    ];

    public function division()
    {
        return $this->belongsTo(Division::class, 'division_id', 'id');
    }
}
