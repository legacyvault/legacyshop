import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CartItem, useCart } from '@/contexts/CartContext';
import FrontLayout from '@/layouts/front/front-layout';
import { ICart, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Heart, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface PageProps extends SharedData {
    carts: ICart[];
}

interface DetailedCartItem {
    id: string;
    vendorId: string;
    vendorName: string;
    productName: string;
    attributes: string[];
    quantity: number;
    finalPrice: number;
    originalPrice: number;
    discountPercent: number;
    imageUrl: string;
    cart?: ICart;
    source: 'server' | 'local';
}

const FALLBACK_IMAGE = '/banner-example.jpg';
const CHECKOUT_ITEMS_STORAGE_KEY = 'checkout:selectedItems';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(value)));

const buildCompositeId = (cart: ICart) =>
    [
        cart.product_id ?? '',
        cart.category_id ?? '-',
        cart.sub_category_id ?? '-',
        cart.division_id ?? '-',
        cart.variant_id ?? '-',
    ].join('|');

const firstEntity = <T,>(value: T | T[] | null | undefined): T | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value ?? undefined;
};

const computeOriginalPrice = (cart: ICart) => {
    const productBase = Number(cart.product?.product_price ?? 0);
    const subBase = Number(firstEntity(cart.sub_category)?.price ?? 0);
    const divisionBase = Number(firstEntity(cart.division)?.price ?? 0);
    const variantBase = Number(firstEntity(cart.variant)?.price ?? 0);
    return Math.max(productBase + subBase + divisionBase + variantBase, 0);
};

const computeFinalPrice = (cart: ICart, contextItem?: CartItem) => {
    const serverPrice = Number(cart.price_per_product ?? 0);
    if (serverPrice > 0) {
        return serverPrice;
    }
    if (contextItem?.price) {
        return contextItem.price;
    }
    return computeOriginalPrice(cart);
};

const extractAttributes = (cart: ICart) => {
    const list: string[] = [];
    const category = firstEntity(cart.category);
    const subCategory = firstEntity(cart.sub_category);
    const division = firstEntity(cart.division);
    const variant = firstEntity(cart.variant);

    if (variant?.name) {
        list.push(variant.name);
    }

    if (variant?.color) {
        const colorLabel = variant.type === 'color' ? variant.color : variant.color;
        if (colorLabel) {
            list.push(colorLabel);
        }
    }

    if (division?.name) {
        list.push(division.name);
    }

    if (subCategory?.name) {
        list.push(subCategory.name);
    }

    if (category?.name) {
        list.push(category.name);
    }

    return Array.from(new Set(list));
};

export default function Carts() {
    const { auth, translations, locale, carts, filters } = usePage<PageProps>().props;
    const [search, setSearch] = useState(String((filters as any)?.q || ''));

    return (
        <>
            <Head title="Cart" />
            <FrontLayout auth={auth} translations={translations} locale={locale} searchValue={search} onSearchChange={setSearch}>
                <CartContent carts={carts} />
            </FrontLayout>
        </>
    );
}

