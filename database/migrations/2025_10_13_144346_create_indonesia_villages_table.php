<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
      Schema::create('indonesia_postal_codes', function (Blueprint $t) {
        $t->id();
        $t->string('village_code', 20);               
        $t->string('postal_code', 10);                
        $t->timestamps();
        $t->unique(['village_code','postal_code']); 
        $t->index('postal_code');
        $t->foreign('village_code')->references('code')->on('indonesia_villages')->cascadeOnDelete();
      });
    }
    public function down(): void { Schema::dropIfExists('indonesia_postal_codes'); }
};
  
