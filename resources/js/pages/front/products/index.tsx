import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FrontLayout from '@/layouts/front/front-layout';
import { IProducts, IRootProducts, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, Scale } from 'lucide-react';
import { useMemo, useState } from 'react';

// Small helper to immutably toggle a Set item
function toggleSet(set: Set<string>, value: string, checked: boolean) {
    const next = new Set(set);
    if (checked) next.add(value);
    else next.delete(value);
    return next;
}

export default function FrontProducts() {
    const {
        auth,
        translations,
        locale,
        products: productsPayload,
    } = usePage<SharedData>().props as SharedData & {
        products?: IRootProducts;
    };

    // Use backend payload as-is
    const products = useMemo<IProducts[]>(() => (productsPayload?.data ?? []) as IProducts[], [productsPayload]);

    console.log(products);

    const [compareOpen, setCompareOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

    // Filter UI state (does not affect results yet)
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [selectedSubcats, setSelectedSubcats] = useState<Set<string>>(new Set());
    const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set());
    const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<'price' | 'name' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

    const selectedProducts = useMemo(() => products.filter((p) => selectedIds.has(p.id)), [products, selectedIds]);

    const toggleCompare = (id: number | string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    const productImage = (p: IProducts) => p.pictures?.[0]?.url || 'https://via.placeholder.com/600x800?text=No+Image';
    const productSalePrice = (p: IProducts) => {
        const price = Number(p.product_price ?? 0);
        const d = Number(p.product_discount ?? 0);
        return d > 0 ? Math.round(price - (price * d) / 100) : price;
    };

    return (
        <FrontLayout auth={auth} translations={translations} locale={locale}>
            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">View All Cases - Legacy Vault</h1>
                </div>
                <div className="mb-8 h-px w-full bg-border" />

                {/* Filters + Content */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
                    {/* Sidebar filters */}
                    <aside className="lg:col-span-1">
                        <div className="rounded-lg border p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-base font-semibold">Filters</h3>
                                <button
                                    className="text-xs text-muted-foreground underline hover:text-foreground"
                                    onClick={() => {
                                        setSelectedUnits(new Set());
                                        setSelectedCategories(new Set());
                                        setSelectedSubcats(new Set());
                                        setSelectedDivisions(new Set());
                                        setSelectedVariants(new Set());
                                        setSortField('date');
                                        setSortOrder('default');
                                    }}
                                >
                                    Clear all
                                </button>
                            </div>
                            {/* Sort Section (field button cycles default → asc → desc) */}
                            <div className="mb-4 rounded-md border p-3">
                                <div className="mb-2 text-sm font-semibold">Sort</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            { key: 'date', label: 'Date' },
                                            { key: 'name', label: 'Name' },
                                            { key: 'price', label: 'Price' },
                                        ] as const
                                    ).map((f) => {
                                        const isActive = sortField === (f.key as any);
                                        const icon =
                                            !isActive || sortOrder === 'default' ? (
                                                <ChevronsUpDown className="h-4 w-4 opacity-60" />
                                            ) : sortOrder === 'asc' ? (
                                                <ArrowUp className="h-4 w-4" />
                                            ) : (
                                                <ArrowDown className="h-4 w-4" />
                                            );

                                        const handleClick = () => {
                                            if (sortField === (f.key as any)) {
                                                setSortOrder((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'default' : 'asc'));
                                            } else {
                                                setSortField(f.key as any);
                                                setSortOrder('asc');
                                            }
                                        };

                                        return (
                                            <button
                                                key={f.key}
                                                type="button"
                                                onClick={handleClick}
                                                className={`inline-flex w-full items-center justify-between rounded-md border px-2 py-2 text-sm transition hover:bg-accent ${
                                                    isActive && sortOrder !== 'default' ? 'bg-accent' : ''
                                                }`}
                                            >
                                                <span>{f.label}</span>
                                                {icon}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <FilterSection
                                title="Unit"
                                options={['Cases', 'Sleeves', 'Binders', 'Accessories']}
                                selected={selectedUnits}
                                onToggle={(v, c) => setSelectedUnits((s) => toggleSet(s, v, c))}
                            />

                            <FilterSection
                                title="Category"
                                options={['Premium', 'Standard', 'Display', 'Storage']}
                                selected={selectedCategories}
                                onToggle={(v, c) => setSelectedCategories((s) => toggleSet(s, v, c))}
                            />

                            <FilterSection
                                title="Sub Category"
                                options={['UV Protected', 'Tempered Glass', 'Magnetic', 'Top Loader']}
                                selected={selectedSubcats}
                                onToggle={(v, c) => setSelectedSubcats((s) => toggleSet(s, v, c))}
                            />

                            <FilterSection
                                title="Division"
                                options={['Pokemon', 'Sports', 'MTG', 'Yu-Gi-Oh!']}
                                selected={selectedDivisions}
                                onToggle={(v, c) => setSelectedDivisions((s) => toggleSet(s, v, c))}
                            />

                            <FilterSection
                                title="Variant"
                                options={['Gold', 'Silver', 'Rainbow', 'Black']}
                                selected={selectedVariants}
                                onToggle={(v, c) => setSelectedVariants((s) => toggleSet(s, v, c))}
                            />
                        </div>
                    </aside>

                    {/* Content area */}
                    <section className="lg:col-span-3">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <span className="text-xs font-medium text-muted-foreground">
                                Results {(productsPayload?.total ?? products.length) || products.length} items
                            </span>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} onClick={() => router.get(`/view-product/${p.id}`)} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {selectedProducts.length > 1 && (
                <Button className="fixed right-6 bottom-6 z-50 shadow-lg" onClick={() => setCompareOpen(true)}>
                    <Scale className="mr-2 h-4 w-4" /> Compare ({selectedProducts.length})
                </Button>
            )}

            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Product Comparison</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="border px-3 py-2 text-left">Feature</th>
                                    {selectedProducts.map((p) => (
                                        <th key={p.id} className="border px-3 py-2 text-left">
                                            <div className="flex items-center gap-3">
                                                <img src={productImage(p)} alt={p.product_name} className="h-12 w-12 rounded object-cover" />
                                                <div>
                                                    <div className="line-clamp-1 font-medium">{p.product_name}</div>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border px-3 py-2 font-medium">Price</td>
                                    {selectedProducts.map((p) => (
                                        <td key={p.id} className="border px-3 py-2">
                                            {formatPrice(productSalePrice(p))}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                        <Button onClick={() => setCompareOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FrontLayout>
    );
}

function FilterSection({
    title,
    options,
    selected,
    onToggle,
    defaultOpen = true,
}: {
    title: string;
    options: string[];
    selected: Set<string>;
    onToggle: (value: string, checked: boolean) => void;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                    {title}
                    {selected.size > 0 && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{selected.size}</span>}
                </h4>
                <CollapsibleTrigger className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{open ? 'Hide' : 'Show'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <div className="space-y-2 py-2">
                    {options.map((opt) => {
                        const id = `${title}-${opt}`.toLowerCase().replace(/\s+/g, '-');
                        const isChecked = selected.has(opt);
                        return (
                            <label key={opt} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                                <Checkbox id={id} checked={isChecked} onCheckedChange={(v) => onToggle(opt, !!v)} />
                                <span>{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </CollapsibleContent>
            <div className="my-3 h-px w-full bg-border" />
        </Collapsible>
    );
}
