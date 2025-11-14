<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'warehouses';

    protected $fillable = [
        'name',
        'contact_name',
        'contact_phone',
        'pickup_schedule',
        'address',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'biteship_location_id'
    ];
}
