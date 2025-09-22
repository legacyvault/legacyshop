<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'unit';

    protected $fillable = [
        'name',
        'description',
        'picture_url'
    ];

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
