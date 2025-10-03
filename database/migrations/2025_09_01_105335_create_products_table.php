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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('product_sku');
            $table->string('product_name');
            $table->longText('description');
            $table->integer('total_stock')->default(0);
            $table->float('product_price');
            $table->float('product_usd_price');
            $table->float('product_discount')->nullable();
            $table->string('unit_id');
            $table->boolean('is_showcase')->default(false);
            $table->float('product_weight');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
