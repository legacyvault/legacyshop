<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'unit';

    protected $fillable = [
        'name',
        'description',
        'picture_url',
        'is_active'
    ];

    protected static function booted()
    {
        static::saving(function ($unit) {
            // Only enforce if is_active is being set to 1
            if ($unit->is_active) {
                $activeCount = self::where('is_active', 1)
                    ->when($unit->id, function ($query) use ($unit) {
                        // Exclude the current record if updating
                        return $query->where('id', '<>', $unit->id);
                    })
                    ->count();

                if ($activeCount >= 6) {
                    throw new \Exception("Maximum of 6 active units allowed.");
                }
            }
        });
    }

    public function sub_unit()
    {
        return $this->hasMany(SubUnit::class);
    }
}
