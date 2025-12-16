import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CartItem, useCart } from '@/contexts/CartContext';
import FrontLayout from '@/layouts/front/front-layout';
import { ICart, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface PageProps extends SharedData {
    carts: ICart[];
}

interface SelectionSummary {
    unit?: string;
    category?: string;
    subCategory?: string;
    division?: string;
    variant?: string;
    variantColor?: string | null;
}

interface DetailedCartItem {
    id: string;
    vendorId: string | null;
    vendorName: string;
    productName: string;
    attributes: string[];
    quantity: number;
    finalPrice: number;
    originalPrice: number;
    discountPercent: number;
    imageUrl: string;
    sku: string;
    cart?: ICart;
    source: 'server' | 'local';
    summary: SelectionSummary;
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
    [cart.product_id ?? '', cart.category_id ?? '-', cart.sub_category_id ?? '-', cart.division_id ?? '-', cart.variant_id ?? '-'].join('|');

const firstEntity = <T,>(value: T | T[] | null | undefined): T | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value ?? undefined;
};

const normalizeId = (value: unknown) => {
    if (typeof value === 'string' && value.length) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return undefined;
};

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const computeDiscountedPrice = (price: number, discountPercent: number) => {
    if (price <= 0) return 0;
    const clampedDiscount = Math.max(0, Math.min(100, discountPercent));
    const discounted = price - (price * clampedDiscount) / 100;
    return Math.max(0, Math.round(discounted));
};

const resolveDiscountPercent = (
    entity: any,
    pivotFlagKey: 'use_subcategory_discount' | 'use_division_discount' | 'use_variant_discount',
    fallbackDiscountKey: 'discount',
) => {
    if (!entity) return 0;
    const pivot = entity?.pivot;
    const manualDiscount = toNumber(pivot?.manual_discount);
    const fallbackDiscount = toNumber(entity?.[fallbackDiscountKey]);
    if (typeof pivot?.[pivotFlagKey] !== 'undefined') {
        const shouldUseEntityDiscount = Number(pivot[pivotFlagKey]) === 1;
        return shouldUseEntityDiscount ? fallbackDiscount : manualDiscount;
    }
    return manualDiscount || fallbackDiscount;
};

const resolveCategory = (cart: ICart | CartItem['meta'] | undefined) => {
    if (!cart) return undefined;
    const direct = firstEntity(cart.category);
    if (direct) return direct;
    const targetId = normalizeId(cart.category_id);
    if (!targetId) return undefined;

    const productCategories = cart.product?.categories ?? [];
    const fromProduct = productCategories.find((item) => normalizeId(item.id) === targetId);
    if (fromProduct) return fromProduct;

    const unitCategories = cart.product?.unit?.categories ?? [];
    return unitCategories.find((item) => normalizeId(item.id) === targetId);
};

const resolveSubCategory = (cart: ICart | CartItem['meta'] | undefined) => {
    if (!cart) return undefined;
    const direct = firstEntity(cart.sub_category);
    if (direct) return direct;

    const targetId = normalizeId(cart.sub_category_id);
    if (!targetId) return undefined;

    const productSubcategories = cart.product?.subcategories ?? [];
    const fromProduct = productSubcategories.find((item) => normalizeId(item.id) === targetId);
    if (fromProduct) return fromProduct;

    const categories = cart.product?.categories ?? [];
    for (const category of categories) {
        const nested = category?.sub_categories ?? [];
        const found = nested.find((item: any) => normalizeId(item?.id) === targetId);
        if (found) return found;
    }

    return undefined;
};

const resolveDivision = (cart: ICart | CartItem['meta'] | undefined) => {
    if (!cart) return undefined;
    const direct = firstEntity(cart.division);
    if (direct) return direct;

    const targetId = normalizeId(cart.division_id);
    if (!targetId) return undefined;

    const productDivisions = cart.product?.divisions ?? [];
    const fromProduct = productDivisions.find((item) => normalizeId(item.id) === targetId);
    if (fromProduct) return fromProduct;

    const subcategory = resolveSubCategory(cart);
    const nested = subcategory?.divisions ?? [];
    return nested.find((item: any) => normalizeId(item?.id) === targetId);
};

const resolveVariant = (cart: ICart | CartItem['meta'] | undefined) => {
    if (!cart) return undefined;
    const direct = firstEntity(cart.variant);
    if (direct) return direct;

    const targetId = normalizeId(cart.variant_id);
    if (!targetId) return undefined;

    const productVariants = cart.product?.variants ?? [];
    const fromProduct = productVariants.find((item) => normalizeId(item.id) === targetId);
    if (fromProduct) return fromProduct;

    const division = resolveDivision(cart);
    const nested = division?.variants ?? [];
    return nested.find((item: any) => normalizeId(item?.id) === targetId);
};

const extractSelectionSummary = (cart: ICart | CartItem['meta'] | undefined): SelectionSummary => {
    if (!cart) {
        return {};
    }

    const category = resolveCategory(cart);
    const subCategory = resolveSubCategory(cart);
    const division = resolveDivision(cart);
    const variant = resolveVariant(cart);

    const unitName = cart.product?.unit?.name;
    const variantColor = typeof variant?.color === 'string' && variant.color.trim().length ? variant.color : null;

    return {
        unit: unitName ?? undefined,
        category: typeof category?.name === 'string' ? category.name : undefined,
        subCategory: typeof subCategory?.name === 'string' ? subCategory.name : undefined,
        division: typeof division?.name === 'string' ? division.name : undefined,
        variant: typeof variant?.name === 'string' ? variant.name : undefined,
        variantColor,
    };
};

const buildAttributeList = (summary: SelectionSummary) => {
    const attributes: string[] = [];

    if (summary.variant) {
        attributes.push(summary.variant);
    }

    if (summary.variantColor && summary.variantColor !== summary.variant) {
        attributes.push(summary.variantColor);
    }

    if (summary.division) {
        attributes.push(summary.division);
    }

    if (summary.subCategory) {
        attributes.push(summary.subCategory);
    }

    if (summary.category) {
        attributes.push(summary.category);
    }

    return Array.from(new Set(attributes));
};

const computePricingDetails = (cart: ICart | CartItem['meta'] | undefined, contextItem?: CartItem) => {
    const fallbackPrice = toNumber(contextItem?.price);
    if (!cart) {
        return {
            finalPrice: fallbackPrice,
            originalPrice: fallbackPrice,
            discountPercent: 0,
        };
    }

    const productBase = toNumber(cart.product?.product_price);
    const productDiscount = toNumber(cart.product?.product_discount);
    const eventDiscount = toNumber(cart.product?.event?.discount);
    const appliedProductDiscount = eventDiscount > 0 ? eventDiscount : productDiscount;

    const subCategory = resolveSubCategory(cart);
    const subBase = toNumber(subCategory?.price);
    const subDiscount = resolveDiscountPercent(subCategory, 'use_subcategory_discount', 'discount');

    const division = resolveDivision(cart);
    const divisionBase = toNumber(division?.price);
    const divisionDiscount = resolveDiscountPercent(division, 'use_division_discount', 'discount');

    const variant = resolveVariant(cart);
    const variantBase = toNumber(variant?.price);
    const variantDiscount = resolveDiscountPercent(variant, 'use_variant_discount', 'discount');

    const originalPrice = Math.max(0, Math.round(productBase + subBase + divisionBase + variantBase));

    const discountedBase = computeDiscountedPrice(productBase, appliedProductDiscount);
    const discountedSub = computeDiscountedPrice(subBase, subDiscount);
    const discountedDivision = computeDiscountedPrice(divisionBase, divisionDiscount);
    const discountedVariant = computeDiscountedPrice(variantBase, variantDiscount);

    const computedFinal = discountedBase + discountedSub + discountedDivision + discountedVariant;
    const serverPrice = toNumber((cart as ICart)?.price_per_product);

    const candidatePrices = [serverPrice, computedFinal, fallbackPrice].filter((price) => price > 0);
    const finalPrice = candidatePrices.length ? Math.min(...candidatePrices) : 0;

    const discountPercent = originalPrice > 0 && finalPrice > 0 ? Math.max(0, Math.round(((originalPrice - finalPrice) / originalPrice) * 100)) : 0;

    return {
        finalPrice,
        originalPrice: originalPrice || finalPrice,
        discountPercent,
    };
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
            const summary = extractSelectionSummary(cart);
            const pricing = computePricingDetails(cart, contextItem);
            const imageUrl = cart.product?.pictures?.[0]?.url ?? FALLBACK_IMAGE;
            const vendorName = summary.unit ?? cart.product?.unit?.name ?? 'Legacy Vault';
            const vendorId = cart.product?.unit?.id ?? cart.product_id ?? compositeId;
            const sku = cart.product?.product_sku;

            return {
                id: compositeId,
                vendorId: vendorId ?? compositeId,
                vendorName,
                productName: cart.product?.product_name ?? 'Product',
                attributes: buildAttributeList(summary),
                quantity: Math.max(quantity, 1),
                finalPrice: pricing.finalPrice,
                originalPrice: Math.max(pricing.originalPrice, pricing.finalPrice),
                discountPercent: pricing.discountPercent,
                imageUrl,
                sku,
                cart,
                source: 'server',
                summary,
            } as DetailedCartItem;
        });

        if (mappedServer.length > 0) {
            return mappedServer;
        }

        return contextItems.map((item) => {
            const meta = item.meta;
            const summary = extractSelectionSummary(meta);
            const pricing = computePricingDetails(meta, item);
            const vendorName = summary.unit ?? 'Legacy Vault';
            const primaryUnitId = meta?.product?.unit?.id ?? null;

            return {
                id: item.id,
                vendorId: primaryUnitId,
                vendorName,
                productName: item.name,
                attributes: buildAttributeList(summary),
                quantity: Math.max(item.quantity, 1),
                finalPrice: pricing.finalPrice || item.price,
                originalPrice: Math.max(pricing.originalPrice, pricing.finalPrice || item.price),
                discountPercent: pricing.discountPercent,
                imageUrl: item.image ?? FALLBACK_IMAGE,
                cart: meta as ICart | undefined,
                source: 'local',
                summary,
            } as DetailedCartItem;
        });
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

    const selectedItems = useMemo(() => detailedItems.filter((item) => selectedIds.includes(item.id)), [detailedItems, selectedIds]);
    useEffect(() => {
        const payload = selectedItems.map((item) => {
            const weightSource = item.cart?.product?.product_weight;
            const parsedWeight = typeof weightSource === 'string' ? Number(weightSource) : Number(weightSource ?? 0);
            const categoryEntity = resolveCategory(item.cart);
            const subCategoryEntity = resolveSubCategory(item.cart);
            const divisionEntity = resolveDivision(item.cart);
            const variantEntity = resolveVariant(item.cart);
            const unitId = normalizeId(item.cart?.product?.unit?.id);
            const categoryId = normalizeId(item.cart?.category_id ?? item.cart?.category?.[0]?.id);
            const subCategoryId = normalizeId(item.cart?.sub_category_id ?? item.cart?.sub_category?.[0]?.id);
            const divisionId = normalizeId(item.cart?.division_id ?? item.cart?.division?.[0]?.id);
            const variantId = normalizeId(item.cart?.variant_id ?? item.cart?.variant?.[0]?.id);
            return {
                id: item.id,
                store: item.vendorName,
                name: item.productName,
                sku: item.cart?.product.product_sku,
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
                unitId: unitId ?? null,
                categoryId: categoryId ?? null,
                categoryDescription: categoryEntity?.description ?? null,
                subCategoryId: subCategoryId ?? null,
                subCategoryDescription: subCategoryEntity?.description ?? null,
                divisionId: divisionId ?? null,
                divisionDescription: divisionEntity?.description ?? null,
                variantId: variantId ?? null,
                variantColor: item.summary.variantColor ?? null,
                variantDescription: variantEntity?.description ?? null,
                selectionSummary: {
                    unit: item.summary.unit ?? item.vendorName ?? null,
                    category: item.summary.category ?? null,
                    subCategory: item.summary.subCategory ?? null,
                    division: item.summary.division ?? null,
                    variant: item.summary.variant ?? null,
                    variantColor: item.summary.variantColor ?? null,
                },
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
                    <div className="mb-0 flex justify-end">
                        <Button onClick={handleRemoveSelected} disabled={!selectedIds.length} variant={'link'} className="text-destructive">
                            <Trash2 />
                            Clear All
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

                    {detailedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background p-12 text-center text-muted-foreground">
                            <p className="text-lg font-semibold text-foreground">Your cart still empty</p>
                            <p className="mt-2 max-w-sm text-sm">Come discover our latest collection and add your favorite products to your cart.</p>
                            <Button asChild className="mt-6">
                                <Link href={route('products')}>Start Explore</Link>
                            </Button>
                        </div>
                    ) : (
                        detailedItems.map((item) => {
                            const isChecked = selectedIds.includes(item.id);
                            return (
                                <div key={item.id} className="rounded-2xl border bg-background px-6 py-5 shadow-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
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
                                                    <Badge variant="destructive" className="absolute top-1 left-1">
                                                        -{item.discountPercent}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className="border-primary/40 text-primary">
                                                        {item.vendorName}
                                                    </Badge>
                                                    {item.attributes.length ? (
                                                        <span className="text-xs text-muted-foreground">{item.attributes.join(' • ')}</span>
                                                    ) : null}
                                                </div>
                                                <h3 className="text-base font-semibold text-foreground">{item.productName}</h3>
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    {item.summary.category ? <p>Category: {item.summary.category}</p> : null}
                                                    {item.summary.subCategory ? <p>Sub Category: {item.summary.subCategory}</p> : null}
                                                    {item.summary.division ? <p>Division: {item.summary.division}</p> : null}
                                                    {item.summary.variant ? <p>Variant: {item.summary.variant}</p> : null}
                                                    {item.summary.variantColor && item.summary.variantColor !== item.summary.variant ? (
                                                        <p>Variant Color: {item.summary.variantColor}</p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-stretch gap-4 text-right sm:flex-row sm:items-center sm:gap-6">
                                                <div className="min-w-[120px]">
                                                    <div className="text-lg font-semibold text-foreground">{formatCurrency(item.finalPrice)}</div>
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
                                </div>
                            );
                        })
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
