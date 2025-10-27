<?php

// database/migrations/2025_10_24_000000_create_invoices_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique();
            $table->enum('status', ['draft', 'issued', 'void'])->default('issued');
            $table->dateTime('issued_at')->nullable();
            $table->dateTime('due_at')->nullable();

            // snapshot totals (tax/discount) at time of issuing
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('shipping_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);

            // snapshot of billing data
            $table->string('bill_to_name')->nullable();
            $table->string('bill_to_email')->nullable();
            $table->string('bill_to_phone')->nullable();
            $table->string('bill_to_address')->nullable();
            $table->string('bill_to_city')->nullable();
            $table->string('bill_to_province')->nullable();
            $table->string('bill_to_postal_code')->nullable();
            $table->string('bill_to_country')->nullable();

            // optional file storage if you want to store generated PDF
            $table->string('pdf_path')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('invoices');
    }
};
