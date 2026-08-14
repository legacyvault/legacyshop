<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Storefront performance audit fix #1: the products/product_pictures
     * queries behind the storefront listing, homepage showcases, and
     * search dropdown (ProductController::getAllProduct) filter/sort on
     * these columns with no supporting index today.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('unit_id');
            $table->index('sub_unit_id');
            $table->index('product_group_id');
            $table->index('is_showcase_top');
            $table->index('is_showcase_bottom');
            $table->index('product_name');
        });

        Schema::table('product_pictures', function (Blueprint $table) {
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['unit_id']);
            $table->dropIndex(['sub_unit_id']);
            $table->dropIndex(['product_group_id']);
            $table->dropIndex(['is_showcase_top']);
            $table->dropIndex(['is_showcase_bottom']);
            $table->dropIndex(['product_name']);
        });

        Schema::table('product_pictures', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
        });
    }
};
