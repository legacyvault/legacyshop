<?php

namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class IndonesiaCity extends Model 
{ 
    protected $fillable=['code','province_code','name','type']; 
    public $table='indonesia_cities'; 
}

