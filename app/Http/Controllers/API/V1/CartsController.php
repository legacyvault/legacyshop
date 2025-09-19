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
            'product_id'      => 'required|exists:product,id',
            'category_id'      => 'required|exists:category,id',
            'sub_category_id' => 'nullable|exists:sub_category,id',
            'division_id'     => 'nullable|exists:division,id',
            'variant_id'      => 'nullable|exists:variant,id',
            'quantity'        => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $cart = Carts::updateOrCreate(
                [
                    'user_id'        => Auth::id(),
                    'product_id'     => $request->product_id,
                    'category_id'     => $request->category_id,
                    'sub_category_id' => $request->sub_category_id,
                    'division_id'    => $request->division_id,
                    'variant_id'     => $request->variant_id,
                ],
                [
                    'quantity' => DB::raw('quantity + ' . $request->quantity)
                ]
            );

            DB::commit();

            return back()->with('alert', [
                'type' => 'success',
                'message' => 'Successfully add to cart.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Add to cart failed: ' . $e->getMessage());
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to add to cart.',
            ]);
        }
    }

    public function getCart($id)
    {
        try {
            if (Auth::id() != $id) {
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
                'product.variants'
            ])
                ->where('user_id', $id)
                ->get();

            return redirect()->back()->with([
                'success' => 'Successfully get carts.',
                'carts' => $carts,
            ]);
        } catch (\Exception $e) {
            Log::error('Get cart failed: ' . $e->getMessage());
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to get carts.',
            ]);
        }
    }
}
