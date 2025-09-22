<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RunningText extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'running_text';

    protected $fillable = [
        'running_text',
        'is_active'
    ];
}
