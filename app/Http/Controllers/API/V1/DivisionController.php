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
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = Division::create($request->all());

        if ($create) {
            return redirect()->route('division')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create division.',
            ]);
        } else {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create division.',
            ]);
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
            $division = Division::where('id', $request->division_id)->first();

            if (!$division) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find division.',
                ]);
            }

            $create = DivisionStock::create($request->all());

            $division->total_stock = $division->total_stock + $request->quantity;
            $division->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add division stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on division: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add division stock.',
            ]);
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
            $division = Division::where('id', $request->division_id)->first();

            if (!$division) {
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Cannot find division.',
                ]);
            }

            $latest_division_stock = DivisionStock::where('id', $request->id)->first();

            $division->total_stock = $division->total_stock - $latest_division_stock->quantity;
            $division->save();

            $latest_division_stock->quantity = $request->quantity;
            $latest_division_stock->remarks = $request->remarks;
            $latest_division_stock->save();


            $division->total_stock = $division->total_stock + $request->quantity;
            $division->save();

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add division stock.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to add stock on division: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add division stock.',
            ]);
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
            'usd_price' => 'required|numeric',
            'discount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = Division::find($request->id);

        if (!$data) {
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Division not found.',
            ]);
        }

        $data->name = $request->name;
        $data->sub_category_id = $request->sub_category_id;
        $data->description = $request->description;
        $data->price = $request->price;
        $data->usd_price = $request->usd_price;
        $data->discount = $request->discount;
        $data->save();

        return redirect()->route('division')->with('alert', [
            'type' => 'success',
            'message' => 'Successfully update division.',
        ]);
    }

    public function getAllDivision()
    {
        $data = Division::orderBy('name', 'asc')->with(['stocks','variants', 'sub_category.category.sub_unit.unit'])->get();

        return $data;
    }

    public function getDivisionPaginated(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) { $perPage = 15; }
        $search   = $request->input('q');
        $sortBy   = $request->input('sort_by', 'name');
        $sortDir  = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id','name','description','price','usd_price','discount','total_stock','sub_category_id','created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) { $sortBy = 'name'; }

        $query = Division::query()->with(['stocks','variants','sub_category']);
        if ($search) {
            $query->where(function($q) use ($search){
                $q->where('name','like',"%{$search}%")
                  ->orWhere('description','like',"%{$search}%");
            });
        }

        return $query->orderBy($sortBy,$sortDir)->paginate($perPage)->appends($request->query());
    }

    public function getDivisionById($id)
    {
        $data = Division::with([            
            'stocks' => function ($query) {
            $query->orderBy('created_at', 'desc');
            },
            'sub_category'
        ])->find($id);

        return $data;
    }
}
