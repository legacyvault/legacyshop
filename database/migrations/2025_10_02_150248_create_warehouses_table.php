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
        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('biteship_location_id');
            $table->string('name');
            $table->string('contact_name');
            $table->string('contact_phone');
            $table->longText('address');
            $table->string('country')->nullable();
            $table->string('postal_code')->nullable();
            $table->double('latitude');
            $table->double('longitude');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
