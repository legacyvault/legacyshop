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
        Schema::create('variant', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('division_id');
            $table->string('name');
            $table->enum('type', ['text', 'color'])->default('text');
            $table->string('color')->nullable();
            $table->string('description')->nullable();
            $table->float('price');
            $table->float('usd_price');
            $table->float('discount')->default(0);
            $table->integer('total_stock')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant');
    }
};
