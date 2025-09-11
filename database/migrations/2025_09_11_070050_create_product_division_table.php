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
        Schema::create('product_division', function (Blueprint $table) {
            $table->uuid('product_id');
            $table->uuid('division_id');

            $table->boolean('use_division_discount')->default(true);

            $table->float('manual_discount')->default(0);

            $table->integer('stock')->nullable();

            $table->timestamps();
            $table->primary(['product_id', 'division_id']);

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('division_id')->references('id')->on('division')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_division');
    }
};
