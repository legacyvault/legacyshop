<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Variant;
use App\Models\VariantStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class VariantController extends Controller
{
    public function createVariant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:variant,name',
            'description' => 'string|nullable',
            'division_id' => 'required|exists:division,id',
            'price' => 'required|numeric',
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric',
            'type' => 'required|in:color,text',
            'color' => 'required_if:type,color|string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Variant::create($request->all());

        if ($create) {
            return redirect()->route('variant')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create variant.',
            ]);
        } else {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create variant..',
            ]);
        }
    }

    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'variant_id' => 'required|string|exists:variant,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $variant = Variant::where('id', $request->variant_id)->first();

            if (!$variant) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find variant.',
                ]);
            }

            $create = VariantStock::create($request->all());

            $variant->total_stock = $variant->total_stock + $request->quantity;
            $variant->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add variant stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on variant: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add variant stock.',
            ]);
        }
    }

    public function updateLatestStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:variant_stock,id',
            'variant_id' => 'required|string|exists:variant,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $variant = Variant::where('id', $request->variant_id)->first();

            if (!$variant) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find variant.',
                ]);
            }

            $latest_variant_stock = VariantStock::where('id', $request->id)->first();

            $variant->total_stock = $variant->total_stock - $latest_variant_stock->quantity;
            $variant->save();

            $latest_variant_stock->quantity = $request->quantity;
            $latest_variant_stock->remarks = $request->remarks;
            $latest_variant_stock->save();


            $variant->total_stock = $variant->total_stock + $request->quantity;
            $variant->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add variant stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on variant: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add variant stock.',
            ]);
        }
    }

    public function updateVariant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:variant,id',
            'name' => [
                'required',
                'string',
                Rule::unique('variant', 'name')->ignore($request->id),
            ],
            'division_id' => 'required|exists:division,id',
            'description' => 'string|nullable',
            'price' => 'required|numeric',
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric',
            'type' => 'required|in:color,text',
            'color' => 'required_if:type,color|string|nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Variant::find($request->id);

        if (!$data) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Variant not found.',
            ]);
        }

        $data->name = $request->name;
        $data->division_id = $request->division_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->usd_price = $request->usd_price;
        $data->discount = $request->discount;
        $data->type = $request->type;
        $data->color = $request->color;
        $data->save();

        return redirect()->route('variant')->with('alert', [
            'type' => 'success',
            'message' => 'Successfully update variant.',
        ]);
    }

    public function getAllVariant()
    {
        $data = Variant::orderBy('name', 'asc')->with(['stocks', 'division'])->get();

        return $data;
    }

    public function getVariantPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) { $perPage = 15; }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id','name','description','price','usd_price','discount','total_stock','division_id','created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'name'; }

        $query = Variant::query()->with(['stocks','division']);
        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)->paginate($perPage)->appends($request->query());
    }

    public function getVariantById($id)
    {
        $data = Variant::with([
            'stocks' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'division'
        ])->find($id);

        return $data;
    }
}
