// components/CartDropdown.tsx
import { Auth } from '@/types';
import { Link } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';

const CHECKOUT_ITEMS_STORAGE_KEY = 'checkout:selectedItems';

export const CartDropdown = ({ auth }: { auth: Auth }) => {
    const { items, totalItems, totalPrice, updateQuantity, removeItem, isCartOpen, openCart } = useCart();

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                openCart(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const computePriceInfo = useCallback((item: (typeof items)[number]) => {
        const product = item.meta?.product as any;
        const basePrice = Number(product?.product_price ?? item.price ?? 0);
        const eventDiscount = Number(product?.event?.discount ?? 0);
        const isEventActive = Boolean(product?.event && (product.event.is_active === 1 || product.event.is_active === true));
        const discountedBase = isEventActive && eventDiscount > 0 ? Math.max(0, Math.round(basePrice - (basePrice * eventDiscount) / 100)) : null;

        const candidatePrices = [discountedBase, Number(item.price ?? 0)].filter(
            (price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0,
        );
        const finalPrice = candidatePrices.length ? Math.min(...candidatePrices) : 0;
        const originalPrice = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : finalPrice;

        return {
            finalPrice,
            originalPrice,
            isEventActive,
            eventName: isEventActive ? (product?.event?.name ?? null) : null,
            eventDiscount,
        };
    }, []);

    const persistCheckoutItems = useCallback(() => {
        if (typeof window === 'undefined' || items.length === 0) {
            return;
        }

        const payload = items.map((item) => {
            const priceInfo = computePriceInfo(item);
            return {
                id: item.id,
                store: 'Legacy Vault',
                name: item.name,
                variant: undefined,
                attributes: [],
                quantity: Math.max(1, Number(item.quantity ?? 0)),
                price: Number(priceInfo.finalPrice ?? item.price ?? 0),
                originalPrice: Number(priceInfo.originalPrice ?? priceInfo.finalPrice ?? item.price ?? 0),
                image: item.image,
                weight: 0,
                source: item.serverId ? 'server' : 'local',
                cartId: item.serverId ?? null,
                productId: item.meta?.product_id ?? null,
                protectionPrice: 0,
                protectionLabel: null,
                eventName: priceInfo.eventName ?? null,
                eventDiscountPct: priceInfo.isEventActive ? (priceInfo.eventDiscount ?? null) : null,
                isEventActive: priceInfo.isEventActive,
                selectionSummary: {
                    unit: item.meta?.product?.unit?.name ?? undefined,
                },
            };
        });

        try {
            sessionStorage.setItem(CHECKOUT_ITEMS_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore write errors (e.g. private mode)
        }
    }, [items, computePriceInfo]);

    return (
        <div className="relative z-20" ref={dropdownRef}>
            {/* Cart Icon Button */}
            <button
                onClick={() => openCart(!isCartOpen)}
                className="relative cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted focus:ring-2 focus:ring-ring focus:outline-none"
            >
                <ShoppingCart className="h-5 w-5 text-foreground md:h-6 md:w-6" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                        {totalItems > 99 ? '99+' : totalItems}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isCartOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg bg-background shadow-lg">
                    <div className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-card-foreground">Shopping Cart</h3>
                            <button onClick={() => openCart(false)} className="rounded-md p-1 hover:bg-muted">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="py-8 text-center">
                                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                            </div>
                        ) : (
                            <>
                                {/* Cart Items */}
                                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
                                    {items.map((item) => {
                                        const priceInfo = computePriceInfo(item);
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                                                {/* Product Image */}
                                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-sm font-medium text-card-foreground">{item.name}</h4>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-card-foreground">
                                                            {formatPrice(priceInfo.finalPrice)}
                                                        </span>
                                                        {priceInfo.isEventActive && priceInfo.originalPrice > priceInfo.finalPrice ? (
                                                            <>
                                                                <span className="text-[11px] text-muted-foreground line-through">
                                                                    {formatPrice(priceInfo.originalPrice)}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                                                                    Event {priceInfo.eventName ?? ''} • {priceInfo.eventDiscount}% OFF
                                                                </span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="rounded p-1 hover:bg-muted"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="rounded p-1 hover:bg-muted"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total */}
                                <div className="-mx-4 rounded-b-lg border-t border-foreground/20 px-4 pt-4">
                                    {/* <div className="mb-4 flex items-center justify-between">
                                        <span className="font-medium text-foreground">Total:</span>
                                        <span className="text-lg font-bold text-foreground">{formatPrice(totalPrice)}</span>
                                    </div> */}

                                    {/* Action Buttons */}
                                    <div className="flex w-full gap-2">
                                        <Link href={auth.user ? `/view-cart/${auth.user.id}` : `/view-cart`} className="w-full">
                                            <Button className="w-full">View Cart</Button>
                                        </Link>
                                        {/* <Link
                                            href="/checkout"
                                            className="w-full"
                                            onClick={() => {
                                                persistCheckoutItems();
                                                openCart(false);
                                            }}
                                        >
                                            <Button className="w-full" variant={'outline'}>
                                                Checkout
                                            </Button>
                                        </Link> */}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
