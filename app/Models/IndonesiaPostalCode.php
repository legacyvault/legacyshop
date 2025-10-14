<?php

namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class IndonesiaPostalCode extends Model 
{ 
    protected $fillable=['village_code','postal_code']; 
    public $table='indonesia_postal_codes'; 
}

