<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
      Schema::create('indonesia_cities', function (Blueprint $t) {
        $t->id();
        $t->string('code', 10)->unique();             
        $t->string('province_code', 10);              
        $t->string('name', 150);                      
        $t->enum('type', ['kota','kabupaten']);       
        $t->timestamps();
        $t->index(['province_code','name']);
        $t->foreign('province_code')->references('code')->on('indonesia_provinces')->cascadeOnDelete();
      });
    }
    public function down(): void { Schema::dropIfExists('indonesia_cities'); }
  };
