<?php

namespace Database\Seeders;

use App\Models\GroupStock;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPictures;
use App\Models\ProductStock;
use App\Models\SubUnit;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductGroupTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Manual test seeder - creates one ProductGroup with 120 products so the
     * group view/edit flow can be tested without adding rows one by one.
     * Run explicitly with: php artisan db:seed --class=ProductGroupTestSeeder
     */
    public function run(): void
    {
        DB::transaction(function () {
            $unit = Unit::first();
            if (!$unit) {
                $unit = Unit::create([
                    'name' => 'QA Test Unit',
                    'price' => 100000,
                    'usd_price' => 10,
                    'discount' => 0,
                    'is_active' => true,
                ]);
            }

            $subUnit = SubUnit::where('unit_id', $unit->id)->first();
            if (!$subUnit) {
                $subUnit = SubUnit::create([
                    'unit_id' => $unit->id,
                    'name' => 'QA Test Sub Unit',
                ]);
            }

            $group = ProductGroup::create([
                'name' => 'QA Test Group - 120 Products',
            ]);

            for ($i = 1; $i <= 120; $i++) {
                $productName = "Test Product {$i}";

                $product = Product::create([
                    'product_name' => $productName,
                    'product_sku' => Product::generateSku(new Product([
                        'product_name' => $productName,
                        'sub_unit_id' => $subUnit->id,
                    ])),
                    'product_group_id' => $group->id,
                    'unit_id' => $unit->id,
                    'sub_unit_id' => $subUnit->id,
                    'description' => "Seeded description for {$productName}",
                    'product_price' => $unit->price,
                    'product_usd_price' => $unit->usd_price,
                    'product_discount' => $unit->discount,
                    'product_weight' => mt_rand(50, 500) / 10,
                ]);

                ProductPictures::create([
                    'url' => "https://picsum.photos/seed/{$product->id}/300/300",
                    'product_id' => $product->id,
                    'sort_order' => 0,
                ]);

                ProductStock::create([
                    'product_id' => $product->id,
                    'quantity' => 100,
                    'remarks' => 'Seeded for QA test',
                ]);

                $product->total_stock = 100;
                $product->save();
            }

            GroupStock::create([
                'group_id' => $group->id,
                'quantity' => 100,
                'remarks' => 'Seeded for QA test',
            ]);

            $this->command?->info("Created product group '{$group->name}' ({$group->id}) with 120 products.");
        });
    }
}
