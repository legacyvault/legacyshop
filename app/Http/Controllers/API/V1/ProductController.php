<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPictures;
use App\Models\ProductStock;
use App\Models\SubUnit;
use App\Models\Tags;
use App\Models\Type;
use App\Models\Unit;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'name' => 'required|string|unique:category,name',
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
            'name' => 'required|string|unique:sub_unit,name',
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
            'name' => 'required|string|unique:type,name',
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
                'string',
                Rule::unique('category', 'name')->ignore($request->id),
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
                'string',
                Rule::unique('sub_unit', 'name')->ignore($request->id),
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
                Rule::unique('type', 'name')->ignore($request->id),
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
        $data = Category::orderBy('name', 'asc')->with(['sub_unit', 'sub_categories'])->get();

        return $data;
    }

    public function getAllSubUnit()
    {
        $data = SubUnit::orderBy('name', 'asc')->with(['unit', 'categories'])->get();

        return $data;
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

    public function editProduct(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'product_name'     => 'required|string|max:255',
            'description'      => 'required|string',

            'unit_id'          => 'required|exists:unit,id',
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

    public function getAllProduct(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        $search  = $request->input('q');
        $sortBy  = $request->input('sort_by', 'product_name');
        $sortDir = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $unitFilter = $request->input('unit_ids', []);
        if (!is_array($unitFilter)) {
            $unitFilter = ($unitFilter !== null && $unitFilter !== '') ? [$unitFilter] : [];
        }
        $unitIds = array_map('strval', array_values(array_unique(array_filter($unitFilter, static function ($value) {
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
            'categories.sub_unit',
            'subcategories',
            'divisions',
            'tags',
            'pictures',
        ]);

        if ($search) {
            $query->where(function ($searchQuery) use ($search) {
                $searchQuery->where('product_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('unit', function ($uq) use ($search) {
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
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Exact filters by IDs
        if (count($unitIds) > 0) {
            $query->whereIn('unit_id', $unitIds);
        }

        if (count($tagIds) > 0) {
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('id', $tagIds);
            });
        }

        return $query->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());
    }

    public function getAllShowcaseTopProduct()
    {
        $data = Product::with([
            'stocks',
            'unit',
            'categories.sub_unit',
            'subcategories',
            'divisions',
            'tags',
            'pictures',
        ])->where('is_showcase_top', true)->get();

        return $data;
    }

    public function getAllShowcaseBottomProduct()
    {
        $data = Product::with([
            'stocks',
            'unit',
            'categories.sub_unit',
            'subcategories',
            'divisions',
            'tags',
            'pictures',
        ])->where('is_showcase_bottom', true)->get();

        return $data;
    }

    public function getProductByID($id)
    {
        $product = Product::with([
            'stocks',
            'unit',
            'categories.sub_unit',
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

    public function createTag(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:tags,name',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Tags::create([
            'name' => $request->name,
            'description' => $request->description
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
                'string',
                Rule::unique('tags', 'name')->ignore($request->id),
            ],
            'description' => 'string|nullable'
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
        $data->save();

        return redirect()->back()->with('success', 'Successfully update tag.');
    }

    public function getAllTags()
    {
        $data = Tags::orderBy('name', 'asc')->get();

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
            'name'        => 'required|string|unique:unit,name',
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
                'string',
                Rule::unique('unit', 'name')->ignore($request->id),
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

        // Whitelist sortable columns to prevent SQL injection
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

        $units = $query->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return $units;
    }
}
