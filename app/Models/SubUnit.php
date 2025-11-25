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
        'description',
    ];

    public function units()
    {
        return $this->belongsToMany(Unit::class, 'unit_sub_unit', 'sub_unit_id', 'unit_id');
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
