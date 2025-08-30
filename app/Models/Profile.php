<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Profile extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'profile';


    protected $fillable = [
        'name',
        'user_id',
        'phone',
        'address',
        'city',
        'province',
        'country',
        'postal_code',
    ];
}
