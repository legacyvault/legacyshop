<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Http\Traits\GeoIpTrait;
use App\Models\Banner;
use App\Models\EventProducts;
use App\Models\Events;
use App\Models\RunningText;
use App\Models\Testimonial;
use App\Models\VoucherModel;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MiscController extends Controller
{
    use AwsS3, GeoIpTrait;

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
        $vouchers = VoucherModel::with(['products' => function ($query) {
            $query->select(['products.id', 'product_name', 'product_sku', 'product_group_id', 'product_price', 'product_usd_price']);
        }])->get();

        return $vouchers;
    }

    public function getVoucherById($id)
    {
        $voucher = VoucherModel::with('products')->find($id);

        return $voucher;
    }

    public function checkVoucher(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_ids'  => 'required|array|min:1',
            'product_ids.*' => 'string',
            'voucher_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $voucher = VoucherModel::where('voucher_code', $request->voucher_code)->first();

        if (!$voucher) {
            return response()->json([
                'message' => 'Voucher not found',
            ], 404);
        }

        $matchingProducts = $voucher->products()
            ->whereIn('products.id', $request->product_ids)
            ->get(['products.id']);

        if ($matchingProducts->isEmpty()) {
            return response()->json([
                'message' => 'Voucher is not applicable for selected products',
            ], 400);
        }

        $voucherData = array_merge($voucher->toArray(), ['products' => $matchingProducts]);

        if (!$voucher->is_limit) {
            return response()->json([
                'message' => 'Voucher is valid',
                'data'    => $voucherData,
            ], 200);
        }

        if ($voucher->limit > 0) {
            return response()->json([
                'message' => 'Voucher is valid',
                'data'    => $voucherData,
            ], 200);
        }

        return response()->json([
            'message' => 'Voucher limit has been reached',
        ], 400);
    }

    public function createVoucher(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'voucher_code' => 'required|string|unique:voucher,voucher_code',
            'is_limit' => 'required|boolean',
            'limit' => 'required_if:is_limit,1|nullable|integer|min:1',
            'product_ids' => 'array',
            'discount'  => 'required'
        ]);

        $voucher = VoucherModel::create($request->only([
            'name',
            'voucher_code',
            'discount',
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
            'discount' => 'required',
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
            'is_limit',
            'discount'
        ]));

        if ($request->has('product_ids')) {
            $voucher->products()->sync($request->product_ids);
        }

        return redirect()->back()->with('success', 'Successfully update voucher.');
    }

    private function findActiveProductConflicts(array $productIds, ?string $excludeEventId = null)
    {
        return EventProducts::whereIn('product_id', $productIds)
            ->whereHas('event', function ($q) use ($excludeEventId) {
                $q->where('is_active', true);
                if ($excludeEventId) {
                    $q->where('id', '<>', $excludeEventId);
                }
            })
            ->with(['event:id,name', 'product:id,product_name'])
            ->get()
            ->map(fn($ep) => [
                'product_id'   => $ep->product_id,
                'product_name' => $ep->product?->product_name,
                'event_id'     => $ep->event_id,
                'event_name'   => $ep->event?->name,
            ]);
    }

    public function createEvent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string',
            'description' => 'string|nullable',
            'discount'    => 'required|numeric',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'is_active'   => 'nullable',
            'show_on_navbar' => 'nullable',
            'show_on_homepage' => 'nullable',
            'product_ids' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // ---- CHECK MAX ACTIVE EVENT ----
            // if ($request->is_active) {
            //     $activeCount = Events::where('is_active', 1)->count();
            //     if ($activeCount >= 3) {
            //         return redirect()->back()->with('error', 'Maximum 3 active events allowed.');
            //     }
            // }

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
            $thumbnailUrl = null;
            if ($request->hasFile('image')) {
                $upload = $this->uploadEventImageToS3($request->file('image'));
                $pictureUrl = $upload['url'];
                $thumbnailUrl = $upload['thumbnail_url'];
            }

            // ---- CREATE EVENT ----
            // NOTE: the max-3-active-events rule is still enforced in
            // Events::booted()'s saving() hook.
            $event = Events::create([
                'name'        => $request->name,
                'description' => $request->description,
                'discount'    => $request->discount,
                'picture_url' => $pictureUrl,
                'thumbnail_url' => $thumbnailUrl,
                'is_active' => $request->is_active ?? true,
                'show_on_navbar' => $request->boolean('show_on_navbar'),
                'show_on_homepage' => $request->boolean('show_on_homepage'),
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
            'show_on_navbar' => 'nullable',
            'show_on_homepage' => 'nullable',
            'product_ids' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $event = Events::findOrFail($id);
            $willBeActive = $request->boolean('is_active', false);

            // ---- CHECK ACTIVE LIMIT (exclude current event) ----
            // if ($request->is_active) {
            //     $activeCount = Events::where('is_active', 1)
            //         ->where('id', '<>', $id)
            //         ->count();

            //     if ($activeCount >= 3) {
            //         return redirect()->back()->with('error', 'Maximum 3 active events allowed.');
            //     }
            // }

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
            $thumbnailUrl = $event->thumbnail_url;
            if ($request->hasFile('image')) {
                if ($event->picture_url) {
                    $this->deleteFromS3($event->picture_url);
                }
                if ($event->thumbnail_url) {
                    $this->deleteFromS3($event->thumbnail_url);
                }
                $upload = $this->uploadEventImageToS3($request->file('image'));
                $pictureUrl = $upload['url'];
                $thumbnailUrl = $upload['thumbnail_url'];
            }

            // ---- UPDATE MAIN EVENT ----
            $event->update([
                'name'        => $request->name,
                'description' => $request->description,
                'discount'    => $request->discount,
                'picture_url' => $pictureUrl,
                'thumbnail_url' => $thumbnailUrl,
                'is_active'   => $request->is_active ?? false,
                'show_on_navbar' => $request->boolean('show_on_navbar'),
                'show_on_homepage' => $request->boolean('show_on_homepage'),
            ]);

            // remove old
            EventProducts::where('event_id', $id)->delete();

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
        $data = Events::orderBy('name', 'asc')
            ->with(['event_products' => function ($query) {
                $query->with(['product' => function ($pq) {
                    $pq->select(['id', 'product_name', 'product_sku', 'product_group_id', 'product_price', 'product_usd_price']);
                }]);
            }])
            ->get();

        // Suppress thumbnail appends to avoid N+1 queries — thumbnails not needed on the event page
        $data->each(function ($event) {
            $event->event_products->each(function ($eventProduct) {
                if ($eventProduct->product) {
                    $eventProduct->product->setAppends([]);
                }
            });
        });

        return $data;
    }

    public function getAllActiveEvents(Request $request)
    {
        try {
            $isIndonesian = $this->resolveCountryCodeFromIp($request) === 'ID';

            // Load events with products
            $events = Events::orderBy('name', 'asc')
                ->with([
                    'event_products.product' => function ($query) {
                        $query->with([
                            'stocks',
                            'unit',
                            'subUnit',
                            'tags',
                            'categories',
                            'subcategories',
                            'divisions',
                            'variants',
                            'pictures',
                            'event'
                        ]);
                    }
                ])
                ->where('is_active', 1)
                ->get();

            //Apply price mapping
            $events->transform(function ($event) use ($isIndonesian) {
                foreach ($event->event_products as $eventProduct) {
                    if ($eventProduct->product) {
                        $this->applyPriceMappingToProduct(
                            $eventProduct->product,
                            $isIndonesian
                        );
                    }
                }
                return $event;
            });

            return $events;
        } catch (\Exception $e) {
            Log::error('Failed to get active events: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get active events'
            ], 500);
        }
    }

    /**
     * Events for the header's "Events" dropdown only.
     *
     */
    public function getNavbarEvents(Request $request)
    {
        try {
            return Events::query()
                ->select('id', 'name', 'description', 'discount', 'is_active', 'show_on_navbar')
                ->where('is_active', 1)
                ->where('show_on_navbar', 1)
                ->orderBy('name', 'asc')
                ->get();
        } catch (\Exception $e) {
            Log::error('Failed to get navbar events: ' . $e->getMessage());

            return collect();
        }
    }

    /**
     * Events for the homepage.
     *
     * getAllActiveEvents() eager-loads every relation of every product (stocks,
     * tags, categories, subcategories, divisions, variants, ...) because the
     * listing and API consumers need them. The homepage renders nothing but a
     * ProductCard per product, so shipping that full graph inlined it as
     * megabytes of JSON into the initial HTML on every visit.
     *
     * Returns every active event, because FrontHeader reads this same prop for
     * its navbar dropdown, but only carries products for the events the
     * homepage carousels actually draw — and only the columns a card reads.
     */
    public function getHomepageEvents(Request $request)
    {
        try {
            $isIndonesian = $this->resolveCountryCodeFromIp($request) === 'ID';

            $events = Events::query()
                ->select('id', 'name', 'description', 'discount', 'is_active', 'show_on_navbar', 'show_on_homepage')
                ->where('is_active', 1)
                ->orderBy('name', 'asc')
                ->get();

            // Navbar-only events appear as links; they never need their products.
            $events->each(fn($event) => $event->setRelation('event_products', collect()));

            $events
                ->filter(fn($event) => (bool) $event->show_on_homepage)
                ->load([
                    'event_products' => function ($query) {
                        $query->select('id', 'event_id', 'product_id');
                    },
                    'event_products.product' => function ($query) {
                        $query
                            ->select(
                                'id',
                                'product_name',
                                'unit_id',
                                'product_price',
                                'product_usd_price',
                                'product_discount'
                            )
                            ->with([
                                // The card shows the first two pictures (default + hover)
                                'pictures' => function ($pictures) {
                                    $pictures->select('id', 'product_id', 'url', 'thumbnail_url', 'sort_order', 'created_at');
                                },
                                'unit' => function ($unit) {
                                    $unit->select('id', 'name', 'price', 'usd_price');
                                },
                                // Drives the discount badge and the struck-through price
                                'event' => function ($event) {
                                    $event->select('events.id', 'events.name', 'events.discount');
                                },
                            ]);
                    },
                ]);

            $events->each(function ($event) use ($isIndonesian) {
                foreach ($event->event_products as $eventProduct) {
                    if (!$eventProduct->product) {
                        continue;
                    }

                    $this->mapPrice($eventProduct->product, $isIndonesian, true);

                    if ($eventProduct->product->unit) {
                        $this->mapPrice($eventProduct->product->unit, $isIndonesian);
                    }

                    // The card renders picture 0 (default) and picture 1 (hover);
                    // anything beyond that is payload nobody looks at.
                    $eventProduct->product->setRelation(
                        'pictures',
                        $eventProduct->product->pictures->take(2)->values()
                    );
                }
            });

            return $events;
        } catch (\Exception $e) {
            Log::error('Failed to get homepage events: ' . $e->getMessage());

            return collect();
        }
    }

    private function mapPrice($model, $isIndonesian, $isProduct = false)
    {
        if (!$model) return null;

        if ($isProduct) {
            // Product uses product_price & product_usd_price
            $model->default_price = $isIndonesian
                ? ($model->product_price ?? null)
                : ($model->product_usd_price ?? null);
        } else {
            // Other models use price & usd_price
            $model->default_price = $isIndonesian
                ? ($model->price ?? null)
                : ($model->usd_price ?? null);
        }

        $model->default_currency = $isIndonesian ? 'IDR' : 'USD';

        return $model;
    }

    private function applyPriceMappingToProduct($product, $isIndonesian)
    {
        if (!$product) return null;

        // Product price
        $this->mapPrice($product, $isIndonesian, true);

        // Unit
        if ($product->unit) {
            $this->mapPrice($product->unit, $isIndonesian);
        }

        // Sub Unit
        if ($product->subUnit) {
            $this->mapPrice($product->subUnit, $isIndonesian);
        }

        // Categories
        foreach ($product->categories as $cat) {
            $this->mapPrice($cat, $isIndonesian);
        }

        // Sub Categories
        foreach ($product->subcategories as $sub) {
            $this->mapPrice($sub, $isIndonesian);
        }

        // Divisions
        foreach ($product->divisions as $division) {
            $this->mapPrice($division, $isIndonesian);
        }

        // Variants
        foreach ($product->variants as $variant) {
            $this->mapPrice($variant, $isIndonesian);
        }

        return $product;
    }

    public function getEventById($id)
    {
        $data = Events::orderBy('name', 'asc')->with('event_products.product')->find($id);

        return $data;
    }

    public function getProductEventById($id)
    {
        $data = Events::with([
            'event_products.product' => function ($query) {
                $query->with([
                    'stocks',
                    'unit',
                    'subUnit',
                    'tags',
                    'categories',
                    'subcategories',
                    'divisions',
                    'variants',
                    'pictures'
                ]);
            }
        ])
            ->find($id);

        return $data;
    }

    /**
     * Instagram handles are stored bare (no leading "@") so the frontend can
     * render and link them consistently.
     */
    private function normalizeInstagramAccount(?string $account): ?string
    {
        $account = trim((string) $account);
        $account = ltrim($account, '@');

        return $account === '' ? null : $account;
    }

    private function testimonialRules(bool $imageRequired): array
    {
        return [
            'name'              => 'required|string|max:100',
            'instagram_account' => ['nullable', 'string', 'max:31', 'regex:/^@?[A-Za-z0-9._]{1,30}$/'],
            'message'           => 'required|string|max:500',
            'image'             => ($imageRequired ? 'required' : 'nullable') . '|file|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    public function createTestimonial(Request $request)
    {
        $validator = Validator::make($request->all(), $this->testimonialRules(true), [
            'instagram_account.regex' => 'Instagram account may only contain letters, numbers, dots and underscores.',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $image = $this->uploadTestimonialImageToS3($request->file('image'));

            Testimonial::create([
                'name'              => $request->name,
                'instagram_account' => $this->normalizeInstagramAccount($request->instagram_account),
                'message'           => $request->message,
                'picture_url'       => $image['url'],
                'thumbnail_url'     => $image['thumbnail_url'],
            ]);

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully create testimonial.',
            ]);
        } catch (Exception $e) {
            Log::error('[ERROR] Failed to create testimonial: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to create testimonial.',
            ]);
        }
    }

    public function updateTestimonial(Request $request, $id)
    {
        $testimonial = Testimonial::find($id);

        if (!$testimonial) {
            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Testimonial not found.',
            ]);
        }

        $validator = Validator::make($request->all(), $this->testimonialRules(false), [
            'instagram_account.regex' => 'Instagram account may only contain letters, numbers, dots and underscores.',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            if ($request->hasFile('image')) {
                $oldPicture = $testimonial->picture_url;
                $oldThumb   = $testimonial->thumbnail_url;

                $image = $this->uploadTestimonialImageToS3($request->file('image'), $testimonial->id);

                $testimonial->picture_url   = $image['url'];
                $testimonial->thumbnail_url = $image['thumbnail_url'];

                if ($oldPicture) {
                    $this->deleteFromS3($oldPicture);
                }
                if ($oldThumb) {
                    $this->deleteFromS3($oldThumb);
                }
            }

            $testimonial->name              = $request->name;
            $testimonial->instagram_account = $this->normalizeInstagramAccount($request->instagram_account);
            $testimonial->message           = $request->message;
            $testimonial->save();

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully update testimonial.',
            ]);
        } catch (Exception $e) {
            Log::error('[ERROR] Failed to update testimonial: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to update testimonial.',
            ]);
        }
    }

    public function deleteTestimonial($id)
    {
        $testimonial = Testimonial::find($id);

        if (!$testimonial) {
            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Testimonial not found.',
            ]);
        }

        try {
            $picture = $testimonial->picture_url;
            $thumb   = $testimonial->thumbnail_url;

            $testimonial->delete();

            if ($picture) {
                $this->deleteFromS3($picture);
            }
            if ($thumb) {
                $this->deleteFromS3($thumb);
            }

            return redirect()->back()->with('alert', [
                'type'    => 'success',
                'message' => 'Successfully delete testimonial.',
            ]);
        } catch (Exception $e) {
            Log::error('[ERROR] Failed to delete testimonial: ' . $e->getMessage());

            return redirect()->back()->with('alert', [
                'type'    => 'error',
                'message' => 'Failed to delete testimonial.',
            ]);
        }
    }

    public function getAllTestimonials()
    {
        return Testimonial::orderBy('created_at', 'desc')->get();
    }
}
