<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'banner';

    protected $fillable = [
        'banner_text',
        'is_active',
        'picture_url',
        'banner_title',
        'button_text',
        'url'
    ];
}
