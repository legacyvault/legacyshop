<?php

namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class IndonesiaVillage extends Model 
{ 
    protected $fillable=['code','district_code','city_code','province_code','name']; 
    public $table='indonesia_villages'; 
}
