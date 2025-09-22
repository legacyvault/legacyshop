import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import FrontLayout from '@/layouts/front/front-layout';
import {
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
        const basePrice = selectedSubcat?.price ?? 0;
        const discountPct = selectedVar?.pivot.use_variant_discount === 1 ? (selectedVar.discount ?? 0) : (selectedVar?.pivot.manual_discount ?? 0);
        return Math.round(basePrice - (basePrice * discountPct) / 100);
    }, [selectedVar]);

    const basePrice = product.product_price;
    const discountPct = Number(product.product_discount);
    const finalPrice = useMemo(() => {
        if (!discountPct) return Math.round(basePrice);
        const afterDiscount = Math.round(basePrice - (basePrice * discountPct) / 100);
        return afterDiscount + extraPriceSubcat + extraPriceDivision + extraPriceVariant;
    }, [extraPriceSubcat, extraPriceDivision, extraPriceVariant]);

    const totalStock = Number(product.total_stock);

    const mainImage = pictures?.[activeIndex]?.url || 'https://via.placeholder.com/600x800?text=No+Image';

    const disableButtonCart = useMemo(() => !selectedCat, [selectedCat]);

    const handleAddToCart = () => {
        const meta = {
            product_id: String(product.id),
            category_id: selectedCat?.id ? String(selectedCat.id) : undefined,
            sub_category_id: selectedSubcat?.id ? String(selectedSubcat.id) : undefined,
            division_id: selectedDiv?.id ? String(selectedDiv.id) : undefined,
            variant_id: selectedVar?.id ? String(selectedVar.id) : undefined,
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
                {product?.categories?.[0]?.name ? (
                    <>
                        <span>/</span>
                        <span>{product.categories[0].name}</span>
                    </>
                ) : null}
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
                        Unit: <span className="font-medium text-foreground">{product.unit?.name}</span>
                    </div>

                    {/* Price */}
                    <div className="my-4 flex items-end gap-3">
                        <div className="text-2xl font-extrabold md:text-3xl">{formatPrice(finalPrice)}</div>
                        {discountPct > 0 && (
                            <>
                                <span className="text-sm text-destructive line-through">{formatPrice(basePrice)}</span>
                                <Badge variant="destructive">{discountPct}%</Badge>
                            </>
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
                                    // LAST IMPLEMENTATION
                                    // const disabled = (selectedSubcat?.total_stock ?? 0) < 1;
                                    const disabled = false;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedSubcat((prev) => (prev?.id === v.id ? undefined : v))}
                                            className={`rounded-md border border-primary px-3 py-1.5 text-sm transition ${
                                                active ? 'bg-foreground text-background' : 'hover:border-foreground/60'
                                            } ${disabled ? 'border-secondary text-secondary hover:border-secondary/60' : ''}`}
                                            disabled={disabled}
                                        >
                                            {v.name}
                                        </button>
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
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedDiv((prev) => (prev?.id === v.id ? undefined : v))}
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

                    {/* Variant: text */}
                    {textVariants.length > 0 && selectedDiv && selectedSubcat && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose variant: {selectedVar?.name ?? '-'}</div>
                            <div className="flex flex-wrap gap-2">
                                {textVariants.map((v) => {
                                    const active = selectedVar?.id === v.id;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVar((prev) => (prev?.id === v.id ? undefined : v))}
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

                    {/* Variant: color */}
                    {colorVariants.length > 0 && selectedDiv && selectedSubcat && selectedCat && (
                        <div className="mb-4">
                            <div className="mb-2 text-sm font-semibold">Choose warna: {selectedVar?.name ?? '-'}</div>
                            <div className="flex flex-wrap items-center gap-3">
                                {colorVariants.map((v) => {
                                    const active = selectedVar?.id === v.id;
                                    const color = v.color || '#cccccc';
                                    return (
                                        <button
                                            aria-label={v.name}
                                            key={v.id}
                                            onClick={() => setSelectedVar((prev) => (prev?.id === v.id ? undefined : v))}
                                            className={`relative size-8 rounded-full border transition ${
                                                active ? 'ring-2 ring-primary' : 'hover:border-foreground/60'
                                            }`}
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
                                <TabsTrigger value="detail">Detail</TabsTrigger>
                                <TabsTrigger value="tnc">Terms & Condition</TabsTrigger>
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
                            <TabsContent value="tnc" className="prose mt-4 max-w-none text-sm leading-relaxed">
                                <span>Terms & Condition here</span>
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
                            <Button variant="outline" className="w-full">
                                Buy Now
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
