<?php

namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class IndonesiaProvince extends Model 
{ 
    protected $fillable=['code','name']; 
    public $table='indonesia_provinces'; 
}
