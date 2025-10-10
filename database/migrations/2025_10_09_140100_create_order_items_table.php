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
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');

            $table->uuid('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->text('product_description')->nullable();

            $table->uuid('category_id')->nullable();
            $table->string('category_name')->nullable();
            $table->text('category_description')->nullable();

            $table->uuid('sub_category_id')->nullable();
            $table->string('sub_category_name')->nullable();
            $table->text('sub_category_description')->nullable();

            $table->uuid('division_id')->nullable();
            $table->string('division_name')->nullable();
            $table->text('division_description')->nullable();

            $table->uuid('variant_id')->nullable();
            $table->string('variant_name')->nullable();
            $table->text('variant_description')->nullable();

            $table->integer('quantity')->default(1);
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
