<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Banner;
use App\Models\EventProducts;
use App\Models\Events;
use App\Models\RunningText;
use App\Models\VoucherModel;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MiscController extends Controller
{
    use AwsS3;

    public function createRunningText(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'running_text' => 'required|string',
            'is_active'    => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        if ($request->boolean('is_active')) {
            RunningText::where('is_active', true)->update(['is_active' => false]);
        }

        $create = RunningText::create([
            'running_text' => $request->running_text,
            'is_active'    => $request->boolean('is_active'),
        ]);

        if ($create) {
            return redirect()->back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create running text.',
            ]);
        } else {
            return redirect()->back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create running text.',
            ]);
        }
    }


    public function updateRunningText(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'           => 'required|exists:running_text,id',
            'running_text' => 'required|string',
            'is_active'    => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = RunningText::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Running text not found.');
        }

        if ($request->boolean('is_active')) {
            RunningText::where('id', '!=', $data->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $data->running_text = $request->running_text;
        $data->is_active = $request->boolean('is_active');
        $data->save();

        return redirect()->back()->with('alert', [
            'type' => 'success',
            'message' => 'Successfully create running text.',
        ]);
    }


    public function getAllRunningText()
    {
        $data = RunningText::orderBy('created_at', 'desc')->get();

        return $data;
    }

    public function getActiveRunningText()
    {
        $data = RunningText::where('is_active', true)
            ->latest()
            ->first();

        return $data;
    }

    public function createBanner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'banner_text'  => 'nullable|string',
            'is_active'    => 'nullable|boolean',
            'image'        => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'url'          => 'nullable|string',
            'banner_title' => 'nullable|string',
            'button_text'  => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $pictureUrl = null;
            if ($request->hasFile('image')) {
                $pictureUrl = $this->uploadBannerImageToS3($request->file('image'));
            }

            $create = Banner::create([
                'banner_text'  => $request->banner_text,
                'is_active'    => $request->boolean('is_active'),
                'picture_url'  => $pictureUrl,
                'url'          => $request->url,
                'banner_title' => $request->banner_title,
                'button_text'  => $request->button_text
            ]);

            DB::commit();

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully create banner.',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to create banner: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to create banner.',
            ]);
        }
    }

    public function updateBanner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'           => 'required|exists:banner,id',
            'banner_text'  => 'nullable|string',
            'is_active'    => 'nullable|boolean',
            'image'        => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'url'          => 'nullable|string',
            'banner_title' => 'nullable|string',
            'button_text'  => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $banner = Banner::find($request->id);
            if (!$banner) {
                return redirect()->back()->with('error', 'Banner not found.');
            }

            if ($request->hasFile('image')) {
                if ($banner->picture_url) {
                    $this->deleteFromS3($banner->picture_url);
                }
                $banner->picture_url = $this->uploadBannerImageToS3($request->file('image'), $banner->id);
            }

            $banner->banner_text = $request->banner_text;
            $banner->url = $request->url;
            $banner->banner_title = $request->banner_title;
            $banner->button_text = $request->button_text;
            $banner->is_active = $request->boolean('is_active');

            $banner->save();
            DB::commit();

            return redirect()->back()->with('success', 'Successfully update banner.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to update banner: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to update banner.');
        }
    }

    public function getAllBanner()
    {
        $data = Banner::orderBy('created_at', 'desc')->get();

        return $data;
    }

    public function getActiveBanner()
    {
        $data = Banner::orderBy('created_at', 'desc')->where('is_active', true)->get();

        return $data;
    }

    public function getAllVoucher()
    {
        $vouchers = VoucherModel::with('products')->get();

        return $vouchers;
    }

    public function getVoucherById($id)
    {
        $voucher = VoucherModel::with('products')->find($id);

        return $voucher;
    }

    public function createVoucher(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'voucher_code' => 'required|string|unique:voucher,voucher_code',
            'is_limit' => 'required|boolean',
            'limit' => 'required_if:is_limit,1|nullable|integer|min:1',
            'product_ids' => 'array',
        ]);

        $voucher = VoucherModel::create($request->only([
            'name',
            'voucher_code',
            'limit',
            'is_limit'
        ]));

        if ($request->has('product_ids')) {
            $voucher->products()->sync($request->product_ids);
        }

        return redirect()->back()->with('success', 'Successfully create voucher.');
    }

    public function updateVoucher(Request $request, $id)
    {
        $voucher = VoucherModel::find($id);

        if (!$voucher) {
            return redirect()->back()->with('error', 'Failed to get voucher.');
        }

        $request->validate([
            'name' => 'required|string',
            'voucher_code' => 'required|string|unique:voucher,voucher_code,' . $id,
            'is_limit' => 'required|boolean',
            'limit' => 'required_if:is_limit,1|nullable|integer|min:1',
            'product_ids' => 'array',
        ]);

        if (!$request->is_limit) {
            $request->merge(['limit' => null]);
        }

        $voucher->update($request->only([
            'name',
            'voucher_code',
            'limit',
            'is_limit'
        ]));

        if ($request->has('product_ids')) {
            $voucher->products()->sync($request->product_ids);
        }

        return redirect()->back()->with('success', 'Successfully update voucher.');
    }

    public function createEvent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string',
            'description' => 'string|nullable',
            'discount' => 'required|numeric',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'is_active' => 'nullable',
            'product_ids' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // ---- CHECK MAX ACTIVE EVENT ----
            if ($request->is_active) {
                $activeCount = Events::where('is_active', 1)->count();
                if ($activeCount >= 3) {
                    return redirect()->back()->with('error', 'Maximum 3 active events allowed.');
                }
            }

            // ---- CHECK PRODUCT BELONGS TO ONLY ONE EVENT ----
            $existingProducts = EventProducts::whereIn('product_id', $request->product_ids)->get();

            if ($existingProducts->count() > 0) {
                $usedProductIds = $existingProducts->pluck('product_id')->toArray();

                return redirect()->back()
                    ->with('error', 'Some products are already assigned to another event: ' . implode(', ', $usedProductIds))
                    ->withInput();
            }

            // ---- UPLOAD IMAGE ----
            $pictureUrl = null;
            if ($request->hasFile('image')) {
                $pictureUrl = $this->uploadEventImageToS3($request->file('image'));
            }

            // ---- CREATE EVENT ----
            $event = Events::create([
                'name'        => $request->name,
                'description' => $request->description,
                'discount' => $request->discount,
                'picture_url' => $pictureUrl,
                'is_active' => $request->is_active ?? true,
            ]);

            // ---- INSERT EVENT PRODUCTS ----
            foreach ($request->product_ids as $pid) {
                EventProducts::create([
                    'event_id' => $event->id,
                    'product_id' => $pid,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Successfully created event.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to create event: ' . $e);
            return redirect()->back()->with('error', 'Failed to create event: ' . $e->getMessage());
        }
    }

    public function updateEvent(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string',
            'description' => 'string|nullable',
            'discount'    => 'required|numeric',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'is_active'   => 'nullable',
            'product_ids' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $event = Events::findOrFail($id);

            // ---- CHECK ACTIVE LIMIT (exclude current event) ----
            if ($request->is_active) {
                $activeCount = Events::where('is_active', 1)
                    ->where('id', '<>', $id)
                    ->count();

                if ($activeCount >= 3) {
                    return redirect()->back()->with('error', 'Maximum 3 active events allowed.');
                }
            }

            // ---- CHECK PRODUCT CAN ONLY BE IN ONE EVENT ----
            // exclude products already belonging to this event
            $existingProducts = EventProducts::whereIn('product_id', $request->product_ids)
                ->where('event_id', '<>', $id) // exclude current event
                ->get();

            if ($existingProducts->count() > 0) {
                $usedProductIds = $existingProducts->pluck('product_id')->toArray();
                return redirect()->back()
                    ->with('error', 'Some products are already assigned to another event: ' . implode(', ', $usedProductIds))
                    ->withInput();
            }

            // ---- IMAGE UPDATE (optional) ----
            $pictureUrl = $event->picture_url;
            if ($request->hasFile('image')) {
                if ($event->picture_url) {
                    $this->deleteFromS3($event->picture_url);
                }
                $pictureUrl = $this->uploadEventImageToS3($request->file('image'));
            }

            // ---- UPDATE MAIN EVENT ----
            $event->update([
                'name'        => $request->name,
                'description' => $request->description,
                'discount'    => $request->discount,
                'picture_url' => $pictureUrl,
                'is_active'   => $request->is_active ?? false,
            ]);

            // ---- UPDATE EVENT PRODUCTS ----
            // remove old
            EventProducts::where('event_id', $id)->delete();

            // insert new
            foreach ($request->product_ids as $pid) {
                EventProducts::create([
                    'event_id' => $id,
                    'product_id' => $pid,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Successfully updated event.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to update event: ' . $e);
            return redirect()->back()->with('error', 'Failed to update event: ' . $e->getMessage());
        }
    }

    public function getAllEvents()
    {
        $data = Events::orderBy('name', 'asc')->with('event_products.product')->get();
        return $data;
    }

    public function getAllActiveEvents()
    {
        $data = Events::orderBy('name', 'asc')->with('event_products.product')->where('is_active', 1)->get();
        return $data;
    }

    public function getEventById($id)
    {
        $data = Events::orderBy('name', 'asc')->with('event_products.product')->find($id);
        return $data;
    }
}
