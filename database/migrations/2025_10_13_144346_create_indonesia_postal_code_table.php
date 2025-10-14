<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
      Schema::create('indonesia_villages', function (Blueprint $t) {
        $t->id();
        $t->string('code', 20)->unique();             
        $t->string('district_code', 15);              
        $t->string('city_code', 10);                  
        $t->string('province_code', 10);             
        $t->string('name', 150);                     
        $t->timestamps();
        $t->index(['district_code','name']);
        $t->foreign('district_code')->references('code')->on('indonesia_districts')->cascadeOnDelete();
        $t->foreign('city_code')->references('code')->on('indonesia_cities')->cascadeOnDelete();
        $t->foreign('province_code')->references('code')->on('indonesia_provinces')->cascadeOnDelete();
      });
    }
    public function down(): void { Schema::dropIfExists('indonesia_villages'); }
  };
