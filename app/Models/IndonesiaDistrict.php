<?php


namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class IndonesiaDistrict extends Model { 
    protected $fillable=['code','city_code','province_code','name']; 
    public $table='indonesia_districts'; 
}
