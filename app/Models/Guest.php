<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'guest';

    protected $fillable = [
        'email',
        'biteship_destination_id',
        'contact_name',
        'contact_phone',
        'country',
        'province',
        'address',
        'city',
        'district',
        'village',
        'postal_code',
        'latitude',
        'longitude',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
