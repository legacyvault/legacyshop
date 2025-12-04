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
        Schema::create('voucher', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('voucher_code')->unique();
            $table->integer('limit')->nullable();
            $table->boolean('is_limit')->default(0);
            $table->timestamps();
        });

        Schema::create('voucher_product', function (Blueprint $table) {
            $table->id();
            $table->uuid('voucher_id');
            $table->uuid('product_id');
            $table->timestamps();

            $table->foreign('voucher_id')->references('id')->on('voucher')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher');
        Schema::dropIfExists('voucher_product');
    }
};
