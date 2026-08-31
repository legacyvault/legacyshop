<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Storefront performance audit follow-up: article cover images shown on
     * the homepage and articles listing currently load the full-size
     * original (`image_cover`). This column holds a small (~400px) resized
     * variant generated at upload time, so those listing/card views can
     * load something much lighter — the full-size original is still used
     * for the article detail hero.
     *
     * Nullable + not backfilled: existing articles uploaded before this
     * change simply have no thumbnail_url, and the frontend falls back to
     * `image_cover` for those.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('thumbnail_url')->nullable()->after('image_cover');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });
    }
};
