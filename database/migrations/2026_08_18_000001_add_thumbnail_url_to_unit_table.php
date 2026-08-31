<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Storefront performance audit follow-up: unit showcase tiles on the
     * homepage currently load the full-size original (`picture_url`) as a
     * CSS background-image (so it can't be `loading="lazy"`-ed either).
     * This column holds a small (~400px) resized variant generated at
     * upload time, so the ~350x200px tiles can load something much
     * lighter.
     *
     * Nullable + not backfilled: existing units uploaded before this
     * change simply have no thumbnail_url, and the frontend falls back to
     * `picture_url` for those.
     */
    public function up(): void
    {
        Schema::table('unit', function (Blueprint $table) {
            $table->string('thumbnail_url')->nullable()->after('picture_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unit', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });
    }
};
