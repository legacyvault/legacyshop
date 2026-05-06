<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\GeoIpTrait;
use App\Models\Carts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CartsController extends Controller
{
    use GeoIpTrait;

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
                    $cart = Carts::create($lookup + ['quantity' => (int) $targetQty]);
                }
            } else {
                $cart = Carts::updateOrCreate(
                    $lookup,
                    [
                        'quantity' => DB::raw('quantity + ' . (int) $request->quantity)
                    ]
                );
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Add to cart failed: ' . $e->getMessage());
        }
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
