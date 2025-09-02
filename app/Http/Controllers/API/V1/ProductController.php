<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPictures;
use App\Models\Type;
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
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Category::create([
            'name' => $request->name,
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
        $data = Category::orderBy('name', 'asc')->get();

        return redirect()->back()->with([
            'success' => 'Successfully get products.',
            'categories' => $data,
        ]);
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
            'product_price'    => 'required|numeric',
            'product_discount' => 'nullable|numeric',
            'category_id'      => 'required|string',
            'type_id'          => 'required|string',
            'pictures'         => 'nullable|array',
            'pictures.*'       => 'file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $product = Product::create([
                'product_name'     => $request->product_name,
                'product_price'    => $request->product_price,
                'product_discount' => $request->product_discount,
                'category_id'      => $request->category_id,
                'type_id'          => $request->type_id,
            ]);

            if ($request->hasFile('pictures')) {
                foreach ($request->file('pictures') as $file) {

                    $url = $this->uploadToS3($file);

                    ProductPictures::create([
                        'url'        => $url,
                        'product_id' => $product->id,
                    ]);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Add product successful.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product: ' . $e);
            return redirect()->back()->with('error', 'Failed to add product.');
        }
    }
}
