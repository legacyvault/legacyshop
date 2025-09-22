<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Carts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CartsController extends Controller
{
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

            $carts = Carts::with([
                'product',
                'product.unit',
                'product.categories',
                'product.subcategories',
                'product.divisions',
                'product.variants',
                'product.pictures',
            ])
                ->where('user_id', $id)
                ->get();

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
}
