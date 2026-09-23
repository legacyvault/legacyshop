<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'referrals';

    protected $fillable = [
        'name',
        'referral_code',
        'discount',
        'is_active'
    ];

    protected $casts = [
        'discount' => 'float',
        'is_active' => 'boolean',
    ];

    // In Referral model
    public function orders()
    {
        return $this->hasMany(Order::class, 'referral_code', 'referral_code');
    }
}
