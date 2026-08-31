<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Storefront performance audit fix #5: the product grid, cart, and
     * search suggestions all currently load the full-size original image
     * (AwsS3::uploadToS3 stores whatever was uploaded, unmodified). This
     * column holds a small (~400px) resized variant generated at upload
     * time, so those views can load something much lighter than the
     * original — which is still kept, for the product-detail hero image.
     *
     * Nullable + not backfilled: existing pictures uploaded before this
     * change simply have no thumbnail_url, and the frontend falls back to
     * the original `url` for those.
     */
    public function up(): void
    {
        Schema::table('product_pictures', function (Blueprint $table) {
            $table->string('thumbnail_url')->nullable()->after('url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_pictures', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });
    }
};
