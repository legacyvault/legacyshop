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
            Schema::create('order_shipments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('order_id');

                // Courier details
                $table->string('courier_code')->nullable(); // jne
                $table->string('courier_name')->nullable(); // JNE
                $table->string('courier_service')->nullable(); // REG
                $table->string('courier_service_name')->nullable(); // Regular Service
                $table->string('shipping_duration_range')->nullable(); // e.g. 1-2
                $table->string('shipping_duration_unit')->nullable(); // e.g. 1-2 days
                $table->decimal('shipping_fee', 15, 2)->default(0);
                $table->string('waybill_number')->nullable();

                // Receiver info
                $table->string('receiver_name')->nullable();
                $table->string('receiver_phone')->nullable();
                $table->text('receiver_address')->nullable();
                $table->string('receiver_postal_code')->nullable();
                $table->string('receiver_city')->nullable();
                $table->string('receiver_province')->nullable();

                $table->string('status')->default('pending');
                $table->timestamp('shipped_at')->nullable();
                $table->timestamp('delivered_at')->nullable();

                $table->timestamps();

                $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_shipments');
    }
};
