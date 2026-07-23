<?php

namespace App\Http\Traits;

use App\Models\Carts;

/**
 * AuthoritativePricingTrait — server-side recomputation of checkout item prices.
 *
 * SECURITY: Checkout must never trust `items.*.price` from the request body.
 * A client can set it to any value regardless of the real product price, and
 * combined with the geo-based currency switch (Indonesia -> Midtrans/IDR,
 * elsewhere -> PayPal/USD) this previously let an attacker view the USD price
 * (e.g. via VPN), then submit that same numeral as an IDR amount to the
 * Midtrans checkout endpoint.
 *
 * This trait recomputes the true unit price from the product/subcategory/
 * division/variant price fields and discount rules — the same logic already
 * used for cart display in Carts::resolvePriceForCurrency() — so checkout
 * totals are derived from the database, not the request.
 */
trait AuthoritativePricingTrait
{
    protected function resolveAuthoritativeItemPrice(array $item, bool $isIndonesian): float
    {
        $cart = new Carts([
            'product_id' => $item['product_id'] ?? null,
            'category_id' => $item['category_id'] ?? null,
            'sub_category_id' => $item['sub_category_id'] ?? null,
            'division_id' => $item['division_id'] ?? null,
            'variant_id' => $item['variant_id'] ?? null,
        ]);

        return $cart->resolvePriceForCurrency($isIndonesian);
    }
}
