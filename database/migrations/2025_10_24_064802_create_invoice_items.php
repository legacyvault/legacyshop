<?php

// database/migrations/2025_10_24_000001_create_invoice_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');

            $table->uuid('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->text('product_description')->nullable();
            $table->string('product_image')->nullable();

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

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('invoice_items');
    }
};
