<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'group_stock';

    protected $fillable = [
        'quantity',
        'group_id',
        'remarks'
    ];

    public function group()
    {
        return $this->belongsTo(ProductGroup::class, 'group_id', 'id');
    }
}
