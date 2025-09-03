<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryAddress extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'delivery_address';


    protected $fillable = [
        'name',
        'profile_id',
        'country',
        'province',
        'address',
        'city',
        'postal_code',
        'is_active'
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }
}
