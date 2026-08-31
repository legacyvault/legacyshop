<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\GeoIpTrait;
use App\Models\Carts;
use App\Models\Category;
use App\Models\Division;
use App\Models\ProductPictures;
use App\Models\SubCategory;
use App\Models\Variant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CartsController extends Controller
{
    use GeoIpTrait;

    /**
     * Maximum number of distinct line items a single cart may hold.
     *
     * This caps the size of every cart payload the storefront has to download —
     * quantity on an existing line is not limited by it, only new lines are.
     */
    public const MAX_CART_ITEMS = 100;

    public function addToCart(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id'       => 'required|exists:products,id',
            'category_id'      => 'required|exists:category,id',
            'sub_category_id'  => 'nullable|exists:sub_category,id',
            'division_id'      => 'nullable|exists:division,id',
            'variant_id'       => 'nullable|exists:variant,id',

            'quantity'         => 'nullable|integer|min:1|required_without:target_quantity',
            'target_quantity'  => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first() ?: 'Invalid cart request.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $lookup = [
                'user_id'         => Auth::id(),
                'product_id'      => $request->product_id,
                'category_id'     => $request->category_id,
                'sub_category_id' => $request->sub_category_id,
                'division_id'     => $request->division_id,
                'variant_id'      => $request->variant_id,
            ];

            $targetQty = $request->input('target_quantity');
            $cart = Carts::where($lookup)->first();

            if ($targetQty !== null) {
                if ($cart) {
                    if ((int) $targetQty === 0) {
                        $cart->delete();
                        DB::commit();
                        if ($request->expectsJson()) {
                            return response()->json(['success' => true, 'deleted' => true]);
                        }
                        return back()->with('alert', [
                            'type' => 'success',
                            'message' => 'Item removed from cart.',
                        ]);
                    }
                    $cart->quantity = (int) $targetQty;
                    $cart->save();
                } else {
                    if ((int) $targetQty === 0) {
                        DB::commit();
                        if ($request->expectsJson()) {
                            return response()->json(['success' => true, 'deleted' => true]);
                        }
                        return back()->with('alert', [
                            'type' => 'success',
                            'message' => 'Item removed from cart.',
                        ]);
                    }
                    if ($limit = $this->cartLimitResponse($request)) {
                        DB::rollBack();
                        return $limit;
                    }
                    $cart = Carts::create($lookup + ['quantity' => (int) $targetQty]);
                }
            } else {
                if (! $cart && ($limit = $this->cartLimitResponse($request))) {
                    DB::rollBack();
                    return $limit;
                }
                $cart = Carts::updateOrCreate(
                    $lookup,
                    [
                        'quantity' => DB::raw('quantity + ' . (int) $request->quantity)
                    ]
                );
            }

            DB::commit();

            if ($request->expectsJson()) {
                // Hand back the updated line (in the slim shape the storefront cart
                // context stores) plus a fresh summary, so the client never has to
                // re-download the whole cart after a mutation.
                $items = $this->buildSlimItems(
                    Carts::where('id', $cart->id)->get(),
                    $this->resolveCountryCodeFromIp($request) === 'ID'
                );

                return response()->json([
                    'success' => true,
                    'item'    => $items[0] ?? null,
                    'summary' => $this->buildSummary(Auth::id()),
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Add to cart failed: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update cart.',
                ], 500);
            }
        }
    }

    /**
     * Refuse a request that would push the cart past MAX_CART_ITEMS.
     *
     * Returns null when the cart still has room, so callers can `if ($r = ...) return $r;`.
     */
    private function cartLimitResponse(Request $request)
    {
        if (Carts::where('user_id', Auth::id())->count() < self::MAX_CART_ITEMS) {
            return null;
        }

        $message = 'Your cart is full (' . self::MAX_CART_ITEMS . ' items max).';

        if ($request->expectsJson()) {
            return response()->json([
                'success'   => false,
                'message'   => $message,
                'max_items' => self::MAX_CART_ITEMS,
            ], 422);
        }

        return back()->with('alert', [
            'type'    => 'error',
            'message' => $message,
        ]);
    }

    public function getCartsForUser(Request $request, $id)
    {
        $carts = Carts::with([
            'product',
            'product.unit',
            'product.categories',
            'product.subcategories',
            'product.divisions',
            'product.variants',
            'product.pictures',
            'category',
            'subCategory',
            'division',
            'variant',
        ])
            ->where('user_id', $id)
            ->get();

        $isIndonesian = $this->resolveCountryCodeFromIp($request) === 'ID';

        foreach ($carts as $cart) {
            if ($cart->product) {
                $this->applyPriceMappingToProduct($cart->product, $isIndonesian);
            }
            if ($cart->subCategory) {
                $this->mapPrice($cart->subCategory, $isIndonesian);
            }
            if ($cart->division) {
                $this->mapPrice($cart->division, $isIndonesian);
            }
            if ($cart->variant) {
                $this->mapPrice($cart->variant, $isIndonesian);
            }
        }

        return $carts;
    }

    public function getCart(Request $request, $id)
    {
        try {
            if (Auth::id() != $id) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Please re-login.'
                    ], 403);
                }
                return back()->with('alert', [
                    'type' => 'error',
                    'message' => 'Please re-login.',
                ]);
            }

            $carts = $this->getCartsForUser($request, $id);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'carts' => $carts,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Get cart failed: ' . $e->getMessage());
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get carts.'
                ], 500);
            }
        }
    }

    /**
     * Cheap aggregate for the header badge — no rows, no relations.
     *
     * This is what the storefront loads on boot; the item list itself is only
     * fetched once the cart dropdown or the cart page actually needs it.
     */
    public function getCartSummary(Request $request, $id)
    {
        if (Auth::id() != $id) {
            return response()->json(['success' => false, 'message' => 'Please re-login.'], 403);
        }

        return response()->json([
            'success' => true,
            'summary' => $this->buildSummary($id),
        ]);
    }

    /**
     * Slim cart listing for the storefront cart context.
     *
     * Unlike getCartsForUser() (which feeds the cart page and needs the full
     * product graph), this returns only the fields the header dropdown renders,
     * with the per-line price already resolved server-side.
     */
    public function getCartItems(Request $request, $id)
    {
        if (Auth::id() != $id) {
            return response()->json(['success' => false, 'message' => 'Please re-login.'], 403);
        }

        try {
            $carts = Carts::select([
                'id',
                'user_id',
                'product_id',
                'category_id',
                'sub_category_id',
                'division_id',
                'variant_id',
                'quantity',
            ])->where('user_id', $id)->get();

            return response()->json([
                'success'   => true,
                'items'     => $this->buildSlimItems($carts, $this->resolveCountryCodeFromIp($request) === 'ID'),
                'summary'   => $this->buildSummary($id),
                'max_items' => self::MAX_CART_ITEMS,
            ]);
        } catch (\Exception $e) {
            Log::error('Get cart items failed: ' . $e->getMessage());

            return response()->json(['success' => false, 'message' => 'Failed to get carts.'], 500);
        }
    }

    private function buildSummary($userId): array
    {
        // `lines` is reserved in MySQL — alias around it.
        $row = Carts::where('user_id', $userId)
            ->selectRaw('COUNT(*) as line_count, COALESCE(SUM(quantity), 0) as unit_count')
            ->first();

        return [
            'lines'     => (int) ($row->line_count ?? 0),
            'units'     => (int) ($row->unit_count ?? 0),
            'max_items' => self::MAX_CART_ITEMS,
        ];
    }

    /**
     * Map cart rows to the slim shape, resolving prices without per-row queries.
     *
     * Every option table and pivot table is fetched once for the whole set, so
     * this stays at a fixed query count no matter how many lines the cart holds
     * (the Carts::$price_per_product accessor, by contrast, costs 3 queries per
     * row — it is deliberately never touched here).
     */
    private function buildSlimItems($carts, bool $isIndonesian): array
    {
        if ($carts->isEmpty()) {
            return [];
        }

        $carts->load([
            'product:id,product_name,product_sku,product_price,product_usd_price,product_discount,unit_id',
            'product.unit:id,name',
            'product.event',
        ]);

        $productIds = $carts->pluck('product_id')->filter()->unique()->values()->all();
        $catIds     = $carts->pluck('category_id')->filter()->unique()->values()->all();
        $subIds     = $carts->pluck('sub_category_id')->filter()->unique()->values()->all();
        $divIds     = $carts->pluck('division_id')->filter()->unique()->values()->all();
        $varIds     = $carts->pluck('variant_id')->filter()->unique()->values()->all();

        // One picture per product is all the dropdown renders — fetch the id/url
        // columns only and keep the same ordering as Product::pictures().
        $pictures = ProductPictures::whereIn('product_id', $productIds)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get(['id', 'product_id', 'url', 'thumbnail_url'])
            ->groupBy('product_id');

        $categories = $catIds ? Category::whereIn('id', $catIds)->get(['id', 'name'])->keyBy('id') : collect();
        $subs       = $subIds ? SubCategory::whereIn('id', $subIds)->get(['id', 'name', 'price', 'usd_price', 'discount'])->keyBy('id') : collect();
        $divisions  = $divIds ? Division::whereIn('id', $divIds)->get(['id', 'name', 'price', 'usd_price', 'discount'])->keyBy('id') : collect();
        $variants   = $varIds ? Variant::whereIn('id', $varIds)->get(['id', 'name', 'price', 'usd_price', 'discount', 'color'])->keyBy('id') : collect();

        $subPivots = $this->pivotMap('product_sub_category', 'sub_category_id', 'use_subcategory_discount', $productIds, $subIds);
        $divPivots = $this->pivotMap('product_division', 'division_id', 'use_division_discount', $productIds, $divIds);
        $varPivots = $this->pivotMap('product_variant', 'variant_id', 'use_variant_discount', $productIds, $varIds);

        return $carts->map(function ($cart) use (
            $isIndonesian,
            $pictures,
            $categories,
            $subs,
            $divisions,
            $variants,
            $subPivots,
            $divPivots,
            $varPivots
        ) {
            $product = $cart->product;
            $event   = $product?->event;

            $isEventActive = (bool) ($event->is_active ?? false);
            $eventDiscount = $isEventActive ? (float) ($event->discount ?? 0) : 0.0;

            $productBase = (float) (($isIndonesian ? $product?->product_price : $product?->product_usd_price) ?? 0);
            // An active event discount supersedes the product's own discount,
            // matching Carts::resolvePriceForCurrency().
            $productDiscount = $eventDiscount > 0 ? $eventDiscount : (float) ($product?->product_discount ?? 0);

            $subCategory = $cart->sub_category_id ? $subs->get($cart->sub_category_id) : null;
            $division    = $cart->division_id ? $divisions->get($cart->division_id) : null;
            $variant     = $cart->variant_id ? $variants->get($cart->variant_id) : null;

            $subBase = $this->optionBase($subCategory, $isIndonesian);
            $divBase = $this->optionBase($division, $isIndonesian);
            $varBase = $this->optionBase($variant, $isIndonesian);

            $originalPrice = $productBase + $subBase + $divBase + $varBase;
            $finalPrice = $this->applyDiscount($productBase, $productDiscount)
                + $this->applyOptionDiscount($subBase, $subCategory, $subPivots->get($cart->product_id . '|' . $cart->sub_category_id), 'use_subcategory_discount')
                + $this->applyOptionDiscount($divBase, $division, $divPivots->get($cart->product_id . '|' . $cart->division_id), 'use_division_discount')
                + $this->applyOptionDiscount($varBase, $variant, $varPivots->get($cart->product_id . '|' . $cart->variant_id), 'use_variant_discount');

            $picture = $pictures->get($cart->product_id)?->first();

            return [
                'id'              => (string) $cart->id,
                'product_id'      => (string) $cart->product_id,
                'category_id'     => $cart->category_id ? (string) $cart->category_id : null,
                'sub_category_id' => $cart->sub_category_id ? (string) $cart->sub_category_id : null,
                'division_id'     => $cart->division_id ? (string) $cart->division_id : null,
                'variant_id'      => $cart->variant_id ? (string) $cart->variant_id : null,
                'quantity'        => (int) $cart->quantity,
                'name'            => $product?->product_name ?? 'Product',
                'sku'             => $product?->product_sku ?? '',
                // Prefer the resized thumbnail; falls back to the full-size url
                // for pictures uploaded before thumbnails were generated.
                'image'           => $picture?->thumbnail_url ?? $picture?->url,
                'price'           => (float) max(0, round($finalPrice)),
                'original_price'  => (float) max(0, round($originalPrice)),
                'currency'        => $isIndonesian ? 'IDR' : 'USD',
                'event'           => $isEventActive ? [
                    'name'      => $event->name ?? null,
                    'discount'  => $eventDiscount,
                    'is_active' => true,
                ] : null,
                'selection'       => [
                    'unit'         => $product?->unit?->name,
                    'category'     => $cart->category_id ? $categories->get($cart->category_id)?->name : null,
                    'subCategory'  => $subCategory?->name,
                    'division'     => $division?->name,
                    'variant'      => $variant?->name,
                    'variantColor' => $variant?->color ?: null,
                ],
            ];
        })->values()->all();
    }

    private function pivotMap(string $table, string $optionKey, string $flagKey, array $productIds, array $optionIds)
    {
        if (! $productIds || ! $optionIds) {
            return collect();
        }

        return DB::table($table)
            ->whereIn('product_id', $productIds)
            ->whereIn($optionKey, $optionIds)
            ->get(['product_id', $optionKey, $flagKey, 'manual_discount'])
            ->keyBy(fn($row) => $row->product_id . '|' . $row->{$optionKey});
    }

    private function optionBase($option, bool $isIndonesian): float
    {
        if (! $option) {
            return 0.0;
        }

        return (float) (($isIndonesian ? $option->price : $option->usd_price) ?? 0);
    }

    private function applyDiscount(float $price, float $discountPercent): float
    {
        if ($price <= 0 || $discountPercent <= 0) {
            return max(0.0, $price);
        }

        $clamped = min(100.0, $discountPercent);

        return max(0.0, $price - ($price * $clamped / 100));
    }

    /**
     * Mirrors Carts::resolvePriceForCurrency(): the entity discount and the
     * pivot's manual discount both apply, in that order.
     */
    private function applyOptionDiscount(float $base, $option, $pivot, string $flagKey): float
    {
        if (! $option || $base <= 0 || ! $pivot) {
            return max(0.0, $base);
        }

        $price = $base;

        if (($pivot->{$flagKey} ?? null) && ($option->discount ?? 0)) {
            $price = $this->applyDiscount($price, (float) $option->discount);
        }

        if ($pivot->manual_discount ?? null) {
            $price = $this->applyDiscount($price, (float) $pivot->manual_discount);
        }

        return max(0.0, $price);
    }

    private function mapPrice($model, $isIndonesian, $isProduct = false)
    {
        if (!$model) return null;

        if ($isProduct) {
            $model->default_price = $isIndonesian
                ? ($model->product_price ?? null)
                : ($model->product_usd_price ?? null);
        } else {
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

        $this->mapPrice($product, $isIndonesian, true);

        foreach ($product->categories ?? [] as $cat) {
            $this->mapPrice($cat, $isIndonesian);
        }

        foreach ($product->subcategories ?? [] as $sub) {
            $this->mapPrice($sub, $isIndonesian);
        }

        foreach ($product->divisions ?? [] as $division) {
            $this->mapPrice($division, $isIndonesian);
        }

        foreach ($product->variants ?? [] as $variant) {
            $this->mapPrice($variant, $isIndonesian);
        }

        return $product;
    }
}
