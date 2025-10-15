<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('indonesia_provinces', function (Blueprint $t) {
      $t->id();
      $t->string('code', 10)->unique();
      $t->string('name', 150);
      $t->timestamps();
      $t->index('name');
    });
  }
  public function down(): void { Schema::dropIfExists('indonesia_provinces'); }
};

