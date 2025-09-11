<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\DivisionStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DivisionController extends Controller
{
    public function createDivision(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:division,name',
            'description' => 'string|nullable',
            'sub_category_id' => 'required|exists:sub_category,id',
            'price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Division::create($request->all());

        if ($create) {
            return redirect()->back()->with('success', 'Successfully create division.');
        } else {
            return redirect()->back()->with('error', 'Failed to create division.');
        }
    }

    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|string|exists:division,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $division = Division::where('id', 'division_id')->first();

            if (!$division) {
                return redirect()->back()->with('error', 'Cannot find division.');
            }

            $create = DivisionStock::create($request->all());

            $division->total_stock = $division->total_stock + $request->quantity;
            $division->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add division.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on division: ' . $e);
            return redirect()->back()->with('error', 'Failed to add division stock.');
        }
    }

    public function updateLatestStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:division_stock,id',
            'division_id' => 'required|string|exists:division,id',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $division = Division::where('id', 'division_id')->first();

            if (!$division) {
                return redirect()->back()->with('error', 'Cannot find division.');
            }

            $latest_division_stock = DivisionStock::where('id', 'id')->first();

            $division->total_stock = $division->total_stock - $latest_division_stock->quantity;
            $division->save();

            $latest_division_stock->quantity = $request->quantity;
            $latest_division_stock->remarks = $request->remarks;
            $latest_division_stock->save();


            $division->total_stock = $division->total_stock + $request->quantity;
            $division->save();

            DB::commit();

            return redirect()->back()->with('success', 'Successfully add division stock.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on division: ' . $e);
            return redirect()->back()->with('error', 'Failed to add division stock.');
        }
    }

    public function updateDivision(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:division,id',
            'name' => [
                'required',
                'string',
                Rule::unique('division', 'name')->ignore($request->id),
            ],
            'sub_category_id' => 'required|exists:sub_category,id',
            'description' => 'string|nullable',
            'price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Division::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Division not found.');
        }

        $data->name = $request->name;
        $data->sub_category_id = $request->sub_category_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->discount = $request->discount;
        $data->save();

        return redirect()->back()->with('success', 'Successfully update division.');
    }

    public function getAllDivision()
    {
        $data = Division::orderBy('name', 'asc')->with(['stocks','variants'])->get();

        return redirect()->back()->with([
            'success' => 'Successfully get division.',
            'divisions' => $data,
        ]);
    }

    public function getDivisionById($id)
    {
        $data = Division::with('stocks')->find($id);

        return $data;
    }
}