function CartContent({ carts }: { carts: ICart[] | null }) {
    const { items: contextItems, updateQuantity, removeItem } = useCart();

    const contextMap = useMemo(() => {
        const map = new Map<string, CartItem>();
        contextItems.forEach((item) => {
            map.set(item.id, item);
        });
        return map;
    }, [contextItems]);

    const detailedItems = useMemo(() => {
        const serverItems = Array.isArray(carts) ? carts : [];
        const mappedServer = serverItems.map((cart) => {
            const compositeId = buildCompositeId(cart);
            const contextItem = contextMap.get(compositeId);
            const quantity = contextItem?.quantity ?? Number(cart.quantity ?? 0) ?? 0;
            const finalPrice = computeFinalPrice(cart, contextItem);
            const originalPrice = computeOriginalPrice(cart) || finalPrice;
            const discountPercent = originalPrice > 0 ? Math.max(0, Math.round(((originalPrice - finalPrice) / originalPrice) * 100)) : 0;
            const imageUrl = cart.product?.pictures?.[0]?.url ?? FALLBACK_IMAGE;
            const vendorName = cart.product?.unit?.name ?? 'Legacy Vault';
            const vendorId = cart.product?.unit?.id ?? cart.product_id;

            return {
                id: compositeId,
                vendorId: vendorId ?? compositeId,
                vendorName,
                productName: cart.product?.product_name ?? 'Product',
                attributes: extractAttributes(cart),
                quantity: Math.max(quantity, 1),
                finalPrice,
                originalPrice: Math.max(originalPrice, finalPrice),
                discountPercent,
                imageUrl,
                cart,
                source: 'server',
            } as DetailedCartItem;
        });

        if (mappedServer.length > 0) {
            return mappedServer;
        }

        return contextItems.map((item) => ({
            id: item.id,
            vendorId: 'guest-cart',
            vendorName: 'Legacy Vault',
            productName: item.name,
            attributes: [],
            quantity: Math.max(item.quantity, 1),
            finalPrice: item.price,
            originalPrice: item.price,
            discountPercent: 0,
            imageUrl: item.image ?? FALLBACK_IMAGE,
            cart: undefined,
            source: 'local',
        }));
    }, [carts, contextMap, contextItems]);

    const hasInitializedSelectionRef = useRef(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const ids = detailedItems.map((item) => item.id);
        setSelectedIds((prev) => {
            const filteredPrev = prev.filter((id) => ids.includes(id));

            if (!hasInitializedSelectionRef.current) {
                hasInitializedSelectionRef.current = true;
                return ids;
            }

            const addedIds = ids.filter((id) => !filteredPrev.includes(id));
            if (addedIds.length === 0 && filteredPrev.length === prev.length) {
                return prev;
            }

            return [...filteredPrev, ...addedIds];
        });
    }, [detailedItems]);

    const groupedItems = useMemo(() => {
        const groups: { key: string; vendorName: string; items: DetailedCartItem[] }[] = [];
        const indexMap = new Map<string, number>();

        detailedItems.forEach((item: any) => {
            if (!indexMap.has(item.vendorId)) {
                indexMap.set(item.vendorId, groups.length);
                groups.push({ key: item.vendorId, vendorName: item.vendorName, items: [item] });
            } else {
                const idx = indexMap.get(item.vendorId);
                if (typeof idx === 'number') {
                    groups[idx].items.push(item);
                }
            }
        });

        return groups;
    }, [detailedItems]);

    const selectedItems = useMemo(() => detailedItems.filter((item) => selectedIds.includes(item.id)), [detailedItems, selectedIds]);

    useEffect(() => {
        const payload = selectedItems.map((item) => {
            const weightSource = item.cart?.product?.product_weight;
            const parsedWeight = typeof weightSource === 'string' ? Number(weightSource) : Number(weightSource ?? 0);
            return {
                id: item.id,
                store: item.vendorName,
                name: item.productName,
                variant: item.attributes.join(', '),
                attributes: item.attributes,
                quantity: item.quantity,
                price: item.finalPrice,
                image: item.imageUrl,
                weight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0,
                source: item.source,
                cartId: item.cart?.id ?? null,
                productId: item.cart?.product_id ?? item.cart?.product?.id ?? null,
                protectionPrice: 0,
                protectionLabel: null,
            };
        });

        try {
            sessionStorage.setItem(CHECKOUT_ITEMS_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore write errors (e.g. private mode)
        }
    }, [selectedItems]);

    const totals = useMemo(() => {
        return selectedItems.reduce(
            (acc, item) => {
                acc.subtotal += item.finalPrice * item.quantity;
                acc.original += item.originalPrice * item.quantity;
                acc.count += item.quantity;
                return acc;
            },
            { subtotal: 0, original: 0, count: 0 },
        );
    }, [selectedItems]);

    const savings = Math.max(0, totals.original - totals.subtotal);
    const isAllSelected = detailedItems.length > 0 && selectedIds.length === detailedItems.length;

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? detailedItems.map((item) => item.id) : []);
    };

    const handleRemoveSelected = () => {
        selectedIds.forEach((id) => removeItem(id));
        setSelectedIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    };

    const handleQuantityChange = (item: DetailedCartItem, delta: number) => {
        const nextQty = Math.max(0, item.quantity + delta);
        updateQuantity(item.id, nextQty);
    };

    return (
        <section className="bg-muted/30 py-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 lg:flex-row">
                <div className="flex-1 space-y-4">
                    <div className='mb-0 flex justify-end'>
                        <Button
                            onClick={handleRemoveSelected}
                            disabled={!selectedIds.length}
                            variant={'link'}
                            className='text-destructive'
                        >
                            <Trash2/>Clear All
                        </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                aria-label="Select all items"
                            />
                            <div>
                                <p className="text-base font-semibold text-foreground">Check All ({detailedItems.length})</p>
                            </div>
                        </div>
                    </div>

                    {groupedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background p-12 text-center text-muted-foreground">
                            <p className="text-lg font-semibold text-foreground">Your cart still empty</p>
                            <p className="mt-2 max-w-sm text-sm">
                                Come discover our latest collection and add your favorite products to your cart.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href={route('products')}>Start Explore</Link>
                            </Button>
                        </div>
                    ) : (
                        groupedItems.map((group) => (
                            <div key={group.key} className="rounded-2xl border bg-background shadow-sm">
                                <div className="flex items-center gap-3 border-b px-6 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        {group.vendorName.slice(0, 1)}
                                    </span>
                                    <span className="text-base font-semibold normal-case text-foreground">{group.vendorName}</span>
                                </div>

                                <div className="divide-y">
                                    {group.items.map((item) => {
                                        const isChecked = selectedIds.includes(item.id);
                                        const attributesLabel = item.attributes.join(', ');

                                        return (
                                            <div key={item.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
                                                <div className="flex items-start gap-4">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) =>
                                                            setSelectedIds((prev) => {
                                                                if (checked === true) {
                                                                    if (prev.includes(item.id)) return prev;
                                                                    return [...prev, item.id];
                                                                }
                                                                return prev.filter((id) => id !== item.id);
                                                            })
                                                        }
                                                        aria-label={`Pilih ${item.productName}`}
                                                    />
                                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border">
                                                        <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                                                        {item.discountPercent > 0 && (
                                                            <Badge variant="destructive" className="absolute left-1 top-1">
                                                                -{item.discountPercent}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="space-y-2">
                                                        <h3 className="text-base font-semibold text-foreground">{item.productName}</h3>
                                                        {attributesLabel ? (
                                                            <p className="text-sm text-muted-foreground">{attributesLabel}</p>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex flex-col items-stretch gap-4 text-right sm:flex-row sm:items-center sm:gap-6">
                                                        <div className="min-w-[120px]">
                                                            <div className="text-lg font-semibold text-foreground">
                                                                {formatCurrency(item.finalPrice)}
                                                            </div>
                                                            {item.discountPercent > 0 && (
                                                                <div className="text-sm text-muted-foreground line-through">
                                                                    {formatCurrency(item.originalPrice)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between gap-3 sm:justify-center">
                                                            <div className="flex items-center rounded-full border bg-muted/40">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(item, -1)}
                                                                    className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:text-foreground"
                                                                    aria-label={`Kurangi jumlah ${item.productName}`}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <span className="min-w-[2ch] text-center text-sm font-semibold">{item.quantity}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(item, 1)}
                                                                    className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:text-foreground"
                                                                    aria-label={`Tambah jumlah ${item.productName}`}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        removeItem(item.id);
                                                                        setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                                                                    }}
                                                                    className="transition hover:text-destructive"
                                                                    aria-label={`Hapus ${item.productName}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* SUMMARY SECTION */}
                <aside className="w-full max-w-sm space-y-4">
                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                        <Separator className="my-4" />

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatCurrency(totals.original)}</span>
                        </div>
                        {savings > 0 && (
                            <div className="mt-2 flex items-center justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(savings)}</span>
                            </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <Link href={'/checkout'}>
                            <Button className="mt-6 w-full" size="lg" disabled={!selectedItems.length}>
                                Checkout{totals.count ? ` (${totals.count})` : ''}
                            </Button>             
                        </Link>

                    </div>

                </aside>
            </div>
        </section>
    );
}
