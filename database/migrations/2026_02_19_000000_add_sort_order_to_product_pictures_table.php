<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_pictures', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('product_id');
        });

        // Backfill existing records: assign sort_order per product based on created_at/id
        $productIds = DB::table('product_pictures')->distinct()->pluck('product_id');

        foreach ($productIds as $productId) {
            $pictures = DB::table('product_pictures')
                ->where('product_id', $productId)
                ->orderBy('created_at')
                ->orderBy('id')
                ->pluck('id');

            foreach ($pictures as $index => $pictureId) {
                DB::table('product_pictures')
                    ->where('id', $pictureId)
                    ->update(['sort_order' => $index]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('product_pictures', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
