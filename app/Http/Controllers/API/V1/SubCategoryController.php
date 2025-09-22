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
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = SubCategory::create($request->all());

        if ($create) {
            return redirect()->route('subcategory')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create sub category.',
            ]);

        } else {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create sub category..',
            ]);
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
            $sub_category = SubCategory::where('id', $request->sub_category_id)->first();

            if (!$sub_category) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find sub category.',
                ]);
            }

            $create = SubCategoryStock::create($request->all());

            $sub_category->total_stock = $sub_category->total_stock + $request->quantity;
            $sub_category->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add sub category stock.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on sub category: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add sub category stock.',
            ]);
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
            $sub_category = SubCategory::where('id', $request->sub_category_id)->first();

            if (!$sub_category) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find sub category.',
                ]);
            }

            $latest_subcat_stock = SubCategoryStock::where('id', $request->id)->first();

            $sub_category->total_stock = $sub_category->total_stock - $latest_subcat_stock->quantity;
            $sub_category->save();

            $latest_subcat_stock->quantity = $request->quantity;
            $latest_subcat_stock->remarks = $request->remarks;
            $latest_subcat_stock->save();


            $sub_category->total_stock = $sub_category->total_stock + $request->quantity;
            $sub_category->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add sub category stock.',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on sub category: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add sub category stock.',
            ]);
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
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = SubCategory::find($request->id);

        if (!$data) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Category not found.',
            ]);
        }

        $data->name = $request->name;
        $data->category_id = $request->category_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->discount = $request->discount;
        $data->save();

        return redirect()->route('subcategory')->with('alert', [
            'type' => 'success',
            'message' => 'Successfully update sub category.',
        ]);
    }

    public function getAllSubCategory()
    {
        $data = SubCategory::orderBy('name', 'asc')->with(['stocks', 'divisions', 'category'])->get();

        return $data;
    }

    public function getSubCategoryPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) { $perPage = 15; }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id','name','description','price','discount','total_stock','category_id','created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'name'; }

        $query = SubCategory::query()->with(['stocks','divisions','category']);
        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)->paginate($perPage)->appends($request->query());
    }

    public function getSubCategoryById($id)
    {
        $data = SubCategory::with([
            'stocks' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'category'
        ])->find($id);

        return $data;
    }
}
