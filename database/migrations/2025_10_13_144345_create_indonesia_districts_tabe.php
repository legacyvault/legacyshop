<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
      Schema::create('indonesia_districts', function (Blueprint $t) {
        $t->id();
        $t->string('code', 15)->unique();             // "11.01.01"
        $t->string('city_code', 10);                  // "11.01"
        $t->string('province_code', 10);              // "11"
        $t->string('name', 150);                      // Bakongan
        $t->timestamps();
        $t->index(['city_code','name']);
        $t->foreign('city_code')->references('code')->on('indonesia_cities')->cascadeOnDelete();
        $t->foreign('province_code')->references('code')->on('indonesia_provinces')->cascadeOnDelete();
      });
    }
    public function down(): void { Schema::dropIfExists('indonesia_districts'); }
  };
