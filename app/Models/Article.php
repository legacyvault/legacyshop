<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, HasUuids;
    
    protected $table = 'articles';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['title', 'slug', 'content', 'content_html', 'image_cover' ,'is_published', 'published_at'];
    protected $casts = ['content' => 'array', 'is_published' => 'boolean', 'published_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function ($m) {
            $m->id ??= (string) Str::uuid();
            $m->slug ??= Str::slug($m->title) . '-' . Str::random(6);
        });
    }
}
