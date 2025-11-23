<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\MainInternationalShipment;
use App\Models\ZoneInternationalShipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InternationalShipment extends Controller
{
    public function createInternationalShipment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|unique:main_international_shipment,name',
            'description' => 'string|nullable',
            'usd_price'   => 'required|numeric',
            'zone_code'   => 'required|array|min:1',
            'zone_code.*' => 'required|string' // ISO country codes
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $existingCodes = ZoneInternationalShipment::whereIn('country_code', $request->zone_code)->get();

            if ($existingCodes->isNotEmpty()) {
                $conflicts = $existingCodes->pluck('country_code')->implode(', ');

                return redirect()->back()->with('alert', [
                    'type'    => 'error',
                    'message' => "Failed: These country codes are already registered: $conflicts",
                ])->withInput();
            }

            $shipment = MainInternationalShipment::create([
                'name'        => $request->name,
                'description' => $request->description,
                'usd_price'   => $request->usd_price,
            ]);

            // Create zones
            foreach ($request->zone_code as $zoneCode) {
                ZoneInternationalShipment::create([
                    'international_shipment_id' => $shipment->id,
                    'country_code'              => $zoneCode,
                ]);
            }

            DB::commit();

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully created international shipment.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to create international shipment.',
            ]);
        }
    }

    public function updateInternationalShipment(Request $request, $id)
    {
        $shipment = MainInternationalShipment::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|unique:main_international_shipment,name,' . $shipment->id,
            'description' => 'string|nullable',
            'usd_price'   => 'required|numeric',
            'zone_code'   => 'required|array|min:1',
            'zone_code.*' => 'required|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // Check conflict: any of these zone codes already belong to OTHER shipments
            $existingCodes = ZoneInternationalShipment::whereIn('country_code', $request->zone_code)
                ->where('international_shipment_id', '!=', $shipment->id)
                ->get();

            if ($existingCodes->isNotEmpty()) {
                $conflicts = $existingCodes->pluck('country_code')->implode(', ');

                return redirect()->back()->with('alert', [
                    'type'    => 'error',
                    'message' => "Failed: These country codes are already registered: $conflicts",
                ])->withInput();
            }

            // --- Update MAIN shipment ---
            $shipment->update([
                'name'        => $request->name,
                'description' => $request->description,
                'usd_price'   => $request->usd_price,
            ]);

            // --- Replace all zone codes ---
            ZoneInternationalShipment::where('international_shipment_id', $shipment->id)->delete();

            foreach ($request->zone_code as $zoneCode) {
                ZoneInternationalShipment::create([
                    'international_shipment_id' => $shipment->id,
                    'country_code'              => $zoneCode,
                ]);
            }

            DB::commit();

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully updated international shipment.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to update international shipment.',
            ]);
        }
    }

    public function getAllInternationalShipment()
    {
        $shipments = MainInternationalShipment::with('zones')->get();

        return $shipments;
    }

    public function getInternationalShipmentById($id)
    {
        $shipment = MainInternationalShipment::with('zones')->find($id);

        return $shipment;
    }
}
