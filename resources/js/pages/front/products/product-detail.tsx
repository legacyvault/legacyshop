import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import FrontLayout from '@/layouts/front/front-layout';
import {
    ICart,
    ICategories,
    IDivisions,
    IPivotDivisionProd,
    IPivotSubcatProd,
    IPivotVariantProd,
    IProducts,
    ISubcats,
    IVariants,
    SharedData,
} from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type PageProps = SharedData & {
    product: IProducts;
};

export default function ProductDetail() {
    const { auth, translations, locale, product } = usePage<PageProps>().props;

    return (
        <FrontLayout auth={auth} translations={translations} locale={locale}>
            <DetailContent product={product} translations={translations} />
        </FrontLayout>
    );
}

function DetailContent({ product }: { product: IProducts; translations: any }) {
    const { addItem, items, updateQuantity, openCart } = useCart();

    const pictures = product?.pictures ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedQty, setSelectedQty] = useState(1);

    const [selectedCat, setSelectedCat] = useState<ICategories | undefined>();
    const [selectedSubcat, setSelectedSubcat] = useState<(ISubcats & { pivot: IPivotSubcatProd }) | undefined>();
    const [selectedDiv, setSelectedDiv] = useState<(IDivisions & { pivot: IPivotDivisionProd }) | undefined>();
    const [selectedVar, setSelectedVar] = useState<(IVariants & { pivot: IPivotVariantProd }) | undefined>();

    // Reset lower levels whenever a parent level changes (or is unselected)
    useEffect(() => {
        // When category changes, clear subcat/div/variant
        setSelectedSubcat(undefined);
        setSelectedDiv(undefined);
        setSelectedVar(undefined);
    }, [selectedCat?.id]);

    useEffect(() => {
        // When subcategory changes, clear division/variant
        setSelectedDiv(undefined);
        setSelectedVar(undefined);
    }, [selectedSubcat?.id]);

    useEffect(() => {
        // When division changes, clear variant
        setSelectedVar(undefined);
    }, [selectedDiv?.id]);

    const categories = useMemo(() => product?.categories ?? [], [product]);
    const subcategories = useMemo(() => (product?.subcategories ?? []).filter((v) => v.category_id === selectedCat?.id), [product, selectedCat?.id]);
    const divisions = useMemo(
        () => (product?.divisions ?? []).filter((v) => v.sub_category_id === selectedSubcat?.id),
        [product, selectedSubcat?.id],
    );
    const textVariants = useMemo(
        () => (product?.variants ?? []).filter((v) => v.type === 'text' && v.division_id === selectedDiv?.id),
        [product, selectedDiv?.id],
    );
    const colorVariants = useMemo(
        () => (product?.variants ?? []).filter((v) => v.type === 'color' && v.division_id === selectedDiv?.id),
        [product, selectedDiv?.id],
    );

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);

    // Price sources and optional category extra

    const extraPriceSubcat = useMemo(() => {
        const basePrice = selectedSubcat?.price ?? 0;
        const discountPct =
            selectedSubcat?.pivot.use_subcategory_discount === 1 ? (selectedSubcat.discount ?? 0) : (selectedSubcat?.pivot.manual_discount ?? 0);
        return Math.round(basePrice - (basePrice * discountPct) / 100);
    }, [selectedSubcat]);

    const extraPriceDivision = useMemo(() => {
        const basePrice = selectedDiv?.price ?? 0;
        const discountPct = selectedDiv?.pivot.use_division_discount === 1 ? (selectedDiv.discount ?? 0) : (selectedDiv?.pivot.manual_discount ?? 0);
        return Math.round(basePrice - (basePrice * discountPct) / 100);
    }, [selectedDiv]);

    const extraPriceVariant = useMemo(() => {
        const basePrice = selectedVar?.price ?? 0;
        const discountPct = selectedVar?.pivot.use_variant_discount === 1 ? (selectedVar.discount ?? 0) : (selectedVar?.pivot.manual_discount ?? 0);
        return Math.round(basePrice - (basePrice * discountPct) / 100);
    }, [selectedVar]);

    const basePrice = product.product_price;
    const basePriceWithExtra = useMemo(() => {
        return basePrice + (selectedSubcat?.price ?? 0) + (selectedDiv?.price ?? 0) + (selectedVar?.price ?? 0);
    }, [selectedSubcat, selectedDiv, selectedVar]);
    const discountPct = Number(product.product_discount);
    const finalPrice = useMemo(() => {
        const discountedBase = discountPct ? Math.round(basePrice - (basePrice * discountPct) / 100) : Math.round(basePrice);
        const total = discountedBase + extraPriceSubcat + extraPriceDivision + extraPriceVariant;
        return Math.max(0, total);
    }, [basePrice, discountPct, extraPriceSubcat, extraPriceDivision, extraPriceVariant]);

    const totalStock = Number(product.total_stock);

    const mainImage = pictures?.[activeIndex]?.url || 'https://via.placeholder.com/600x800?text=No+Image';

    const productStockInsufficient = Number(totalStock ?? 0) < selectedQty;
    const subcatStockInsufficient = selectedSubcat ? Number(selectedSubcat.total_stock ?? 0) < selectedQty : false;
    const divisionStockInsufficient = selectedDiv ? Number(selectedDiv.total_stock ?? 0) < selectedQty : false;
    const variantStockInsufficient = selectedVar ? Number(selectedVar.total_stock ?? 0) < selectedQty : false;

    const insufficientStock = useMemo(() => {
        if (productStockInsufficient) {
            return true;
        }
        if (selectedSubcat && subcatStockInsufficient) {
            return true;
        }
        if (selectedDiv && divisionStockInsufficient) {
            return true;
        }
        if (selectedVar && variantStockInsufficient) {
            return true;
        }

        return false;
    }, [
        productStockInsufficient,
        selectedSubcat,
        subcatStockInsufficient,
        selectedDiv,
        divisionStockInsufficient,
        selectedVar,
        variantStockInsufficient,
    ]);

    const disableButtonCart = useMemo(() => {
        if (!selectedCat) {
            return true;
        }

        return insufficientStock;
    }, [selectedCat, insufficientStock]);

    const handleAddToCart = () => {
        const meta: ICart = {
            category: selectedCat ? [selectedCat] : [],
            category_id: selectedCat?.id ?? null,
            division: selectedDiv ? [selectedDiv] : [],
            division_id: selectedDiv?.id ?? null,
            id: '',
            price_per_product: finalPrice,
            product: product,
            product_id: product.id,
            quantity: selectedQty,
            sub_category: selectedSubcat ? [selectedSubcat] : [],
            sub_category_id: selectedSubcat?.id ?? null,
            variant: selectedVar ? [selectedVar] : [],
            variant_id: selectedVar?.id ?? null,
            updated_at: '',
            created_at: '',
            user_id: '',
        };
        const compositeId = [
            meta.product_id ?? '',
            meta.category_id ?? '-',
            meta.sub_category_id ?? '-',
            meta.division_id ?? '-',
            meta.variant_id ?? '-',
        ].join('|');
        const name = `${product.product_name}`;
        const existing = items.find((i) => i.id === compositeId)?.quantity ?? 0;
        const targetQty = Math.max(1, existing + selectedQty);

        void addItem({ id: compositeId, name, price: finalPrice, image: mainImage, meta }, { quantity: targetQty, meta });
        openCart(true);
    };

    const formatDescriptionPreview = (text: string): string => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
            {/* Breadcrumbs */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Link href={route('home')} className="hover:underline">
                    Home
                </Link>
                <span>/</span>
                <span>{product?.unit?.name}</span>
                <span>/</span>
                <span>{product?.sub_unit?.name}</span>
                <span>/</span>
                <span className="max-w-[60%] truncate md:max-w-none">{product.product_name}</span>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Gallery */}
                <section className="lg:col-span-7">
                    {/* Desktop: vertical thumbnails left, main image right */}
                    <div className="hidden md:grid md:grid-cols-[84px_1fr] md:gap-3">
                        {pictures.length > 0 && (
                            <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1">
                                {pictures.map((p, i) => (
                                    <button
                                        key={p.id}
                                        aria-label={`thumbnail ${i + 1}`}
                                        aria-current={i === activeIndex}
                                        className={`overflow-hidden rounded-lg border p-1 shadow-xs transition ${
                                            i === activeIndex ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-foreground/50'
                                        }`}
                                        onClick={() => setActiveIndex(i)}
                                    >
                                        <img src={p.url} alt={`thumb-${i}`} className="aspect-square w-20 object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="overflow-hidden rounded-lg border bg-background">
                            <div className="relative aspect-[3/4] w-full md:aspect-auto md:h-[560px]">
                                <img src={mainImage} alt={product.product_name} className="h-full w-full object-contain p-6" />
                            </div>
                        </div>
                    </div>

                    {/* Mobile: thumbnails below */}
                    <div className="md:hidden">
                        <div className="overflow-hidden rounded-lg border bg-background">
                            <div className="relative aspect-[3/4] w-full">
                                <img src={mainImage} alt={product.product_name} className="h-full w-full object-contain p-6" />
                            </div>
                        </div>
                        {pictures.length > 0 && (
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {pictures.map((p, i) => (
                                    <button
                                        key={p.id}
                                        className={`overflow-hidden rounded-lg border p-1 shadow-xs transition ${
                                            i === activeIndex ? 'border-primary' : 'border-border hover:border-foreground/50'
                                        }`}
                                        onClick={() => setActiveIndex(i)}
                                    >
                                        <img src={p.url} alt={`thumb-${i}`} className="aspect-square w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Info */}
                <section className="lg:col-span-5">
                    <h1 className="mb-2 text-xl leading-snug font-bold md:text-2xl">{product.product_name}</h1>
                    <div className="mb-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                            {product.unit?.name} | {product.product_sku}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="my-4 flex items-end gap-3">
                        {discountPct > 0 ? (
                            <>
                                <div className="text-2xl font-extrabold md:text-3xl">{formatPrice(finalPrice)}</div>
                                <span className="text-sm text-destructive line-through">{formatPrice(basePriceWithExtra)}</span>
                                <Badge variant="destructive">{discountPct}%</Badge>
                            </>
                        ) : (
                            <div className="text-2xl font-extrabold md:text-3xl">{formatPrice(basePriceWithExtra)}</div>
                        )}
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose Category: {selectedCat?.name ?? '-'}</div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((v) => {
                                    const active = selectedCat?.id === v.id;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedCat((prev) => (prev?.id === v.id ? undefined : v))}
                                            className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                            }`}
                                        >
                                            {v.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Sub Categories */}
                    {subcategories.length > 0 && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose Sub Category: {selectedSubcat?.name ?? '-'}</div>
                            <div className="flex flex-wrap gap-2">
                                {subcategories.map((v) => {
                                    const active = selectedSubcat?.id === v.id;
                                    const optionOutOfStock = Number(v.total_stock ?? 0) < 1;
                                    return (
                                        <div key={v.id} className="text-muted-foreground:20 flex flex-col text-xs">
                                            <button
                                                onClick={() => setSelectedSubcat((prev) => (prev?.id === v.id ? undefined : v))}
                                                className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                    active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                                } ${optionOutOfStock ? 'hidden border-secondary text-secondary hover:border-secondary/60' : ''}`}
                                                disabled={optionOutOfStock}
                                            >
                                                {v.name}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Division */}
                    {divisions.length > 0 && selectedSubcat && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose Division: {selectedDiv?.name ?? '-'}</div>
                            <div className="flex flex-wrap gap-2">
                                {divisions.map((v) => {
                                    const active = selectedDiv?.id === v.id;
                                    const optionOutOfStock = Number(v.total_stock ?? 0) < 1;
                                    return (
                                        <div key={v.id} className="text-muted-foreground:20 flex flex-col text-xs">
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedDiv((prev) => (prev?.id === v.id ? undefined : v))}
                                                className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                    active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                                } ${optionOutOfStock ? 'hidden border-secondary text-secondary hover:border-secondary/60' : ''}`}
                                                disabled={optionOutOfStock}
                                            >
                                                {v.name}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Variant: text */}
                    {textVariants.length > 0 && selectedDiv && selectedSubcat && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose variant: {selectedVar?.name ?? '-'}</div>
                            <div className="flex flex-wrap gap-2">
                                {textVariants.map((v) => {
                                    const active = selectedVar?.id === v.id;
                                    const optionOutOfStock = Number(v.total_stock ?? 0) < 1;
                                    return (
                                        <div key={v.id} className="text-muted-foreground:20 flex flex-col text-xs">
                                            <button
                                                onClick={() => setSelectedVar((prev) => (prev?.id === v.id ? undefined : v))}
                                                className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                    active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                                } ${optionOutOfStock ? 'hidden border-secondary text-secondary hover:border-secondary/60' : ''}`}
                                                disabled={optionOutOfStock}
                                            >
                                                {v.name}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Variant: color */}
                    {colorVariants.length > 0 && selectedDiv && selectedSubcat && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose warna: {selectedVar?.name ?? '-'}</div>
                            <div className="flex flex-wrap items-center gap-3">
                                {colorVariants.map((v) => {
                                    const active = selectedVar?.id === v.id;
                                    const color = v.color || '#cccccc';
                                    const disabled = Number(v.total_stock ?? 0) < 1;
                                    return (
                                        <button
                                            aria-label={v.name}
                                            key={v.id}
                                            onClick={() => setSelectedVar((prev) => (prev?.id === v.id ? undefined : v))}
                                            className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                            } ${disabled ? 'hidden border-secondary text-secondary hover:border-secondary/60' : ''}`}
                                            disabled={disabled}
                                            style={{ backgroundColor: color ?? '#e5e7eb' }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tabs for details */}
                    <div className="mt-6">
                        <Tabs defaultValue="detail">
                            <TabsList className="bg-transparent p-0">
                                <TabsTrigger value="detail">Description</TabsTrigger>
                            </TabsList>
                            <TabsContent value="detail" className="prose mt-4 max-w-none text-sm leading-relaxed">
                                <div
                                    className="prose prose-sm whitespace-pre-line text-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: formatDescriptionPreview(product.description),
                                    }}
                                />
                                <div className="my-12">
                                    {product.tags.map((tag, i) => (
                                        <span className={`rounded-full bg-secondary p-2 text-xs ${i === 0 ? 'ml-0' : 'ml-4'}`} key={tag.id}>
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Quantity */}
                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="minus"
                                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                                    className="rounded border p-2 hover:bg-muted"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="min-w-10 text-center text-sm font-semibold">{selectedQty}</div>
                                <button
                                    aria-label="plus"
                                    onClick={() => setSelectedQty((q) => Math.min(totalStock || q + 1, q + 1))}
                                    className="rounded border p-2 hover:bg-muted"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground">Stock: {totalStock}</div>
                        </div>

                        {/* Subtotal */}
                        <div className="my-3 flex items-center justify-between border-t pt-3">
                            <div className="text-sm text-muted-foreground">Subtotal</div>
                            <div className="text-lg font-bold">{formatPrice(finalPrice * selectedQty)}</div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button className="w-full" onClick={handleAddToCart} disabled={disableButtonCart}>
                                + Add to Cart
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
