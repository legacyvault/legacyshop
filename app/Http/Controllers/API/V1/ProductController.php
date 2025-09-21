<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPictures;
use App\Models\ProductStock;
use App\Models\Tags;
use App\Models\Type;
use App\Models\Unit;
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
            'unit_id' => 'required|exists:unit,id'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Category::create([
            'name' => $request->name,
            'unit_id' => $request->unit_id,
            'description' => $request->description
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create category.');
        } else {
            return redirect()->back()->with('error', 'Failed to create category.');
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
            'unit_id' => 'required|exists:unit,id',
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
        $data->unit_id = $request->unit_id;
        $data->description = $request->description;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update category.');
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
        $data = Category::orderBy('name', 'asc')->with(['unit', 'sub_categories'])->get();

        return $data;
    }

    public function getCategoryPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) { $perPage = 15; }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id','name','description','unit_id'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'name'; }

        $query = Category::query()->with(['unit','sub_categories']);
        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)->paginate($perPage)->appends($request->query());
    }

    public function getCategoryById($id)
    {
        $data = Category::with('unit')->find($id);

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
            'product_price'    => 'required|numeric|min:1000',
            'description'      => 'required|string',
            'product_discount' => 'nullable|numeric',
            'unit_id'          => 'required|exists:unit,id',

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

            $product = Product::create([
                'product_name'     => $request->product_name,
                'product_price'    => $request->product_price,
                'product_discount' => $request->product_discount ?? 0,
                'description'      => $request->description,
                'unit_id'          => $request->unit_id,
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
            'product_price'    => 'required|numeric|min:1000',
            'description'      => 'required|string',
            'product_discount' => 'nullable|numeric',
            'unit_id'          => 'required|exists:unit,id',

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

            $product->update([
                'product_name'     => $request->product_name,
                'product_price'    => $request->product_price,
                'product_discount' => $request->product_discount ?? 0,
                'description'      => $request->description,
                'unit_id'          => $request->unit_id,
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
        $allowedSorts = ['id','product_name','description','product_price','total_stock','created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'product_name'; }

        $query = Product::with([
            'stocks',
            'unit',
            'categories',
            'subcategories',
            'divisions',
            'tags',
            'pictures',
        ]);

        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('product_name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)
            ->paginate($perPage)
            ->appends($request->query());
    }

    public function getProductByID($id)
    {
        $product = Product::with([
            'stocks',
            'unit',
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

        return $product;
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
        if ($perPage <= 0) { $perPage = 15; }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id','name','description'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'name'; }

        $query = Tags::query();
        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)->paginate($perPage)->appends($request->query());
    }

    public function createUnit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:unit,name',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Unit::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create unit.');
        } else {
            return redirect()->back()->with('error', 'Failed to create unit.');
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
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Unit::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Unit not found.');
        }

        $data->name = $request->name;
        $data->description = $request->description;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update unit.');
    }

    public function getAllUnit()
    {
        $data = Unit::orderBy('name', 'asc')->with('categories')->get();
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
        $allowedSorts = ['id', 'name', 'description'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $query = Unit::query()->with('categories');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $units = $query->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return $units;
    }
}
