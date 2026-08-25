<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'testimonials';

    protected $fillable = [
        'name',
        'instagram_account',
        'message',
        'picture_url',
        'thumbnail_url',
    ];
}
