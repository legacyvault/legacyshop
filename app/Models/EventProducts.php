<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventProducts extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'event_products';

    protected $fillable = [
        'event_id',
        'product_id'
    ];

    public function event()
    {
        return $this->belongsTo(Events::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
