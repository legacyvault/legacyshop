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
        Schema::create('unit_sub_unit', function (Blueprint $table) {
            $table->uuid('unit_id');
            $table->uuid('sub_unit_id');

            $table->foreign('unit_id')->references('id')->on('unit')->onDelete('cascade');
            $table->foreign('sub_unit_id')->references('id')->on('sub_unit')->onDelete('cascade');

            $table->primary(['unit_id', 'sub_unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_sub_unit');
    }
};
