import Empty from '@/components/empty';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import FrontLayout from '@/layouts/front/front-layout';
import { IProducts, IRootProducts, IUnit, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Small helper to immutably toggle a Set item
function toggleSet(set: Set<string>, value: string, checked: boolean) {
    const next = new Set(set);
    if (checked) next.add(value);
    else next.delete(value);
    return next;
}

function hasFilterValue(value: unknown) {
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
}

export default function FrontProducts() {
    const {
        auth,
        translations,
        locale,
        products: productsPayload,
        subunits,
        tags,
        filters,
        unit,
    } = usePage<
        SharedData & {
            products?: IRootProducts;
            unit?: IUnit | null;
        }
    >().props;

    // Use backend payload as-is
    const products = useMemo<IProducts[]>(() => (productsPayload?.data ?? []) as IProducts[], [productsPayload]);

    // COMPARE FEATURE: ENABLE WHEN NEEDED
    // const [compareOpen, setCompareOpen] = useState(false);
    // const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
    const [search, setSearch] = useState(String((filters as any)?.q || ''));

    // Filter UI state, initialized from server query
    const [selectedSubUnits, setSelectedSubUnits] = useState<Set<string>>(() => {
        const subUnitFilter = (filters as any)?.sub_unit_ids;
        if (Array.isArray(subUnitFilter)) {
            return new Set(subUnitFilter.map(String));
        }
        if (subUnitFilter !== undefined && subUnitFilter !== null && subUnitFilter !== '') {
            return new Set([String(subUnitFilter)]);
        }
        return new Set();
    });
    const [selectedTags, setSelectedTags] = useState<Set<string>>(() => {
        const tagFilter = (filters as any)?.tag_ids;
        if (Array.isArray(tagFilter)) {
            return new Set(tagFilter.map(String));
        }
        if (tagFilter !== undefined && tagFilter !== null && tagFilter !== '') {
            return new Set([String(tagFilter)]);
        }
        return new Set();
    });

    const initialField = (
        (filters as any)?.sort_by === 'product_name'
            ? 'name'
            : (filters as any)?.sort_by === 'product_price'
              ? 'price'
              : (filters as any)?.sort_by === 'created_at'
                ? 'date'
                : 'date'
    ) as 'price' | 'name' | 'date';
    const initialOrder = ((filters as any)?.sort_dir ?? 'default') as 'default' | 'asc' | 'desc';
    const [sortField, setSortField] = useState<'price' | 'name' | 'date'>(initialField);
    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>(initialOrder);

    // Build query params for server requests
    const listPath = unit ? `/list-productt/${unit.id}` : '/list-products';
    const buildParams = (extra: Record<string, any> = {}) => ({
        q: search || undefined,
        unit_id: unit?.id,
        sub_unit_ids: selectedSubUnits.size > 0 ? Array.from(selectedSubUnits) : undefined,
        tag_ids: selectedTags.size > 0 ? Array.from(selectedTags) : undefined,
        sort_by: sortOrder === 'default' ? undefined : sortField === 'name' ? 'product_name' : sortField === 'price' ? 'product_price' : 'created_at',
        sort_dir: sortOrder === 'default' ? undefined : sortOrder,
        ...extra,
    });

    const currentPage = productsPayload?.current_page ?? 1;
    const lastPage = productsPayload?.last_page ?? 1;
    const goToPage = (page: number) => {
        router.get(listPath, buildParams({ page }), { preserveState: true, replace: true });
    };

    // Persist + restore via sessionStorage
    const STORAGE_KEY = unit ? `frontProductsQuery:${unit.id}` : 'frontProductsQuery:all';
    const restored = useRef(false);
    useEffect(() => {
        if (restored.current) return;
        const savedRaw = sessionStorage.getItem(STORAGE_KEY);
        const hasAnyUrl = Boolean(
            (filters as any)?.q ||
                (filters as any)?.sort_by ||
                (filters as any)?.sort_dir ||
                hasFilterValue((filters as any)?.sub_unit_ids) ||
                hasFilterValue((filters as any)?.category_ids) ||
                hasFilterValue((filters as any)?.subcat_ids) ||
                hasFilterValue((filters as any)?.division_ids) ||
                hasFilterValue((filters as any)?.variant_ids) ||
                hasFilterValue((filters as any)?.tag_ids),
        );
        if (!hasAnyUrl && savedRaw) {
            try {
                const saved = JSON.parse(savedRaw);
                restored.current = true;
                router.get(listPath, saved, { preserveState: true, replace: true });
            } catch {}
        }
    }, [filters, STORAGE_KEY, listPath]);

    useEffect(() => {
        const params = buildParams({ page: currentPage });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    }, [search, selectedSubUnits, selectedTags, sortField, sortOrder, currentPage, STORAGE_KEY]);

    // ENABLE WHEN NEEDED
    // COMPARE FEATURES
    // const formatPrice = (price: number) =>
    //     new Intl.NumberFormat('id-ID', {
    //         style: 'currency',
    //         currency: 'IDR',
    //         minimumFractionDigits: 0,
    //         maximumFractionDigits: 0,
    //     }).format(price);
    // const productImage = (p: IProducts) => p.pictures?.[0]?.url || 'https://via.placeholder.com/600x800?text=No+Image';
    // const productSalePrice = (p: IProducts) => {
    //     const price = Number(p.product_price ?? 0);
    //     const d = Number(p.product_discount ?? 0);
    //     return d > 0 ? Math.round(price - (price * d) / 100) : price;
    // };

    return (
        <FrontLayout
            auth={auth}
            translations={translations}
            locale={locale}
            searchValue={search}
            onSearchChange={setSearch}
            searchRoute={listPath}
            searchScopeLabel={unit?.name}
            searchUnitId={unit?.id}
        >
            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 space-y-2">
                    {unit ? (
                        <>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Collection</p>
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{unit.name}</h1>
                            {unit.description && <p className="max-w-3xl text-sm text-muted-foreground">{unit.description}</p>}
                        </>
                    ) : (
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">View All Cases - Legacy Vault</h1>
                    )}
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
                                        setSelectedSubUnits(new Set());
                                        setSelectedTags(new Set());
                                        setSearch('');
                                        setSortField('date');
                                        setSortOrder('default');
                                        router.get(
                                            listPath,
                                            buildParams({
                                                q: undefined,
                                                sub_unit_ids: undefined,
                                                tag_ids: undefined,
                                                sort_by: undefined,
                                                sort_dir: undefined,
                                                page: 1,
                                            }),
                                            { preserveState: true, replace: true },
                                        );
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
                                            const sort_by = f.key === 'name' ? 'product_name' : f.key === 'price' ? 'product_price' : 'created_at';
                                            if (sortField === (f.key as any)) {
                                                const next = sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? 'default' : 'asc';
                                                setSortOrder(next);
                                                router.get(
                                                    listPath,
                                                    buildParams({
                                                        sort_by: next === 'default' ? undefined : sort_by,
                                                        sort_dir: next === 'default' ? undefined : next,
                                                        page: 1,
                                                    }),
                                                    { preserveState: true, replace: true },
                                                );
                                            } else {
                                                setSortField(f.key as any);
                                                setSortOrder('asc');
                                                router.get(listPath, buildParams({ sort_by, sort_dir: 'asc', page: 1 }), {
                                                    preserveState: true,
                                                    replace: true,
                                                });
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
                                title="Category"
                                options={subunits.map((subu) => ({ value: String(subu.id), label: subu.name }))}
                                selected={selectedSubUnits}
                                onToggle={(value, checked) => {
                                    setSelectedSubUnits((prev) => {
                                        const next = toggleSet(prev, value, checked);
                                        router.get(listPath, buildParams({ sub_unit_ids: next.size > 0 ? Array.from(next) : undefined, page: 1 }), {
                                            preserveState: true,
                                            replace: true,
                                        });
                                        return next;
                                    });
                                }}
                            />
                            <FilterSection
                                title="Tags"
                                options={(tags ?? []).map((tag) => ({ value: String(tag.id), label: tag.name }))}
                                selected={selectedTags}
                                onToggle={(value, checked) => {
                                    setSelectedTags((prev) => {
                                        const next = toggleSet(prev, value, checked);
                                        router.get(listPath, buildParams({ tag_ids: next.size > 0 ? Array.from(next) : undefined, page: 1 }), {
                                            preserveState: true,
                                            replace: true,
                                        });
                                        return next;
                                    });
                                }}
                            />
                        </div>
                    </aside>

                    {/* Content area */}
                    <section className="lg:col-span-3">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <span className="text-xs font-medium text-muted-foreground">
                                {productsPayload?.total
                                    ? `Showing ${productsPayload.from ?? 0}-${productsPayload.to ?? 0} of ${productsPayload.total}`
                                    : 'No results'}
                            </span>
                        </div>

                        {/* Products Grid */}
                        {productsPayload?.total ? (
                            <>
                                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                                    {products.map((p) => (
                                        <ProductCard key={p.id} product={p} onClick={() => router.get(`/view-product/${p.id}`)} />
                                    ))}
                                </div>
                                <div className="mt-8 flex items-center justify-end gap-2">
                                    <Button variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {lastPage}
                                    </span>
                                    <Button variant="outline" disabled={currentPage >= lastPage} onClick={() => goToPage(currentPage + 1)}>
                                        Next
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Empty title={`No results found`} description="Try searching for a similar product with a different name" />
                        )}
                    </section>
                </div>
            </div>

            {/* COMPARE FEATURE (IF NEEDED) */}
            {/* {selectedProducts.length > 1 && (
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
            </Dialog> */}
        </FrontLayout>
    );
}

type Option = { value: string; label: string };

function FilterSection({
    title,
    options,
    selected,
    onToggle,
    defaultOpen = true,
}: {
    title: string;
    options: Option[];
    selected: Set<string>;
    onToggle: (value: string, checked: boolean) => void;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [tagSearch, setTagSearch] = useState('');
    const normalizedTitle = title.toLowerCase().trim();
    const isTagSection = normalizedTitle === 'tags';
    const filteredOptions = useMemo(() => {
        if (!isTagSection) return options;
        const query = tagSearch.trim().toLowerCase();
        if (!query) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(query) || selected.has(opt.value));
    }, [isTagSection, options, selected, tagSearch]);
    return (
        <Collapsible open={open} onOpenChange={setOpen} className="border-0">
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
                    {isTagSection && (
                        <Input
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            placeholder="Search tags"
                            className="h-8 rounded-md text-sm"
                        />
                    )}
                    {(isTagSection ? filteredOptions : options).map((opt) => {
                        const id = `${title}-${opt.value}`.toLowerCase().replace(/\s+/g, '-');
                        const isChecked = selected.has(opt.value);
                        return (
                            <label key={opt.value} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                                <Checkbox id={id} checked={isChecked} onCheckedChange={(v) => onToggle(opt.value, !!v)} />
                                <span>{opt.label}</span>
                            </label>
                        );
                    })}
                </div>
            </CollapsibleContent>
            <div className={`my-3 h-px w-full bg-border ${isTagSection && 'hidden'}`} />
        </Collapsible>
    );
}
