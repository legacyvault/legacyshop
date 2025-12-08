<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Category;
use App\Models\GroupStock;
use App\Models\OrderItems;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPictures;
use App\Models\ProductStock;
use App\Models\SubUnit;
use App\Models\Tags;
use App\Models\Type;
use App\Models\Unit;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    use AwsS3;

    public function createCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'description' => 'string|nullable',
            'sub_unit_id' => 'required|exists:sub_unit,id'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Category::create([
            'name' => $request->name,
            'sub_unit_id' => $request->sub_unit_id,
            'description' => $request->description
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create category.');
        } else {
            return redirect()->back()->with('error', 'Failed to create category.');
        }
    }

    public function createSubUnit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'description' => 'string|nullable',
            'unit_id' => 'required|exists:unit,id'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = SubUnit::create([
            'name' => $request->name,
            'unit_id' => $request->unit_id,
            'description' => $request->description
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create sub unit.');
        } else {
            return redirect()->back()->with('error', 'Failed to create sub unit.');
        }
    }

    public function createType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Type::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create type.');
        } else {
            return redirect()->back()->with('error', 'Failed to create type.');
        }
    }

    public function updateCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:category,id',
            'name' => [
                'required',
                'string'
            ],
            'sub_unit_id' => 'required|exists:sub_unit,id',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Category::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Category not found.');
        }

        $data->name = $request->name;
        $data->sub_unit_id = $request->sub_unit_id;
        $data->description = $request->description;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update category.');
    }

    public function updateSubUnit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:sub_unit,id',
            'name' => [
                'required',
                'string'
            ],
            'unit_id' => 'required|exists:unit,id',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = SubUnit::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Sub unit not found.');
        }

        $data->name = $request->name;
        $data->unit_id = $request->unit_id;
        $data->description = $request->description;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update sub unit.');
    }

    public function updateType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:type,id',
            'name' => [
                'required',
                'string',
            ],
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Type::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Type not found.');
        }

        $data->name = $request->name;
        $data->description = $request->description;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update type.');
    }

    public function getAllCategory()
    {
        $data = Category::orderBy('name', 'asc')->with(['sub_unit.unit', 'sub_categories'])->get();

        return $data;
    }

    public function getAllSubUnit($unitId = null)
    {
        $query = SubUnit::orderBy('name', 'asc')->with(['unit', 'categories']);

        if ($unitId) {
            $query->where('unit_id', $unitId);
        }

        return $query->get();
    }


    public function getCategoryPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'name', 'description', 'sub_unit_id'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $query = Category::query()->with(['sub_unit', 'sub_categories']);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy($sortBy, $sortDir)->paginate($perPage)->appends($request->query());
    }


    public function getSubUnitPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'name', 'description', 'unit_id'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $query = SubUnit::query()->with(['unit', 'categories']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy($sortBy, $sortDir)->paginate($perPage)->appends($request->query());
    }


    public function getCategoryById($id)
    {
        $data = Category::with('sub_unit')->find($id);

        return $data;
    }

    public function getSubUnitById($id)
    {
        $data = SubUnit::with('unit')->find($id);

        return $data;
    }

    public function getAllType()
    {
        $data = Type::orderBy('name', 'asc')->get();

        return redirect()->back()->with([
            'success' => 'Successfully get types.',
            'types' => $data,
        ]);
    }

    public function addProduct(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_name'     => 'required|string|max:255',
            'product_weight'    => 'required|numeric|min:1',
            'description'      => 'required|string',

            'unit_id'          => 'required|exists:unit,id',
            'sub_unit_id'       => 'required|exists:sub_unit,id',
            'use_unit_price'       => 'boolean',
            'use_unit_usd_price'   => 'boolean',
            'use_unit_discount'    => 'boolean',

            'product_price'    => 'required_if:use_unit_price,false|numeric|min:1000',
            'product_usd_price' => 'required_if:use_unit_usd_price,false|numeric|min:1',
            'product_discount' => 'nullable|numeric|required_if:use_unit_discount,false',

            'is_showcase_top'          => 'nullable|boolean',
            'is_showcase_bottom'          => 'nullable|boolean',

            'pictures'   => 'nullable|array',
            'pictures.*' => 'file|mimes:jpg,jpeg,png,webp|max:2048',

            'tag_id'        => 'nullable|array',
            'tag_id.*'      => 'exists:tags,id',

            'categories'    => 'nullable|array',
            'categories.*'  => 'exists:category,id',

            'sub_categories'          => 'nullable|array',
            'sub_categories.*.id'     => 'exists:sub_category,id',
            'sub_categories.*.stock'  => 'nullable|integer',
            'sub_categories.*.use_subcategory_discount' => 'nullable',
            'sub_categories.*.manual_discount' => 'nullable|numeric',

            'divisions'          => 'nullable|array',
            'divisions.*.id'     => 'exists:division,id',
            'divisions.*.stock'  => 'nullable|integer',
            'divisions.*.use_division_discount' => 'nullable',
            'divisions.*.manual_discount' => 'nullable|numeric',

            'variants'          => 'nullable|array',
            'variants.*.id'     => 'exists:variant,id',
            'variants.*.stock'  => 'nullable|integer',
            'variants.*.use_variant_discount' => 'nullable',
            'variants.*.manual_discount' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $unit = Unit::findOrFail($request->unit_id);
            $subunit = SubUnit::findorFail($request->sub_unit_id);

            $product_price = $request->boolean('use_unit_price')
                ? $unit->price
                : $request->product_price;

            $product_usd_price = $request->boolean('use_unit_usd_price')
                ? $unit->usd_price
                : $request->product_usd_price;

            $product_discount = $request->boolean('use_unit_discount')
                ? $unit->discount
                : ($request->product_discount ?? 0);

            $product = Product::create([
                'product_name'     => $request->product_name,
                'product_price'    => $product_price,
                'product_usd_price' => $product_usd_price,
                'product_discount' => $product_discount,
                'product_weight'     => $request->product_weight,
                'description'      => $request->description,
                'unit_id'          => $request->unit_id,
                'sub_unit_id'       => $request->sub_unit_id,
                'is_showcase_top'          => $request->boolean('is_showcase_top'),
                'is_showcase_bottom'          => $request->boolean('is_showcase_bottom'),
            ]);
            $product->product_sku = Product::generateSku($product);
            $product->save();

            // Sync tags (no pivot)
            if ($request->filled('tag_id')) {
                $product->tags()->sync($request->tag_id);
            }

            // Sync categories (no pivot)
            if ($request->filled('categories')) {
                $product->categories()->sync($request->categories);
            }

            // Sync subcategories (with pivot)
            if ($request->filled('sub_categories')) {
                $syncData = [];
                foreach ($request->sub_categories as $subcat) {
                    $syncData[$subcat['id']] = [
                        'use_subcategory_discount' => $subcat['use_subcategory_discount'] ?? true,
                        'manual_discount'          => $subcat['manual_discount'] ?? 0,
                        'stock'                    => $subcat['stock'] ?? null,
                    ];
                }
                $product->subcategories()->sync($syncData);
            }

            // Sync divisions (with pivot)
            if ($request->filled('divisions')) {
                $syncData = [];
                foreach ($request->divisions as $div) {
                    $syncData[$div['id']] = [
                        'use_division_discount' => $div['use_division_discount'] ?? true,
                        'manual_discount'       => $div['manual_discount'] ?? 0,
                        'stock'                 => $div['stock'] ?? null,
                    ];
                }
                $product->divisions()->sync($syncData);
            }

            // Sync variants (with pivot)
            if ($request->filled('variants')) {
                $syncData = [];
                foreach ($request->variants as $var) {
                    $syncData[$var['id']] = [
                        'use_variant_discount' => $var['use_variant_discount'] ?? true,
                        'manual_discount'      => $var['manual_discount'] ?? 0,
                        'stock'                => $var['stock'] ?? null,
                    ];
                }
                $product->variants()->sync($syncData);
            }

            // Upload pictures to S3
            if ($request->hasFile('pictures')) {
                foreach ($request->file('pictures') as $file) {
                    $url = $this->uploadToS3($file, $product->id);

                    ProductPictures::create([
                        'url'        => $url,
                        'product_id' => $product->id,
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('product')->with('alert', [
                'type' => 'success',
                'message' => 'Product added successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product: ' . $e->getMessage());
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add product.',
            ]);
        }
    }

    public function addProductGroup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'group_name' => 'required|string|max:255',

            'unit_id'     => 'required|exists:unit,id',
            'sub_unit_id' => 'required|exists:sub_unit,id',

            'tags'        => 'nullable|array',
            'tags.*'      => 'exists:tags,id',

            'categories'  => 'nullable|array',
            'categories.*' => 'exists:category,id',

            'sub_categories' => 'nullable|array',
            'sub_categories.*.id' => 'exists:sub_category,id',
            'sub_categories.*.use_subcategory_discount' => 'nullable',
            'sub_categories.*.stock' => 'nullable|integer',
            'sub_categories.*.manual_discount' => 'nullable|numeric',

            'divisions' => 'nullable|array',
            'divisions.*.id' => 'exists:division,id',
            'divisions.*.use_division_discount' => 'nullable',
            'divisions.*.stock' => 'nullable|integer',
            'divisions.*.manual_discount' => 'nullable|numeric',

            'variants' => 'nullable|array',
            'variants.*.id' => 'exists:variant,id',
            'variants.*.use_variant_discount' => 'nullable',
            'variants.*.stock' => 'nullable|integer',
            'variants.*.manual_discount' => 'nullable|numeric',

            // products array
            'products' => 'required|array|min:1',
            'products.*.product_name' => 'required|string',
            'products.*.weight' => 'required|numeric|min:0',
            'products.*.description' => 'required|string',

            // pictures per product -> array of files
            'products.*.pictures' => 'nullable|array',
            'products.*.pictures.*' => 'file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // Create Group
            $group = ProductGroup::create([
                'name' => $request->group_name,
            ]);

            // Determine the highest price unit
            $mainUnit = Unit::where('id', $request->unit_id)->first();

            if (!$mainUnit) {
                throw new \Exception("No valid unit found.");
            }

            // Prepare global prices for all products
            $default_price        = $mainUnit->price;
            $default_usd_price    = $mainUnit->usd_price;
            $default_discount     = $mainUnit->discount;

            // iterate with index so we can use $request->file("products.$i.pictures")
            $productsInput = $request->input('products', []);
            $total = count($productsInput);

            for ($i = 0; $i < $total; $i++) {
                $p = $productsInput[$i];

                $subUnit = SubUnit::find($request->sub_unit_id);
                if (!$subUnit) {
                    throw new \Exception("Sub unit not found for SKU generation.");
                }

                // Generate SKU sebelum create
                $product = Product::create([
                    'product_name'       => $p['product_name'],
                    'product_weight'     => $p['weight'],
                    'description'        => $p['description'],
                    'product_price'      => $default_price,
                    'product_usd_price'  => $default_usd_price,
                    'product_discount'   => $default_discount,
                    'product_group_id'   => $group->id,
                    'unit_id'            => $request->unit_id,
                    'sub_unit_id'        => $request->sub_unit_id,
                    'product_sku'        => Product::generateSku(new Product([
                        'product_name' => $p['product_name'],
                        'sub_unit_id'  => $request->sub_unit_id
                    ])),
                ]);

                // relational sync
                if ($request->filled('tags')) {
                    $product->tags()->sync($request->tags);
                }

                if ($request->filled('categories')) {
                    $product->categories()->sync($request->categories);
                }

                if ($request->filled('sub_categories')) {
                    $sync = [];
                    foreach ($request->sub_categories as $sc) {
                        $sync[$sc['id']] = [
                            'use_subcategory_discount' => $sc['use_subcategory_discount'] ?? true,
                            'manual_discount'          => $sc['manual_discount'] ?? 0,
                            'stock'                    => $sc['stock'] ?? null,
                        ];
                    }
                    $product->subcategories()->sync($sync);
                }

                if ($request->filled('divisions')) {
                    $sync = [];
                    foreach ($request->divisions as $d) {
                        $sync[$d['id']] = [
                            'use_division_discount' => $d['use_division_discount'] ?? true,
                            'manual_discount'       => $d['manual_discount'] ?? 0,
                            'stock'                 => $d['stock'] ?? null,
                        ];
                    }
                    $product->divisions()->sync($sync);
                }

                if ($request->filled('variants')) {
                    $sync = [];
                    foreach ($request->variants as $v) {
                        $sync[$v['id']] = [
                            'use_variant_discount' => $v['use_variant_discount'] ?? true,
                            'manual_discount'      => $v['manual_discount'] ?? 0,
                            'stock'                => $v['stock'] ?? null,
                        ];
                    }
                    $product->variants()->sync($sync);
                }

                // Handle multiple pictures for this product
                // Expecting input names like: products[0][pictures][], products[1][pictures][]
                $files = $request->file("products.$i.pictures");
                if ($files && is_array($files)) {
                    foreach ($files as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile) {
                            $url = $this->uploadToS3($file, $product->id);

                            ProductPictures::create([
                                'url'        => $url,
                                'product_id' => $product->id,
                            ]);
                        }
                    }
                }
            }

            DB::commit();
            return redirect()->route('product')->with('alert', [
                'type' => 'success',
                'message' => 'Product group & products added successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product group: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type'  => 'error',
                'message' => 'Failed to add product group.',
            ]);
        }
    }

    // protected function generateSkuForProduct(string $productName, SubUnit $subUnit): string
    // {
    //     $subUnitInitial = strtoupper(substr($subUnit->name, 0, 1));
    //     $productInitial = strtoupper(substr($productName, 0, 1));
    //     $prefix = $subUnitInitial . $productInitial;

    //     $lastProduct = Product::where('product_sku', 'like', $prefix . '%')
    //         ->orderBy('product_sku', 'desc')
    //         ->first();

    //     if ($lastProduct) {
    //         preg_match('/(\d+)$/', $lastProduct->product_sku, $matches);
    //         $number = isset($matches[1]) ? intval($matches[1]) + 1 : 1;
    //     } else {
    //         $number = 1;
    //     }

    //     return $prefix . $number; // Contoh: PC1, PC2
    // }

    public function editProductGroup(Request $request, $groupId)
    {
        $validator = Validator::make($request->all(), [
            'group_name' => 'required|string|max:255',

            'unit_id'     => 'required|exists:unit,id',
            'sub_unit_id' => 'required|exists:sub_unit,id',

            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',

            'categories' => 'nullable|array',
            'categories.*' => 'exists:category,id',

            'sub_categories' => 'nullable|array',
            'sub_categories.*.id' => 'exists:sub_category,id',

            'products' => 'required|array|min:1',
            'products.*.id' => 'nullable|exists:products,id',
            'products.*.product_name' => 'required|string',
            'products.*.weight' => 'required|numeric|min:0',
            'products.*.description' => 'required|string',

            'products.*.pictures' => 'nullable|array',
            'products.*.pictures.*' => 'file|mimes:jpg,jpeg,png,webp|max:2048',

            'products.*.remove_picture_ids' => 'nullable|array',
            'products.*.remove_picture_ids.*' => 'exists:product_pictures,id',

            'remove_product_ids' => 'nullable|array',
            'remove_product_ids.*' => 'exists:products,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $group = ProductGroup::findOrFail($groupId);

            // Update group name
            $group->update(['name' => $request->group_name]);

            // Determine highest unit price (same as CREATE)
            $unit = Unit::where('id', $request->unit_id)->first();

            $default_price      = $unit->price;
            $default_usd_price  = $unit->usd_price;
            $default_discount   = $unit->discount;

            // 1️⃣ REMOVE PRODUCTS
            if ($request->filled('remove_product_ids')) {
                foreach ($request->remove_product_ids as $pid) {

                    // Check usage in orders
                    if (OrderItems::where('product_id', $pid)->exists()) {
                        throw new \Exception("Product ID $pid cannot be deleted — used in orders.");
                    }

                    // Delete pictures from S3
                    $pics = ProductPictures::where('product_id', $pid)->get();
                    foreach ($pics as $pic) {
                        $this->deleteFromS3($pic->url);
                        $pic->delete();
                    }

                    // Delete product
                    Product::where('id', $pid)->delete();
                }
            }

            $unitId = $request->unit_id;
            $subUnitId = $request->sub_unit_id;

            // 2️⃣ ADD / UPDATE PRODUCTS
            $productsInput = $request->products;

            foreach ($productsInput as $i => $p) {

                if (!empty($p['id'])) {
                    // UPDATE PRODUCT (no unit_id/sub_unit_id anymore)
                    $product = Product::findOrFail($p['id']);
                    $product->product_name       = $p['product_name'];
                    $product->product_weight     = $p['weight'];
                    $product->description        = $p['description'];
                    $product->unit_id            = $unitId;
                    $product->sub_unit_id        = $subUnitId;
                    $product->product_price      = $default_price;
                    $product->product_usd_price  = $default_usd_price;
                    $product->product_discount   = $default_discount;
                    $product->save();
                } else {
                    // CREATE PRODUCT
                    $product = Product::create([
                        'product_name'       => $p['product_name'],
                        'product_weight'     => $p['weight'],
                        'description'        => $p['description'],
                        'product_price'      => $default_price,
                        'product_usd_price'  => $default_usd_price,
                        'product_discount'   => $default_discount,
                        'product_group_id'   => $group->id,
                        'unit_id'            => $unitId,
                        'sub_unit_id'        => $subUnitId,
                        'product_sku'        => Product::generateSku(new Product([
                            'product_name' => $p['product_name'],
                            'sub_unit_id'  => $request->sub_unit_id
                        ])),
                    ]);
                }

                // TAGS pivot
                if ($request->filled('tags')) {
                    $product->tags()->sync($request->tags);
                }

                // CATEGORIES pivot
                if ($request->filled('categories')) {
                    $product->categories()->sync($request->categories);
                }

                // SUBCATEGORY pivot + discount/stock
                if ($request->filled('sub_categories')) {
                    $sync = [];
                    foreach ($request->sub_categories as $sc) {
                        $sync[$sc['id']] = [
                            'use_subcategory_discount' => $sc['use_subcategory_discount'] ?? true,
                            'manual_discount'          => $sc['manual_discount'] ?? 0,
                            'stock'                    => $sc['stock'] ?? null,
                        ];
                    }
                    $product->subcategories()->sync($sync);
                }

                // REMOVE PICTURES
                if (!empty($p['remove_picture_ids'])) {
                    $pics = ProductPictures::whereIn('id', $p['remove_picture_ids'])->get();
                    foreach ($pics as $pic) {
                        $this->deleteFromS3($pic->url);
                        $pic->delete();
                    }
                }

                // ADD NEW PICTURES
                $files = $request->file("products.$i.pictures");
                if ($files) {
                    foreach ($files as $file) {
                        $url = $this->uploadToS3($file, $product->id);
                        ProductPictures::create([
                            'url' => $url,
                            'product_id' => $product->id
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->route('product')->with('alert', [
                'type' => 'success',
                'message' => 'Product group updated successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e);
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getAllProductGroups()
    {
        $productGroups = ProductGroup::withCount('products')
            ->with([
                'products',
                'products.categories',
                'products.tags',
                'products.unit',
                'products.subUnit',
                'products.pictures',
                'products.divisions',
                'products.subcategories',
                'products.variants',
            ])->get();

        return response()->json([
            'status' => true,
            'data' => $productGroups,
        ]);
    }

    public function getProductGroupsPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0) {
            $perPage = 10;
        }
        $perPage = min($perPage, 100);

        $search  = $request->input('q');
        $sortBy  = $request->input('sort_by', 'updated_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'created_at', 'updated_at', 'products_count'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'updated_at';
        }

        $query = ProductGroup::query()
            ->withCount('products')
            ->with([
                'products' => function ($q) {
                    $q->select([
                        'id',
                        'product_group_id',
                        'product_name',
                        'product_weight',
                        'product_price',
                        'product_usd_price',
                        'product_discount',
                        'product_sku',
                        'total_stock',
                        'description',
                        'updated_at',
                        'created_at',
                    ]);
                },
                'products.unit:id,name',
                'products.subUnit:id,name,unit_id',
                'products.categories:id,name,sub_unit_id',
                'products.subcategories:id,name,category_id',
                'products.divisions:id,name,sub_category_id',
                'products.variants:id,name,division_id',
                'products.tags:id,name',
                'products.pictures:id,url,product_id,created_at,updated_at',
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('products', function ($productQuery) use ($search) {
                        $productQuery->where('product_name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
            });
        }

        if ($sortBy === 'products_count') {
            $query->orderBy('products_count', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        return $query->paginate($perPage)->appends($request->query());
    }

    public function getProductGroupById($id, $raw = false)
    {
        $productGroup = ProductGroup::withCount('products')->with([
            'stocks',
            'products',
            'products.categories',
            'products.tags',
            'products.unit',
            'products.subUnit',
            'products.pictures',
            'products.divisions',
            'products.subcategories',
            'products.variants',
        ])->find($id);

        if (!$productGroup) {
            if ($raw) {
                return null;
            }
            return response()->json([
                'status' => false,
                'message' => 'Product group not found'
            ], 404);
        }

        if ($raw) {
            return $productGroup;
        }

        return response()->json([
            'status' => true,
            'data' => $productGroup,
        ]);
    }

    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|string|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $product = Product::where('id', $request->product_id)->first();

            if (!$product) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find product.',
                ]);
            }

            $create = ProductStock::create($request->all());

            $product->total_stock = $product->total_stock + $request->quantity;
            $product->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add product stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on product: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add product stock.',
            ]);
        }
    }

    public function addStockGroup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'group_id' => 'required|string|exists:product_group,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $products = Product::where('product_group_id', $request->group_id)->get();

            if ($products->isEmpty()) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'No products found in this group.',
                ]);
            }

            foreach ($products as $product) {

                // Create stock record for each product
                ProductStock::create([
                    'product_id' => $product->id,
                    'quantity'   => $request->quantity,
                    'remarks'    => $request->remarks,
                ]);

                // Increase product total stock
                $product->total_stock = $product->total_stock + $request->quantity;
                $product->save();
            }

            GroupStock::create([
                'group_id' => $request->group_id,
                'quantity'   => $request->quantity,
                'remarks'    => $request->remarks,
            ]);

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully added stock to all products in the group.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add stock to group: ' . $e->getMessage());

            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add stock to product group.',
            ]);
        }
    }

    public function editProduct(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'product_name'     => 'required|string|max:255',
            'description'      => 'required|string',

            'unit_id'          => 'required|exists:unit,id',
            'sub_unit_id'       => 'required|exists:sub_unit,id',
            'use_unit_price'       => 'boolean',
            'use_unit_usd_price'   => 'boolean',
            'use_unit_discount'    => 'boolean',

            'product_price'    => 'required_if:use_unit_price,false|numeric|min:1000',
            'product_usd_price' => 'required_if:use_unit_usd_price,false|numeric|min:1',
            'product_discount' => 'nullable|numeric|required_if:use_unit_discount,false',

            'is_showcase_top'          => 'nullable|boolean',
            'is_showcase_bottom'          => 'nullable|boolean',

            'pictures'   => 'nullable|array',
            'pictures.*' => 'file|mimes:jpg,jpeg,png,webp|max:2048',

            'tag_id'        => 'nullable|array',
            'tag_id.*'      => 'exists:tags,id',

            'categories'    => 'nullable|array',
            'categories.*'  => 'exists:category,id',

            'sub_categories'          => 'nullable|array',
            'sub_categories.*.id'     => 'exists:sub_category,id',
            'sub_categories.*.stock'  => 'nullable|integer',
            'sub_categories.*.use_subcategory_discount' => 'nullable',
            'sub_categories.*.manual_discount' => 'nullable|numeric',

            'divisions'          => 'nullable|array',
            'divisions.*.id'     => 'exists:division,id',
            'divisions.*.stock'  => 'nullable|integer',
            'divisions.*.use_division_discount' => 'nullable',
            'divisions.*.manual_discount' => 'nullable|numeric',

            'variants'          => 'nullable|array',
            'variants.*.id'     => 'exists:variant,id',
            'variants.*.stock'  => 'nullable|integer',
            'variants.*.use_variant_discount' => 'nullable',
            'variants.*.manual_discount' => 'nullable|numeric',

            'remove_picture_ids' => 'nullable|array',
            'remove_picture_ids.*' => 'exists:product_pictures,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);
            $unit = Unit::findOrFail($request->unit_id);

            $product_price = $request->boolean('use_unit_price')
                ? $unit->price
                : $request->product_price;

            $product_usd_price = $request->boolean('use_unit_usd_price')
                ? $unit->usd_price
                : $request->product_usd_price;

            $product_discount = $request->boolean('use_unit_discount')
                ? $unit->discount
                : ($request->product_discount ?? 0);

            $product->update([
                'product_name'     => $request->product_name,
                'product_price'    => $product_price,
                'product_usd_price' => $product_usd_price,
                'product_discount' => $product_discount,
                'description'      => $request->description,
                'unit_id'          => $request->unit_id,
                'sub_unit_id'       => $request->sub_unit_id,
                'is_showcase_top'          => $request->boolean('is_showcase_top'),
                'is_showcase_bottom'          => $request->boolean('is_showcase_bottom'),
            ]);

            // Sync tags
            $product->tags()->sync($request->tag_id ?? []);

            // Sync categories
            $product->categories()->sync($request->categories ?? []);

            // Sync subcategories (with pivot)
            $syncData = [];
            if ($request->filled('sub_categories')) {
                foreach ($request->sub_categories as $subcat) {
                    $syncData[$subcat['id']] = [
                        'use_subcategory_discount' => $subcat['use_subcategory_discount'] ?? true,
                        'manual_discount'          => $subcat['manual_discount'] ?? 0,
                        'stock'                    => $subcat['stock'] ?? null,
                    ];
                }
            }
            $product->subcategories()->sync($syncData);

            // Sync divisions
            $syncData = [];
            if ($request->filled('divisions')) {
                foreach ($request->divisions as $div) {
                    $syncData[$div['id']] = [
                        'use_division_discount' => $div['use_division_discount'] ?? true,
                        'manual_discount'       => $div['manual_discount'] ?? 0,
                        'stock'                 => $div['stock'] ?? null,
                    ];
                }
            }
            $product->divisions()->sync($syncData);

            // Sync variants
            $syncData = [];
            if ($request->filled('variants')) {
                foreach ($request->variants as $var) {
                    $syncData[$var['id']] = [
                        'use_variant_discount' => $var['use_variant_discount'] ?? true,
                        'manual_discount'      => $var['manual_discount'] ?? 0,
                        'stock'                => $var['stock'] ?? null,
                    ];
                }
            }
            $product->variants()->sync($syncData);

            if ($request->filled('remove_picture_ids')) {
                $picturesToDelete = ProductPictures::whereIn('id', $request->remove_picture_ids)->get();
                foreach ($picturesToDelete as $pic) {
                    $this->deleteFromS3($pic->url);
                    $pic->delete();
                }
            }

            if ($request->hasFile('pictures')) {
                foreach ($request->file('pictures') as $file) {
                    $url = $this->uploadToS3($file, $product->id);
                    ProductPictures::create([
                        'url'        => $url,
                        'product_id' => $product->id,
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('product')->with('alert', [
                'type' => 'success',
                'message' => 'Product updated successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update product: ' . $e->getMessage());
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to update product.',
            ]);
        }
    }

    public function updateLatestStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:product_stock,id',
            'product_id' => 'required|string|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $product = Product::where('id', $request->product_id)->first();

            if (!$product) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find product.',
                ]);
            }

            $latest_product_stock = ProductStock::where('id', $request->id)->first();

            $product->total_stock = $product->total_stock - $latest_product_stock->quantity;
            $product->save();

            $latest_product_stock->quantity = $request->quantity;
            $latest_product_stock->remarks = $request->remarks;
            $latest_product_stock->save();


            $product->total_stock = $product->total_stock + $request->quantity;
            $product->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add product stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on product: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add product stock.',
            ]);
        }
    }

    private function mapPrice($model, $isIndonesian, $isProduct = false)
    {
        if (!$model) return null;

        if ($isProduct) {
            // Product uses product_price & product_usd_price
            $model->default_price = $isIndonesian
                ? ($model->product_price ?? null)
                : ($model->product_usd_price ?? null);
        } else {
            // Other models use price & usd_price
            $model->default_price = $isIndonesian
                ? ($model->price ?? null)
                : ($model->usd_price ?? null);
        }

        $model->default_currency = $isIndonesian ? 'IDR' : 'USD';

        return $model;
    }

    private function applyPriceMappingToProduct($product, $isIndonesian)
    {
        if (!$product) return null;

        // Product price
        $this->mapPrice($product, $isIndonesian, true);

        // Unit
        if ($product->unit) {
            $this->mapPrice($product->unit, $isIndonesian);
        }

        // Sub Unit
        if ($product->subUnit) {
            $this->mapPrice($product->subUnit, $isIndonesian);
        }

        // Categories
        foreach ($product->categories as $cat) {
            $this->mapPrice($cat, $isIndonesian);
        }

        // Sub Categories
        foreach ($product->subcategories as $sub) {
            $this->mapPrice($sub, $isIndonesian);
        }

        // Divisions
        foreach ($product->divisions as $division) {
            $this->mapPrice($division, $isIndonesian);
        }

        // Variants
        foreach ($product->variants as $variant) {
            $this->mapPrice($variant, $isIndonesian);
        }

        return $product;
    }


    public function getAllProduct(Request $request, $unitId = null)
    {
        try {
            $ip = $request->header('X-Forwarded-For') ?? $request->ip();
            if (env('APP_ENV') == 'local') {
                $ip = '36.84.152.11';
            }

            $response = Http::get("http://ip-api.com/json/{$ip}?fields=status,country,countryCode,regionName,city,zip");
            $location = $response->json();

            if ($location['status'] == 'fail') {
                return redirect()->back()->with('error', 'Failed to register');
            }

            $isIndonesian = ($location['countryCode'] === 'ID');

            $perPage = (int) $request->input('per_page', 15);
            $search  = $request->input('q');
            $sortBy  = $request->input('sort_by', 'product_name');
            $sortDir = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';

            $unitFilter = $unitId ?? $request->input('unit_id');
            $unitFilter = ($unitFilter !== null && $unitFilter !== '') ? (string) $unitFilter : null;

            $subunitFilter = $request->input('sub_unit_ids', []);
            if (!is_array($subunitFilter)) {
                $subunitFilter = ($subunitFilter !== null && $subunitFilter !== '') ? [$subunitFilter] : [];
            }
            $subunitIds = array_map('strval', array_values(array_unique(array_filter($subunitFilter, static function ($value) {
                return $value !== null && $value !== '';
            }))));

            $tagFilter = $request->input('tag_ids', []);
            if (!is_array($tagFilter)) {
                $tagFilter = ($tagFilter !== null && $tagFilter !== '') ? [$tagFilter] : [];
            }
            $tagIds = array_map('strval', array_values(array_unique(array_filter($tagFilter, static function ($value) {
                return $value !== null && $value !== '';
            }))));

            $allowedSorts = ['id', 'product_name', 'description', 'product_price', 'total_stock', 'created_at'];
            if (!in_array($sortBy, $allowedSorts, true)) {
                $sortBy = 'product_name';
            }

            $query = Product::with([
                'stocks',
                'unit',
                'subUnit',
                'categories.sub_unit',
                'subcategories',
                'divisions',
                'tags',
                'pictures',
            ]);

            if ($unitFilter) {
                $query->where('unit_id', $unitFilter);
            }

            if ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('product_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('unit', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('subUnit', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('categories', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('subcategories', function ($sq) use ($search) {
                            $sq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('divisions', function ($dq) use ($search) {
                            $dq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('variants', function ($vq) use ($search) {
                            $vq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('tags', function ($tq) use ($search) {
                            $tq->where('is_show', 1)
                                ->where('name', 'like', "%{$search}%");
                        });
                });
            }

            // Exact filters by IDs
            if (count($subunitIds) > 0) {
                $query->whereIn('sub_unit_id', $subunitIds);
            }

            if (count($tagIds) > 0) {
                $query->whereHas('tags', function ($q) use ($tagIds) {
                    $q->whereIn('id', $tagIds);
                });
            }

            $products = $query->orderBy($sortBy, $sortDir)
                ->paginate($perPage)
                ->appends($request->query());

            // Transform each product and apply mapping
            $products->getCollection()->transform(function ($product) use ($isIndonesian) {
                return $this->applyPriceMappingToProduct($product, $isIndonesian);
            });

            return $products;
        } catch (Exception $e) {
            Log::error('Failed to get all products: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to get all products.',
            ]);
        }
    }

    public function getAllShowcaseTopProduct()
    {
        // ---- Country detection ----
        $ip = request()->header('X-Forwarded-For') ?? request()->ip();
        if (env('APP_ENV') == 'local') $ip = '36.84.152.11';
        $location = Http::get("http://ip-api.com/json/{$ip}?fields=status,countryCode")->json();
        $isIndonesian = ($location['countryCode'] === 'ID');

        $data = Product::with([
            'product_group',
            'stocks',
            'unit',
            'subUnit',
            'categories.sub_unit',
            'subcategories',
            'divisions',
            'variants',
            'tags',
            'pictures',
        ])->where('is_showcase_top', true)->get();

        // Apply mapping
        $data->transform(function ($p) use ($isIndonesian) {
            return $this->applyPriceMappingToProduct($p, $isIndonesian);
        });

        return $data;
    }

    public function getAllShowcaseBottomProduct()
    {
        // ---- Country detection ----
        $ip = request()->header('X-Forwarded-For') ?? request()->ip();
        if (env('APP_ENV') == 'local') $ip = '36.84.152.11';
        $location = Http::get("http://ip-api.com/json/{$ip}?fields=status,countryCode")->json();
        $isIndonesian = ($location['countryCode'] === 'ID');

        $data = Product::with([
            'product_group',
            'stocks',
            'unit',
            'subUnit',
            'categories.sub_unit',
            'subcategories',
            'divisions',
            'variants',
            'tags',
            'pictures',
        ])->where('is_showcase_bottom', true)->get();

        // Apply mapping
        $data->transform(function ($p) use ($isIndonesian) {
            return $this->applyPriceMappingToProduct($p, $isIndonesian);
        });

        return $data;
    }

    public function getProductByID($id)
    {
        // ---- Country detection ----
        $ip = request()->header('X-Forwarded-For') ?? request()->ip();
        if (env('APP_ENV') == 'local') $ip = '36.84.152.11';
        $location = Http::get("http://ip-api.com/json/{$ip}?fields=status,countryCode")->json();
        $isIndonesian = ($location['countryCode'] === 'ID');

        $product = Product::with([
            'stocks',
            'unit',
            'subUnit',
            'categories',
            'subcategories',
            'divisions',
            'variants',
            'tags',
            'pictures',
        ])->find($id);

        if (!$product) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Cannot find product.',
            ]);
        }

        return $this->applyPriceMappingToProduct($product, $isIndonesian);
    }

    public function getRecommendationProduct($id)
    {
        // ---- Country detection ----
        $ip = request()->header('X-Forwarded-For') ?? request()->ip();

        if (env('APP_ENV') == 'local') $ip = '36.84.152.11';

        $location = Http::get("http://ip-api.com/json/{$ip}?fields=status,countryCode")->json();
        $isIndonesian = ($location['countryCode'] === 'ID');


        $product = Product::with([
            'stocks',
            'unit',
            'subUnit',
            'categories',
            'subcategories',
            'divisions',
            'variants',
            'tags',
            'pictures',
        ])->where('id', '!=', $id)->orderBy('created_at', 'desc')->limit(5)->get();

        if (!$product) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Cannot find product.',
            ]);
        };

        return $product;
    }

    public function getProductOptions(Request $request)
    {
        $limit  = (int) $request->input('limit', 50);
        $search = $request->input('q');

        if ($limit <= 0) {
            $limit = 50;
        }

        $limit = min($limit, 200);

        $query = Product::query()
            ->select(['id', 'product_name', 'product_sku', 'product_price'])
            ->orderBy('product_name', 'asc');

        if ($search) {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_sku', 'like', "%{$search}%");
            });
        }

        $products = $query->limit($limit)->get();

        return response()->json([
            'data' => $products->map(function (Product $product) {
                return [
                    'id'    => $product->id,
                    'name'  => $product->product_name,
                    'sku'   => $product->product_sku,
                    'price' => (float) $product->product_price,
                ];
            }),
        ]);
    }

    public function getPublicProductOptions(Request $request)
    {
        $limit  = max(1, min((int) $request->input('limit', 8), 20));
        $search = $request->input('q');
        $unitId = $request->input('unit_id');

        $productLimit = $limit;
        $subUnitLimit = max(1, min($limit, 6));
        $unitLimit = max(1, min($limit, 4));
        $tagLimit = max(1, min($limit, 6));

        $products = Product::query()
            ->select('id', 'product_name', 'sub_unit_id', 'unit_id')
            ->with([
                'unit:id,name',
                'subUnit:id,name,unit_id',
                'tags:id,name',
            ])
            ->when($unitId, function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
            })
            ->when($search, function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%");
            })
            ->orderBy('product_name', 'asc')
            ->limit($productLimit)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->product_name,
                    'type' => 'product',
                    'unit' => $product->unit ? [
                        'id' => $product->unit->id,
                        'name' => $product->unit->name,
                    ] : null,
                    'sub_unit' => $product->subUnit ? [
                        'id' => $product->subUnit->id,
                        'name' => $product->subUnit->name,
                    ] : null,
                    'tags' => $product->tags->map(function ($tag) {
                        return [
                            'id' => $tag->id,
                            'name' => $tag->name,
                        ];
                    })->values(),
                ];
            });

        $units = Unit::query()
            ->select('id', 'name')
            ->where('is_active', 1)
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', 'asc')
            ->limit($unitLimit)
            ->get()
            ->map(function ($unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'type' => 'unit',
                ];
            });

        $subUnits = SubUnit::query()
            ->select('id', 'name', 'unit_id')
            ->with(['unit:id,name'])
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', 'asc')
            ->limit($subUnitLimit)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'name' => $sub->name,
                    'type' => 'sub_unit',
                    'unit' => $sub->unit ? [
                        'id' => $sub->unit->id,
                        'name' => $sub->unit->name,
                    ] : null,
                ];
            });

        $tags = Tags::query()
            ->select('id', 'name',)
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', 'asc')
            ->limit($tagLimit)
            ->get()
            ->map(function ($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'type' => 'tags',
                ];
            });

        $results = $products
            ->concat($subUnits)
            ->concat($units)
            ->concat($tags)
            ->sortBy(function ($item) {
                if ($item['type'] === 'product') return 0;
                if ($item['type'] === 'sub_unit') return 1;
                return 2;
            })
            ->take($limit)
            ->values();

        return response()->json($results);
    }

    public function createTag(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'description' => 'string|nullable',
            'is_show'     => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Tags::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_show' => $request->is_show ?? 0,
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create tag.');
        } else {
            return redirect()->back()->with('error', 'Failed to create tag.');
        }
    }

    public function updateTag(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:tags,id',
            'name' => [
                'required',
                'string'
            ],
            'description' => 'string|nullable',
            'is_show'   => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Tags::find($request->id);

        if (!$data) {
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Tag not found.',
            ]);
        }

        $data->name = $request->name;
        $data->description = $request->description;
        $data->is_show = $request->is_show ?? 0;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update tag.');
    }

    public function getAllTags()
    {
        $data = Tags::orderBy('name', 'asc')->get();

        return $data;
    }

    public function getAllShowTags()
    {
        $data = Tags::orderBy('name', 'asc')->where('is_show', 1)->get();

        return $data;
    }

    public function getTagsPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'name', 'description'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $query = Tags::query();
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy($sortBy, $sortDir)->paginate($perPage)->appends($request->query());
    }

    public function createUnit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string',
            'description' => 'string|nullable',
            'price' => 'required|numeric|min:1',
            'usd_price' => 'required|numeric',
            'discount' => 'required|numeric',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'is_active' => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // ----LIMIT 6 ACTIVE----
            if ($request->is_active) {
                $activeCount = Unit::where('is_active', 1)->count();

                if ($activeCount >= 6) {
                    return redirect()->back()->with('error', 'Failed to create unit: maximum 6 active unit');
                }
            }


            $pictureUrl = null;
            if ($request->hasFile('image')) {
                $pictureUrl = $this->uploadUnitImageToS3($request->file('image'));
            }

            $create = Unit::create([
                'name'        => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'usd_price' => $request->usd_price,
                'discount' => $request->discount,
                'picture_url' => $pictureUrl,
                'is_active' => $request->is_active ?? true,
            ]);

            if ($create) {
                DB::commit();
                return redirect()->back()->with('success', 'Successfully create unit.');
            } else {
                return redirect()->back()->with('error', 'Failed to create unit.');
            }
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to create unit: ' . $e);
            return redirect()->back()->with('error', 'Failed to create unit: ' . $e);
        }
    }

    public function updateUnit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:unit,id',
            'name' => [
                'required',
                'string'
            ],
            'description' => 'string|nullable',
            'price' => 'required|numeric|min:1',
            'usd_price' => 'required|numeric',
            'discount'  => 'required|numeric',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'is_active' => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $unit = Unit::find($request->id);

            if (!$unit) {
                return redirect()->back()->with('error', 'Unit not found.');
            }

            if ($request->is_active && $unit->is_active != 1) {
                $activeCount = Unit::where('is_active', 1)->count();

                if ($activeCount >= 6) {
                    return redirect()->back()->with('error', 'Failed update unit: Maximum 6 active unit');
                }
            }

            if ($request->hasFile('image')) {
                if ($unit->picture_url) {
                    $this->deleteFromS3($unit->picture_url);
                }
                $unit->picture_url = $this->uploadUnitImageToS3($request->file('image'), $unit->id);
            }

            $unit->name        = $request->name;
            $unit->description = $request->description;
            $unit->is_active   = $request->is_active;
            $unit->price       = $request->price;
            $unit->usd_price   = $request->usd_price;
            $unit->discount    = $request->discount;
            $unit->save();

            Product::where('unit_id', $unit->id)->update([
                'product_price'      => $request->price,
                'product_usd_price'  => $request->usd_price,
                'product_discount'   => $request->discount,
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Successfully update unit.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to update unit: ' . $e);
            return redirect()->back()->with('error', 'Failed update unit: ' . $e);
        }
    }

    public function getAllUnit()
    {
        $data = Unit::orderBy('name', 'asc')->with('sub_unit.categories')->get();
        return $data;
    }


    public function getAllActiveUnit()
    {
        $data = Unit::orderBy('name', 'asc')->with('sub_unit.categories')->where('is_active', 1)->get();
        return $data;
    }

    public function getUnitPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'name', 'description', 'is_active'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $query = Unit::query('sub_unit.categories');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('is_active', 'like', "%{$search}%");
            });
        }

        $units = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->appends($request->query());

        return $units;
    }
}
