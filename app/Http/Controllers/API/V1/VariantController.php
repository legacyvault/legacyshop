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
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Variant::create($request->all());

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create variant.');
        } else {
            return redirect()->back()->with('error', 'Failed to create variant.');
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
            $variant = Variant::where('id', 'variant_id')->first();

            if (!$variant) {
                return redirect()->back()->with('error', 'Cannot find variant.');
            }

            $create = VariantStock::create($request->all());

            $variant->total_stock = $variant->total_stock + $request->quantity;
            $variant->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add variant.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on variant: ' . $e);
            return redirect()->back()->with('error', 'Failed to add variant stock.');
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
            $variant = Variant::where('id', 'variant_id')->first();

            if (!$variant) {
                return redirect()->back()->with('error', 'Cannot find variant.');
            }

            $latest_variant_stock = VariantStock::where('id', 'id')->first();

            $variant->total_stock = $variant->total_stock - $latest_variant_stock->quantity;
            $variant->save();

            $latest_variant_stock->quantity = $request->quantity;
            $latest_variant_stock->remarks = $request->remarks;
            $latest_variant_stock->save();


            $variant->total_stock = $variant->total_stock + $request->quantity;
            $variant->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add variant stock.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on variant: ' . $e);
            return redirect()->back()->with('error', 'Failed to add variant stock.');
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
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Variant::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Variant not found.');
        }

        $data->name = $request->name;
        $data->division_id = $request->division_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->discount = $request->discount;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update variant.');
    }

    public function getAllVariant()
    {
        $data = Variant::orderBy('name', 'asc')->with('stocks')->get();

        return redirect()->back()->with([
            'success' => 'Successfully get variants.',
            'variants' => $data,
        ]);
    }

    public function getVariantById($id)
    {
        $data = Variant::with('stocks')->find($id);

        return $data;
    }
}
