<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            $table->uuid('category_id');
            $table->foreign('category_id')->references('id')->on('category')->onDelete('cascade');

            $table->uuid('sub_category_id')->nullable();
            $table->foreign('sub_category_id')->references('id')->on('sub_category')->onDelete('cascade');

            $table->uuid('division_id')->nullable();
            $table->foreign('division_id')->references('id')->on('division')->onDelete('cascade');

            $table->uuid('variant_id')->nullable();
            $table->foreign('variant_id')->references('id')->on('variant')->onDelete('cascade');

            $table->integer('quantity')->default(1);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
