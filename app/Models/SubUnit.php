<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubUnit extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sub_unit';

    protected $fillable = [
        'name',
        'unit_id',
        'description',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'id');
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
