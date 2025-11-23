<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MainInternationalShipment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'main_international_shipment';


    protected $fillable = [
        'name',
        'description',
        'usd_price'
    ];

    public function zones()
    {
        return $this->hasMany(ZoneInternationalShipment::class, 'international_shipment_id');
    }
}
