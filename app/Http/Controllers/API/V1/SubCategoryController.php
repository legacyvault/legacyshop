<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use App\Models\SubCategoryStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SubCategoryController extends Controller
{
    public function createSubCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:sub_category,name',
            'description' => 'string|nullable',
            'category_id' => 'required|exists:category,id',
            'price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = SubCategory::create($request->all());

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create sub category.');
        } else {
            return redirect()->back()->with('error', 'Failed to create sub category.');
        }
    }

    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sub_category_id' => 'required|string|exists:sub_category,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $sub_category = SubCategory::where('id', 'sub_category_id')->first();

            if (!$sub_category) {
                return redirect()->back()->with('error', 'Cannot find sub category.');
            }

            $create = SubCategoryStock::create($request->all());

            $sub_category->total_stock = $sub_category->total_stock + $request->quantity;
            $sub_category->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add sub category stock.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on sub category: ' . $e);
            return redirect()->back()->with('error', 'Failed to add sub category stock.');
        }
    }

    public function updateLatestStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:sub_category_stock,id',
            'sub_category_id' => 'required|string|exists:sub_category,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $sub_category = SubCategory::where('id', 'sub_category_id')->first();

            if (!$sub_category) {
                return redirect()->back()->with('error', 'Cannot find sub category.');
            }

            $latest_subcat_stock = SubCategoryStock::where('id', 'id')->first();

            $sub_category->total_stock = $sub_category->total_stock - $latest_subcat_stock->quantity;
            $sub_category->save();

            $latest_subcat_stock->quantity = $request->quantity;
            $latest_subcat_stock->remarks = $request->remarks;
            $latest_subcat_stock->save();


            $sub_category->total_stock = $sub_category->total_stock + $request->quantity;
            $sub_category->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add sub category stock.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on sub category: ' . $e);
            return redirect()->back()->with('error', 'Failed to add sub category stock.');
        }
    }

    public function updateSubCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:sub_category,id',
            'name' => [
                'required',
                'string',
                Rule::unique('sub_category', 'name')->ignore($request->id),
            ],
            'category_id' => 'required|exists:category,id',
            'description' => 'string|nullable',
            'price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = SubCategory::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Category not found.');
        }

        $data->name = $request->name;
        $data->category_id = $request->category_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->discount = $request->discount;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update sub category.');
    }

    public function getAllSubCategory()
    {
        $data = SubCategory::orderBy('name', 'asc')->with('stocks')->get();

        return redirect()->back()->with([
            'success' => 'Successfully get sub categories.',
            'sub_categories' => $data,
        ]);
    }
}
