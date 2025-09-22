<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Banner;
use App\Models\RunningText;
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
            'is_active' => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $create = RunningText::create([
            'running_text' => $request->running_text,
            'is_active' => $request->is_active,
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
            'id' => 'required|exists:running_text,id',
            'running_text' => 'required|string',
            'is_active' => 'nullable'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = RunningText::find($request->id);

        if (!$data) {
            return redirect()->back()->with('error', 'Running text not found.');
        }

        $data->running_text = $request->running_text;
        $data->is_active = $request->is_active;
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
        $data = RunningText::orderBy('created_at', 'desc')->where('is_active', true)->get();

        return $data;
    }

    public function createBanner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'banner_text' => 'required|string',
            'is_active' => 'nullable',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
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
                'banner_text' => $request->banner_text,
                'is_active' => $request->is_active,
                'picture_url' => $pictureUrl,
            ]);

            if ($create) {
                DB::commit();
                return redirect()->route('subcategory')->with('alert', [
                    'type' => 'success',
                    'message' => 'Successfully create banner.',
                ]);
            } else {
                return redirect()->route('subcategory')->with('alert', [
                    'type' => 'error',
                    'message' => 'Failed to create banner.',
                ]);
            }
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to create banner: ' . $e);
        }
    }

    public function updateBanner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:banner,id',
            'banner_text' => 'string|required',
            'is_active' => 'nullable',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
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
            $banner->is_active = $request->is_active;
            $banner->save();

            DB::commit();
            return redirect()->back()->with('success', 'Successfully update banner.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('[ERROR] Failed to update banner: ' . $e);
            return redirect()->back()->with('error', 'Failed update banner.');
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
}
