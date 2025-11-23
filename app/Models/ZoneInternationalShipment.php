<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ZoneInternationalShipment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'zone_international_shipment';

    protected $fillable = [
        'international_shipment_id',
        'country_code'
    ];

    public function international_shipment()
    {
        return $this->belongsTo(MainInternationalShipment::class);
    }
}
