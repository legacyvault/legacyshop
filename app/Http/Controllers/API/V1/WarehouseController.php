<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WarehouseController extends Controller
{
    private $baseUrl = "https://api.biteship.com/v1";
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('BITESHIP_API_KEY');
    }

    public function createWarehouse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|unique:warehouses,name',
            'contact_name'  => 'required|string',
            'contact_phone' => 'required|string',
            'address'       => 'required|string',
            'country'       => 'nullable|string',
            'postal_code'   => 'nullable|string',
            'latitude'      => 'required|string',
            'longitude'     => 'required|string',
            'is_active'     => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // 1️⃣ Create lokasi di Biteship
            $response = Http::withToken($this->apiKey)
                ->post('https://api.biteship.com/v1/locations', [
                    'name'          => $request->name,
                    'contact_name'  => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'address'       => $request->address,
                    'note'          => $request->note ?? null,
                    'postal_code'   => $request->postal_code,
                    'latitude'      => $request->latitude,
                    'longitude'     => $request->longitude,
                    'type'          => 'origin',
                ]);

            if (!$response->successful()) {
                DB::rollBack();
                return redirect()->back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Gagal create lokasi di Biteship'
                ]);
            }

            $biteshipData = $response->json();
            $biteshipId = $biteshipData['id'] ?? null;

            $hasAnyWarehouse = Warehouse::exists();
            $isActive = (bool) ($request->is_active ?? false);

            if ($hasAnyWarehouse && $isActive) {
                Warehouse::where('is_active', true)->update(['is_active' => false]);
            }

            $warehouse = new Warehouse();
            $warehouse->name                   = $request->name;
            $warehouse->contact_name           = $request->contact_name;
            $warehouse->contact_phone          = $request->contact_phone;
            $warehouse->address                = $request->address;
            $warehouse->country                = $request->country ?? 'ID';
            $warehouse->postal_code            = $request->postal_code;
            $warehouse->latitude               = $request->latitude;
            $warehouse->longitude              = $request->longitude;
            $warehouse->note                   = $request->note ?? null;
            $warehouse->biteship_location_id   = $biteshipId;
            $warehouse->is_active              = $isActive;
            $warehouse->save();

            DB::commit();

            return redirect()->back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create warehouse.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create warehouse: ' . $e->getMessage());
            DB::rollback();
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create warehouse.'
            ]);
        }
    }

    public function updateWarehouse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'            => 'required|exists:warehouses,id',
            'name'          => 'required|string',
            'contact_name'  => 'required|string',
            'contact_phone' => 'required|string',
            'address'       => 'required|string',
            'country'       => 'nullable|string',
            'postal_code'   => 'nullable|string',
            'latitude'      => 'required|string',
            'longitude'     => 'required|string',
            'is_active'     => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $warehouse = Warehouse::findOrFail($request->id);

            // Update ke Biteship
            $response = Http::withToken($this->apiKey)
                ->post("https://api.biteship.com/v1/locations/{$warehouse->biteship_location_id}", [
                    'name'          => $request->name,
                    'contact_name'  => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'address'       => $request->address,
                    'note'          => null,
                    'postal_code'   => $request->postal_code,
                    'latitude'      => $request->latitude,
                    'longitude'     => $request->longitude,
                    'type'          => 'origin',
                ]);

            if (!$response->successful()) {
                return redirect()->back()->with('error', 'Gagal update lokasi di Biteship');
            }

            if ($request->has('is_active') && $request->is_active) {
                Warehouse::where('id', '!=', $warehouse->id)
                    ->update(['is_active' => false]);
                $warehouse->is_active = true;
            }

            // Update warehouse existing
            $warehouse->name          = $request->name;
            $warehouse->contact_name  = $request->contact_name;
            $warehouse->contact_phone = $request->contact_phone;
            $warehouse->address       = $request->address;
            $warehouse->country       = $request->country ?? 'ID';
            $warehouse->postal_code   = $request->postal_code;
            $warehouse->latitude      = $request->latitude;
            $warehouse->longitude     = $request->longitude;
            $warehouse->save();

            DB::commit();
            return redirect()->back()->with('success', 'Successfully updated warehouse.');
        } catch (Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to update warehouse.');
        }
    }


    public function getAllWarehouse()
    {
        $data = Warehouse::orderBy('name', 'asc')->get();

        return $data;
    }

    public function getActiveWarehouse()
    {
        $data = Warehouse::where('is_active', true)
            ->orderBy('name', 'asc')
            ->first();

        return $data;
    }

    public function getWarehouseById($id)
    {
        $data = Warehouse::find($id);

        return $data;
    }
}
