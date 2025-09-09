<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DivisionStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'divison_stock';

    protected $fillable = [
        'quantity',
        'division_id',
        'remarks'
    ];

    public function divison()
    {
        return $this->belongsTo(Division::class, 'divison_id', 'id');
    }
}
