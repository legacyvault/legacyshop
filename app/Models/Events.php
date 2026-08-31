<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Events extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'events';

    protected $fillable = [
        'name',
        'description',
        'picture_url',
        'thumbnail_url',
        'discount',
        'is_active',
        'show_on_navbar',
        'show_on_homepage',
        'show_products_on_homepage'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_on_navbar' => 'boolean',
        'show_on_homepage' => 'boolean',
        'show_products_on_homepage' => 'boolean',
    ];

    protected static function booted()
    {
        // static::saving(function ($events) {
        //     // Only enforce if is_active is being set to 1
        //     if ($events->is_active) {
        //         $activeCount = self::where('is_active', 1)
        //             ->when($events->id, function ($query) use ($events) {
        //                 // Exclude the current record if updating
        //                 return $query->where('id', '<>', $events->id);
        //             })
        //             ->count();

        //         if ($activeCount >= 3) {
        //             throw new \Exception("Maximum of 3 active events allowed.");
        //         }
        //     }
        // });
    }

    public function event_products()
    {
        return $this->hasMany(EventProducts::class, 'event_id');
    }
}
