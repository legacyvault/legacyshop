<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Category extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'category';

    protected $fillable = [
        'name',
        'unit_id',
        'description',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'id');
    }

    public function sub_categories()
    {
        return $this->hasMany(SubCategory::class);
    }
}
