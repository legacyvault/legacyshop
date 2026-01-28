import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    BreadcrumbItem,
    ICategories,
    IDivisions,
    IGroupStock,
    IProductGroup,
    ISubUnits,
    ISubcats,
    ITags,
    IUnit,
    IVariants,
    SharedData,
} from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { DialogPortal } from '@radix-ui/react-dialog';
import { Bold, ChevronDown, Italic, Layers, ListPlus, Plus, RefreshCw, Search, Trash2, Underline, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type HierarchySelection = {
    unitIds: string[];
    subunitIds: string[];
    categoryIds: string[];
    subcategoryIds: string[];
    divisionIds: string[];
    variantIds: string[];
};

type BulkProductRow = {
    id: string;
    productId?: string;
    name: string;
    images: File[];
    previews: string[];
    existingPictures?: { id: string; url: string }[];
    removePictureIds?: string[];
    description: string;
    weight: string;
    tags: string[];
};

type RowError = {
    name?: string;
    weight?: string;
    description?: string;
    images?: string;
    tags?: string;
};

type DiscountEntry = {
    source: string;
    value: string;
    base_price: number;
};

type GroupStockFormData = {
    group_id: string;
    quantity: string;
    remarks: string;
};

const randomId = () => Math.random().toString(36).slice(2, 10);

interface MultiSelectProps {
    options: { value: string; label: string }[];
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    disabled?: boolean;
    maxSelections?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, values, onChange, placeholder, disabled, maxSelections }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectionLimit = maxSelections ?? Infinity;
    const isSingleSelect = selectionLimit === 1;

    const filteredOptions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return options.filter((option) => option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term));
    }, [options, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleValue = (value: string) => {
        if (values.includes(value)) {
            onChange(values.filter((v) => v !== value));
            return;
        }
        const nextValues = isSingleSelect ? [value] : [...values, value];
        onChange(nextValues.slice(0, selectionLimit));
        if (isSingleSelect) {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const removeValue = (value: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        onChange(values.filter((v) => v !== value));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={`flex min-h-[42px] w-full items-center justify-between rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                    disabled ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'cursor-pointer'
                }`}
            >
                <div className="flex flex-wrap gap-1">
                    {values.length > 0 ? (
                        values.map((value) => (
                            <span key={value} className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-800">
                                {options.find((opt) => opt.value === value)?.label || value}
                                <button type="button" onClick={(e) => removeValue(value, e)} className="rounded-full p-0.5 hover:bg-blue-200">
                                    <X size={12} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                    <div className="border-b border-gray-200 p-2">
                        <div className="relative">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full rounded-md border border-gray-300 py-2 pr-8 pl-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => toggleValue(option.value)}
                                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 ${
                                        values.includes(option.value) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                >
                                    <input type={isSingleSelect ? 'radio' : 'checkbox'} checked={values.includes(option.value)} readOnly />
                                    <span className="flex-1">{option.label}</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">No options found for "{searchTerm}"</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const toOptions = (items: { id: string; name: string }[] | undefined) => (items || []).map((i) => ({ value: i.id, label: i.name }));

export default function GroupProductForm() {
    const shared = usePage<SharedData>().props as Partial<SharedData> & { productGroup?: IProductGroup; id?: string };
    const productGroup = shared.productGroup;
    const groupId = (shared.id as string | undefined) ?? productGroup?.id;
    const isEditMode = Boolean(productGroup);

    const units = (shared.units as IUnit[] | undefined) ?? [];
    const subunits = (shared.subunits as ISubUnits[] | undefined) ?? [];
    const categories = (shared.categories as ICategories[] | undefined) ?? [];
    const subcats = (shared.subcats as ISubcats[] | undefined) ?? [];
    const divisions = (shared.divisions as IDivisions[] | undefined) ?? [];
    const variants = (shared.variants as IVariants[] | undefined) ?? [];
    const tags = (shared.tags as ITags[] | undefined) ?? [];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Groups',
            href: '/products/product/group',
        },
        {
            title: isEditMode ? 'Edit group' : 'Create group',
            href: isEditMode && groupId ? `/products/product/group/edit/${groupId}` : '/products/product/group/create',
        },
    ];

    const [groupMeta, setGroupMeta] = useState({
        name: '',
        notes: '',
    });

    const [hierarchy, setHierarchy] = useState<HierarchySelection>({
        unitIds: [],
        subunitIds: [],
        categoryIds: [],
        subcategoryIds: [],
        divisionIds: [],
        variantIds: [],
    });

    const [bulkNames, setBulkNames] = useState('');
    const [bulkRows, setBulkRows] = useState<BulkProductRow[]>([
        { id: randomId(), name: '', images: [], previews: [], description: '', weight: '', existingPictures: [], removePictureIds: [], tags: [] },
    ]);
    const [bulkWeight, setBulkWeight] = useState('');
    const [bulkDescription, setBulkDescription] = useState('');
    const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
    const [formErrors, setFormErrors] = useState<{
        group_name?: string;
        unit_id?: string;
        sub_unit_id?: string;
        categories?: string;
        sub_categories?: string;
        // divisions?: string;
        // variants?: string;
        products?: string;
    }>({});
    const bulkDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const descriptionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const latestPreviewsRef = useRef<string[]>([]);
    const [defaultUnitId, setDefaultUnitId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pricing, setPricing] = useState({
        price: '',
        product_usd_price: '',
        product_discount: '',
        use_unit_price: true,
        use_unit_usd_price: true,
        use_unit_discount: true,
    });
    const [subcategoryDiscounts, setSubcategoryDiscounts] = useState<Record<string, DiscountEntry>>({});
    const [divisionDiscounts, setDivisionDiscounts] = useState<Record<string, DiscountEntry>>({});
    const [variantDiscounts, setVariantDiscounts] = useState<Record<string, DiscountEntry>>({});
    const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);
    const [openAddGroupStock, setOpenAddGroupStock] = useState(false);

    const {
        data: groupStockData,
        setData: setGroupStockData,
        post: postGroupStock,
        errors: groupStockErrors,
        processing: isGroupStockSubmitting,
    } = useForm<GroupStockFormData>({
        group_id: groupId ?? '',
        quantity: '',
        remarks: '',
    });

    const unitOptions = useMemo(() => toOptions(units), [units]);
    const subunitOptions = useMemo(
        () => toOptions(subunits.filter((item) => hierarchy.unitIds.includes(item.unit_id))),
        [hierarchy.unitIds, subunits],
    );
    const categoryOptions = useMemo(
        () => toOptions(categories.filter((item) => hierarchy.subunitIds.includes(item.sub_unit_id))),
        [categories, hierarchy.subunitIds],
    );
    const subcategoryOptions = useMemo(
        () => toOptions(subcats.filter((item) => hierarchy.categoryIds.includes(item.category_id))),
        [hierarchy.categoryIds, subcats],
    );
    const divisionOptions = useMemo(
        () => toOptions(divisions.filter((item) => hierarchy.subcategoryIds.includes(item.sub_category_id))),
        [divisions, hierarchy.subcategoryIds],
    );
    const variantOptions = useMemo(
        () => toOptions(variants.filter((item) => hierarchy.divisionIds.includes(item.division_id))),
        [hierarchy.divisionIds, variants],
    );

    const tagsOptions = useMemo(() => toOptions(tags), [tags]);

    const subcatNameById = useMemo(() => {
        const m: Record<string, string> = {};
        subcats.forEach((s) => (m[s.id] = s.name));
        return m;
    }, [subcats]);
    const divisionNameById = useMemo(() => {
        const m: Record<string, string> = {};
        divisions.forEach((d) => (m[d.id] = d.name));
        return m;
    }, [divisions]);
    const variantNameById = useMemo(() => {
        const m: Record<string, string> = {};
        variants.forEach((v) => (m[v.id] = v.name));
        return m;
    }, [variants]);

    const subcatDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        subcats.forEach((s) => (m[s.id] = Number(s.discount || 0)));
        return m;
    }, [subcats]);
    const divisionDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        divisions.forEach((d) => (m[d.id] = Number(d.discount || 0)));
        return m;
    }, [divisions]);
    const variantDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        variants.forEach((v) => (m[v.id] = Number(v.discount || 0)));
        return m;
    }, [variants]);

    const subcatPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        subcats.forEach((s) => (m[s.id] = Number(s.price || 0)));
        return m;
    }, [subcats]);
    const divisionPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        divisions.forEach((d) => (m[d.id] = Number(d.price || 0)));
        return m;
    }, [divisions]);
    const variantPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        variants.forEach((v) => (m[v.id] = Number(v.price || 0)));
        return m;
    }, [variants]);

    const groupStocks = useMemo<IGroupStock[]>(() => {
        const stocks = productGroup?.stocks ?? [];
        return [...stocks].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }, [productGroup?.stocks]);

    const hydrateDiscountsFromProducts = useCallback(
        (products: IProductGroup['products']) => {
            const nextSubcats: Record<string, DiscountEntry> = {};
            const nextDivisions: Record<string, DiscountEntry> = {};
            const nextVariants: Record<string, DiscountEntry> = {};

            products.forEach((product) => {
                product.subcategories?.forEach((subcat) => {
                    if (nextSubcats[subcat.id]) return;
                    const pivot: any = (subcat as any).pivot ?? {};
                    const useDefault = pivot?.use_subcategory_discount !== 0 && pivot?.use_subcategory_discount !== false;
                    nextSubcats[subcat.id] = {
                        source: useDefault ? subcat.id : 'manual',
                        value: useDefault ? '' : String(pivot?.manual_discount ?? ''),
                        base_price: subcatPriceById[subcat.id] ?? 0,
                    };
                });

                product.divisions?.forEach((division) => {
                    if (nextDivisions[division.id]) return;
                    const pivot: any = (division as any).pivot ?? {};
                    const useDefault = pivot?.use_division_discount !== 0 && pivot?.use_division_discount !== false;
                    nextDivisions[division.id] = {
                        source: useDefault ? division.id : 'manual',
                        value: useDefault ? '' : String(pivot?.manual_discount ?? ''),
                        base_price: divisionPriceById[division.id] ?? 0,
                    };
                });

                product.variants?.forEach((variant) => {
                    if (nextVariants[variant.id]) return;
                    const pivot: any = (variant as any).pivot ?? {};
                    const useDefault = pivot?.use_variant_discount !== 0 && pivot?.use_variant_discount !== false;
                    nextVariants[variant.id] = {
                        source: useDefault ? variant.id : 'manual',
                        value: useDefault ? '' : String(pivot?.manual_discount ?? ''),
                        base_price: variantPriceById[variant.id] ?? 0,
                    };
                });
            });

            setSubcategoryDiscounts(nextSubcats);
            setDivisionDiscounts(nextDivisions);
            setVariantDiscounts(nextVariants);
        },
        [divisionPriceById, subcatPriceById, variantPriceById],
    );

    const selectedUnits = useMemo(() => units.filter((u) => hierarchy.unitIds.includes(u.id)), [units, hierarchy.unitIds]);
    const selectedUnit = useMemo(() => {
        if (!selectedUnits.length) return null;
        const explicit = defaultUnitId && selectedUnits.find((u) => u.id === defaultUnitId);
        if (explicit) return explicit;
        return selectedUnits.reduce((max, u) => {
            const price = Number(u.price ?? 0);
            const maxPrice = Number(max.price ?? 0);
            return price > maxPrice ? u : max;
        }, selectedUnits[0]);
    }, [defaultUnitId, selectedUnits]);
    const selectedUnitPrice = useMemo(() => Number(selectedUnit?.price ?? 0), [selectedUnit]);
    const selectedUnitUsdPrice = useMemo(() => Number(selectedUnit?.usd_price ?? 0), [selectedUnit]);
    const selectedUnitDiscount = useMemo(() => Number(selectedUnit?.discount ?? 0), [selectedUnit]);

    useEffect(() => {
        if (groupId) {
            setGroupStockData('group_id', groupId);
        }
    }, [groupId, setGroupStockData]);

    useEffect(() => {
        latestPreviewsRef.current = bulkRows.flatMap((row) => row.previews);
    }, [bulkRows]);

    useEffect(() => {
        if (!selectedUnits.length) {
            setDefaultUnitId(null);
            return;
        }
        if (defaultUnitId && selectedUnits.some((u) => u.id === defaultUnitId)) return;
        const fallback = selectedUnits.reduce((max, u) => {
            const price = Number(u.price ?? 0);
            const maxPrice = Number(max.price ?? 0);
            return price > maxPrice ? u : max;
        }, selectedUnits[0]);
        setDefaultUnitId(fallback.id);
    }, [defaultUnitId, selectedUnits]);

    useEffect(() => {
        if (!productGroup) return;

        const products = productGroup.products ?? [];
        const unique = (values: (string | number | null | undefined)[]) =>
            Array.from(new Set(values.filter((v): v is string | number => v !== null && v !== undefined))).map((v) => String(v));

        setGroupMeta({ name: productGroup.name ?? '', notes: '' });

        const nextHierarchy: HierarchySelection = {
            unitIds: unique(products.map((p) => p.unit?.id)).slice(0, 1),
            subunitIds: unique(products.map((p) => p.sub_unit?.id)).slice(0, 1),
            categoryIds: unique(products.flatMap((p) => p.categories?.map((c) => c.id))),
            subcategoryIds: unique(products.flatMap((p) => p.subcategories?.map((s) => s.id))),
            divisionIds: unique(products.flatMap((p) => p.divisions?.map((d) => d.id))),
            variantIds: unique(products.flatMap((p) => p.variants?.map((v) => v.id))),
        };

        setHierarchy(nextHierarchy);
        if (nextHierarchy.unitIds.length) {
            setDefaultUnitId((prev) => prev ?? nextHierarchy.unitIds[0]);
        }

        const nextRows: BulkProductRow[] = products.map((p) => ({
            id: p.id || randomId(),
            productId: p.id,
            name: p.product_name || '',
            images: [],
            previews: [],
            existingPictures: (p.pictures || []).map((pic) => ({ id: pic.id, url: pic.url })),
            removePictureIds: [],
            description: p.description || '',
            weight: p.product_weight !== null && p.product_weight !== undefined ? String(p.product_weight) : '',
            tags: p.tags?.map((tag) => (tag.id)) || []
        }));

        setBulkRows(
            nextRows.length
                ? nextRows
                : [
                      {
                          id: randomId(),
                          name: '',
                          images: [],
                          previews: [],
                          existingPictures: [],
                          removePictureIds: [],
                          description: '',
                          weight: '',
                          tags: []
                      },
                  ],
        );

        hydrateDiscountsFromProducts(products);
        setRowErrors({});
        setRemovedProductIds([]);
    }, [productGroup, hydrateDiscountsFromProducts]);

    useEffect(
        () => () => {
            latestPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
        },
        [],
    );

    const resetHierarchyBelow = (base: HierarchySelection, level: keyof HierarchySelection): HierarchySelection => {
        const reset: HierarchySelection = { ...base };
        const order: (keyof HierarchySelection)[] = ['unitIds', 'subunitIds', 'categoryIds', 'subcategoryIds', 'divisionIds', 'variantIds'];
        const index = order.indexOf(level);
        for (let i = index + 1; i < order.length; i++) {
            reset[order[i]] = [];
        }
        return reset;
    };

    const handleUnitChange = (values: string[]) => {
        const nextValues = values.slice(0, 1);
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, unitIds: nextValues }, 'unitIds');
            const allowedSubunits = new Set(subunits.filter((s) => nextValues.includes(s.unit_id)).map((s) => s.id));
            next.subunitIds = next.subunitIds.filter((id) => allowedSubunits.has(id));
            return next;
        });
        setSubcategoryDiscounts({});
        setDivisionDiscounts({});
        setVariantDiscounts({});
    };

    const handleSubunitChange = (values: string[]) => {
        const nextValues = values.slice(0, 1);
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, subunitIds: nextValues }, 'subunitIds');
            const allowedCategories = new Set(categories.filter((c) => nextValues.includes(c.sub_unit_id)).map((c) => c.id));
            next.categoryIds = next.categoryIds.filter((id) => allowedCategories.has(id));
            return next;
        });
        setSubcategoryDiscounts({});
        setDivisionDiscounts({});
        setVariantDiscounts({});
    };

    const handleCategoryChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, categoryIds: values }, 'categoryIds');
            const allowedSubs = new Set(subcats.filter((s) => values.includes(s.category_id)).map((s) => s.id));
            next.subcategoryIds = next.subcategoryIds.filter((id) => allowedSubs.has(id));
            return next;
        });
        setSubcategoryDiscounts({});
        setDivisionDiscounts({});
        setVariantDiscounts({});
    };

    const initializeDiscounts = (type: 'subcategory' | 'division' | 'variant', values: string[]) => {
        const priceMap = type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;
        const setter = type === 'subcategory' ? setSubcategoryDiscounts : type === 'division' ? setDivisionDiscounts : setVariantDiscounts;
        setter((prev) => {
            const next: Record<string, DiscountEntry> = { ...prev };
            values.forEach((id) => {
                if (!next[id]) {
                    next[id] = { source: id, value: '', base_price: priceMap[id] ?? 0 };
                } else if (next[id].base_price !== (priceMap[id] ?? 0)) {
                    next[id] = { ...next[id], base_price: priceMap[id] ?? 0 };
                }
            });
            Object.keys(next).forEach((key) => {
                if (!values.includes(key)) delete next[key];
            });
            return next;
        });
    };

    const handleSubcategoryChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, subcategoryIds: values }, 'subcategoryIds');
            const allowedDivs = new Set(divisions.filter((d) => values.includes(d.sub_category_id)).map((d) => d.id));
            next.divisionIds = next.divisionIds.filter((id) => allowedDivs.has(id));
            return next;
        });
        initializeDiscounts('subcategory', values);
        setDivisionDiscounts({});
        setVariantDiscounts({});
    };

    const handleDivisionChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, divisionIds: values }, 'divisionIds');
            const allowedVars = new Set(variants.filter((v) => values.includes(v.division_id)).map((v) => v.id));
            next.variantIds = next.variantIds.filter((id) => allowedVars.has(id));
            return next;
        });
        initializeDiscounts('division', values);
        setVariantDiscounts({});
    };

    const handleVariantChange = (values: string[]) => {
        setHierarchy((prev) => ({ ...prev, variantIds: values }));
        initializeDiscounts('variant', values);
    };

    const handleTagChange = (id: string, tags: string[]) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, tags } : row)));
        setRowErrors((prev) => {
            if (!prev[id]?.tags) return prev;
            return { ...prev, [id]: { ...prev[id], tags: undefined } };
        });
    };

    const buildDiscountPayload = (type: 'subcategory' | 'division' | 'variant') => {
        const ids = type === 'subcategory' ? hierarchy.subcategoryIds : type === 'division' ? hierarchy.divisionIds : hierarchy.variantIds;
        const map = type === 'subcategory' ? subcategoryDiscounts : type === 'division' ? divisionDiscounts : variantDiscounts;
        const prefix = type === 'subcategory' ? 'sub_categories' : type === 'division' ? 'divisions' : 'variants';

        return ids.map((id, index) => {
            const entry = map[id];
            const useDefault = entry?.source !== 'manual';
            return {
                index,
                id,
                useDefault,
                value: entry?.value || '0',
                prefix,
                useKey: type === 'subcategory' ? 'use_subcategory_discount' : type === 'division' ? 'use_division_discount' : 'use_variant_discount',
                manualKey: type === 'subcategory' ? 'manual_discount' : type === 'division' ? 'manual_discount' : 'manual_discount',
            };
        });
    };

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatUsd = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('en-US').format(Number(number));
    };

    const toggleUnitPrice = (useUnit: boolean) => {
        setPricing((prev) => ({
            ...prev,
            use_unit_price: useUnit,
            price: useUnit ? String(selectedUnitPrice || '') : prev.price || String(selectedUnitPrice || ''),
        }));
    };

    const toggleUnitUsdPrice = (useUnit: boolean) => {
        setPricing((prev) => ({
            ...prev,
            use_unit_usd_price: useUnit,
            product_usd_price: useUnit ? String(selectedUnitUsdPrice || '') : prev.product_usd_price || String(selectedUnitUsdPrice || ''),
        }));
    };

    const toggleUnitDiscount = (useUnit: boolean) => {
        setPricing((prev) => ({
            ...prev,
            use_unit_discount: useUnit,
            product_discount: useUnit ? String(selectedUnitDiscount || '') : prev.product_discount || String(selectedUnitDiscount || ''),
        }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPricing((prev) => ({ ...prev, price: value, use_unit_price: false }));
    };

    const handlePriceUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPricing((prev) => ({ ...prev, product_usd_price: value, use_unit_usd_price: false }));
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
        setPricing((prev) => ({ ...prev, product_discount: value, use_unit_discount: false }));
    };

    useEffect(() => {
        if (!selectedUnit) return;
        setPricing((prev) => {
            const next = { ...prev };
            if (prev.use_unit_price) next.price = String(selectedUnitPrice || '');
            if (prev.use_unit_usd_price) next.product_usd_price = String(selectedUnitUsdPrice || '');
            if (prev.use_unit_discount) next.product_discount = String(selectedUnitDiscount || '');
            return next;
        });
    }, [selectedUnit, selectedUnitPrice, selectedUnitUsdPrice, selectedUnitDiscount]);

    const handleRowNameChange = (id: string, name: string) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, name } : row)));
        setRowErrors((prev) => {
            if (!prev[id]?.name) return prev;
            return { ...prev, [id]: { ...prev[id], name: undefined } };
        });
    };

    const handleRowWeightChange = (id: string, weight: string) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, weight } : row)));
        setRowErrors((prev) => {
            if (!prev[id]?.weight) return prev;
            return { ...prev, [id]: { ...prev[id], weight: undefined } };
        });
    };

    const validateImage = (file: File): string | null => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        if (file.size > maxSize) return `Image "${file.name}" is too large. Maximum size is 2MB.`;
        if (!allowedTypes.includes(file.type)) return `Image "${file.name}" has an invalid format. Only JPEG, PNG, GIF, and WebP are allowed.`;
        return null;
    };

    const handleRowImagesChange = (id: string, fileList: FileList | null) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        setBulkRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;

                const existingCount = row.existingPictures?.length ?? 0;
                const currentCount = row.images.length;
                const totalImages = currentCount + files.length + existingCount;
                if (totalImages > 5) {
                    const remaining = Math.max(0, 5 - (currentCount + existingCount));
                    setRowErrors((errs) => ({
                        ...errs,
                        [id]: {
                            ...errs[id],
                            images: `Maximum 5 images allowed. You can add only ${remaining} more image(s).`,
                        },
                    }));
                    return row;
                }

                const validationErrors: string[] = [];
                const validFiles: File[] = [];
                const validPreviews: string[] = [];

                files.forEach((file) => {
                    const error = validateImage(file);
                    if (error) {
                        validationErrors.push(error);
                    } else {
                        validFiles.push(file);
                        validPreviews.push(URL.createObjectURL(file));
                    }
                });

                if (validationErrors.length > 0) {
                    setRowErrors((errs) => ({
                        ...errs,
                        [id]: { ...errs[id], images: validationErrors.join(' ') },
                    }));
                    // revoke newly created previews if we won't use them
                    validPreviews.forEach((url) => URL.revokeObjectURL(url));
                    return row;
                }

                setRowErrors((errs) => {
                    const next = { ...errs };
                    if (next[id]?.images) {
                        next[id] = { ...next[id], images: undefined };
                    }
                    return next;
                });

                return {
                    ...row,
                    images: [...row.images, ...validFiles],
                    previews: [...row.previews, ...validPreviews],
                };
            }),
        );
    };

    const removeRowImage = (rowId: string, index: number) => {
        setBulkRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const nextImages = row.images.filter((_, i) => i !== index);
                const removedPreview = row.previews[index];
                if (removedPreview) URL.revokeObjectURL(removedPreview);
                const nextPreviews = row.previews.filter((_, i) => i !== index);
                setRowErrors((errs) => ({
                    ...errs,
                    [rowId]: { ...errs[rowId], images: undefined },
                }));
                return { ...row, images: nextImages, previews: nextPreviews };
            }),
        );
    };

    const handleRemoveExistingPicture = (rowId: string, pictureId: string) => {
        setBulkRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const nextRemove = Array.from(new Set([...(row.removePictureIds ?? []), pictureId]));
                return {
                    ...row,
                    existingPictures: row.existingPictures?.filter((pic) => pic.id !== pictureId) ?? [],
                    removePictureIds: nextRemove,
                };
            }),
        );
    };

    const formatDescriptionPreview = (text: string): string => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br />');
    };

    const handleRowDescriptionChange = (id: string, value: string) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, description: value } : row)));
        setRowErrors((prev) => {
            if (!prev[id]?.description) return prev;
            return { ...prev, [id]: { ...prev[id], description: undefined } };
        });
    };

    const insertFormatting = (id: string, startTag: string, endTag: string) => {
        const textarea = descriptionRefs.current[id];
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        const nextValue = before + startTag + selected + endTag + after;

        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, description: nextValue } : row)));

        setTimeout(() => {
            textarea.focus();
            const cursorPos = start + startTag.length + selected.length + endTag.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const handleDiscountSourceChange = (type: 'subcategory' | 'division' | 'variant', selectedValue: string, source: string) => {
        const setter = type === 'subcategory' ? setSubcategoryDiscounts : type === 'division' ? setDivisionDiscounts : setVariantDiscounts;
        const priceMap = type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;

        setter((prev) => {
            const current = prev[selectedValue];
            const basePrice = current?.base_price ?? priceMap[selectedValue] ?? 0;
            return {
                ...prev,
                [selectedValue]: {
                    ...(current ?? { source: '', value: '', base_price: basePrice }),
                    source,
                    value: source === 'manual' ? (current?.value ?? '') : '',
                    base_price: basePrice,
                },
            };
        });
    };

    const handleDiscountValueChange = (type: 'subcategory' | 'division' | 'variant', selectedValue: string, value: string) => {
        if (Number(value) > 100) return;
        const setter = type === 'subcategory' ? setSubcategoryDiscounts : type === 'division' ? setDivisionDiscounts : setVariantDiscounts;
        const priceMap = type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;

        setter((prev) => {
            const current = prev[selectedValue];
            const basePrice = current?.base_price ?? priceMap[selectedValue] ?? 0;
            return {
                ...prev,
                [selectedValue]: {
                    ...(current ?? { source: 'manual', value: '', base_price: basePrice }),
                    source: 'manual',
                    value,
                    base_price: basePrice,
                },
            };
        });
    };

    const handleOpenGroupStockDialog = () => {
        if (groupId) {
            setGroupStockData('group_id', groupId);
        }
        setGroupStockData('quantity', '');
        setGroupStockData('remarks', '');
        setOpenAddGroupStock(true);
    };

    const handleGroupStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId) return;
        postGroupStock(route('product.add-stock-group'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpenAddGroupStock(false);
                setGroupStockData('quantity', '');
                setGroupStockData('remarks', '');
            },
            onError: () => setOpenAddGroupStock(true),
        });
    };

    const handleSubmit = () => {
        const newFormErrors: typeof formErrors = {};
        const newRowErrors: Record<string, RowError> = {};

        if (!groupMeta.name.trim()) newFormErrors.group_name = 'Group name is required';
        if (hierarchy.unitIds.length === 0) newFormErrors.unit_id = 'Select a collection';
        if (hierarchy.subunitIds.length === 0) newFormErrors.sub_unit_id = 'Select a sub collection';
        if (hierarchy.categoryIds.length === 0) newFormErrors.categories = 'Select at least one category';
        if (hierarchy.subcategoryIds.length === 0) newFormErrors.sub_categories = 'Select at least one subcategory';
        // if (hierarchy.divisionIds.length === 0) newFormErrors.divisions = 'Select at least one option';
        // if (hierarchy.variantIds.length === 0) newFormErrors.variants = 'Select at least one variant';

        bulkRows.forEach((row) => {
            const errs: RowError = {};
            if (!row.name.trim()) errs.name = 'Product name is required';
            if (!row.weight || Number(row.weight) < 0) errs.weight = 'Weight is required';
            if (!row.description.trim()) errs.description = 'Description is required';
            if (Object.keys(errs).length) newRowErrors[row.id] = errs;
        });

        if (Object.keys(newFormErrors).length || Object.keys(newRowErrors).length) {
            setFormErrors(newFormErrors);
            setRowErrors(newRowErrors);
            return;
        }

        const fd = new FormData();
        fd.append('group_name', groupMeta.name);
        const unitId = hierarchy.unitIds[0];
        const subUnitId = hierarchy.subunitIds[0];
        if (defaultUnitId) fd.append('main_unit_id', defaultUnitId);
        if (unitId) fd.append('unit_id', unitId);
        if (subUnitId) fd.append('sub_unit_id', subUnitId);
        hierarchy.categoryIds.forEach((id) => fd.append('categories[]', id));

        fd.append('use_unit_price', pricing.use_unit_price ? '1' : '0');
        fd.append('use_unit_usd_price', pricing.use_unit_usd_price ? '1' : '0');
        fd.append('use_unit_discount', pricing.use_unit_discount ? '1' : '0');
        if (!pricing.use_unit_price) fd.append('product_price', pricing.price || '0');
        if (!pricing.use_unit_usd_price) fd.append('product_usd_price', pricing.product_usd_price || '0');
        if (!pricing.use_unit_discount) fd.append('product_discount', pricing.product_discount || '0');

        buildDiscountPayload('subcategory').forEach((item) => {
            fd.append(`${item.prefix}[${item.index}][id]`, item.id);
            fd.append(`${item.prefix}[${item.index}][${item.useKey}]`, item.useDefault ? '1' : '0');
            fd.append(`${item.prefix}[${item.index}][${item.manualKey}]`, item.useDefault ? '0' : String(Number(item.value || 0)));
        });
        buildDiscountPayload('division').forEach((item) => {
            fd.append(`${item.prefix}[${item.index}][id]`, item.id);
            fd.append(`${item.prefix}[${item.index}][${item.useKey}]`, item.useDefault ? '1' : '0');
            fd.append(`${item.prefix}[${item.index}][${item.manualKey}]`, item.useDefault ? '0' : String(Number(item.value || 0)));
        });
        buildDiscountPayload('variant').forEach((item) => {
            fd.append(`${item.prefix}[${item.index}][id]`, item.id);
            fd.append(`${item.prefix}[${item.index}][${item.useKey}]`, item.useDefault ? '1' : '0');
            fd.append(`${item.prefix}[${item.index}][${item.manualKey}]`, item.useDefault ? '0' : String(Number(item.value || 0)));
        });

        bulkRows.forEach((row, i) => {
            if (row.productId) {
                fd.append(`products[${i}][id]`, row.productId);
            }
            fd.append(`products[${i}][product_name]`, row.name);
            fd.append(`products[${i}][weight]`, row.weight || '0');
            fd.append(`products[${i}][description]`, row.description);
            row.tags.forEach((tag) => fd.append(`products[${i}][tags][]`, tag));
            row.removePictureIds?.forEach((picId) => fd.append(`products[${i}][remove_picture_ids][]`, picId));
            row.images.forEach((file, j) => fd.append(`products[${i}][pictures][${j}]`, file));
        });

        removedProductIds.forEach((id) => fd.append('remove_product_ids[]', id));

        setRowErrors({});
        setFormErrors({});

        setIsSubmitting(true);

        const targetRoute = isEditMode && groupId ? route('product.edit-product-group', groupId) : route('product.add-product-group');

        router.post(targetRoute, fd, {
            forceFormData: true,
            onError: (errors) => {
                const mappedFormErrors: typeof formErrors = {};
                const mappedRowErrors: Record<string, RowError> = {};

                Object.entries(errors).forEach(([key, message]) => {
                    if (key.startsWith('products.')) {
                        const parts = key.split('.');
                        const index = Number(parts[1]);
                        const field = parts[2] || '';
                        const rowId = bulkRows[index]?.id;
                        if (!rowId) return;
                        const fieldKey =
                            field === 'product_name'
                                ? 'name'
                                : field === 'weight'
                                  ? 'weight'
                                  : field === 'description'
                                    ? 'description'
                                    : field.startsWith('pictures')
                                      ? 'images'
                                      : null;
                        if (!fieldKey) return;
                        mappedRowErrors[rowId] = {
                            ...mappedRowErrors[rowId],
                            [fieldKey]: message as string,
                        };
                    } else {
                        mappedFormErrors[key as keyof typeof formErrors] = message as string;
                    }
                });

                setFormErrors(mappedFormErrors);
                if (Object.keys(mappedRowErrors).length) {
                    setRowErrors((prev) => ({ ...prev, ...mappedRowErrors }));
                }
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const applyBulkWeight = (value: string) => {
        setBulkWeight(value);
        setBulkRows((prev) => prev.map((row) => ({ ...row, weight: value })));
    };

    const applyBulkDescription = (value: string) => {
        setBulkDescription(value);
        setBulkRows((prev) => prev.map((row) => ({ ...row, description: value })));
        setRowErrors((prev) => {
            const hasDescriptionError = Object.values(prev).some((err) => err?.description);
            if (!hasDescriptionError) return prev;
            const next = { ...prev };
            Object.keys(next).forEach((rowId) => {
                if (next[rowId]?.description) {
                    next[rowId] = { ...next[rowId], description: undefined };
                }
            });
            return next;
        });
    };

    const insertBulkFormatting = (startTag: string, endTag: string) => {
        const textarea = bulkDescriptionRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        const nextValue = before + startTag + selected + endTag + after;

        applyBulkDescription(nextValue);

        setTimeout(() => {
            textarea.focus();
            const cursorPos = start + startTag.length + selected.length + endTag.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const addBulkRowsFromNames = () => {
        const names = bulkNames
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        if (!names.length) return;

        setBulkRows((prev) => [
            ...prev,
            ...names.map((name) => ({
                id: randomId(),
                name,
                images: [],
                previews: [],
                existingPictures: [],
                removePictureIds: [],
                description: bulkDescription,
                weight: bulkWeight,
                tags: []
            })),
        ]);
        setBulkNames('');
        setRowErrors({});
    };

    const addEmptyRow = () =>
        setBulkRows((prev) => [
            ...prev,
            {
                id: randomId(),
                name: '',
                images: [],
                previews: [],
                existingPictures: [],
                removePictureIds: [],
                description: bulkDescription,
                weight: bulkWeight,
                tags: []
            },
        ]);

    const removeRow = (id: string) => {
        setBulkRows((prev) => {
            if (prev.length === 1) return prev;
            const target = prev.find((row) => row.id === id);
            target?.previews.forEach((url) => URL.revokeObjectURL(url));
            if (target?.productId) {
                setRemovedProductIds((current) => (current.includes(target.productId!) ? current : [...current, target.productId!]));
            }
            return prev.filter((row) => row.id !== id);
        });
        setRowErrors((errs) => {
            const next = { ...errs };
            delete next[id];
            return next;
        });
        delete descriptionRefs.current[id];
    };

    return (
        <>
            {isEditMode && groupId && (
                <GroupStockDialog
                    open={openAddGroupStock}
                    onOpenChange={setOpenAddGroupStock}
                    onSubmit={handleGroupStockSubmit}
                    data={groupStockData}
                    setData={setGroupStockData}
                    errors={groupStockErrors}
                    isSubmitting={isGroupStockSubmitting}
                />
            )}
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={isEditMode ? 'Products - Edit Group' : 'Products - Group Builder'} />

                <div className="space-y-6 p-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Layers className="size-4" />
                            <span>Group builder</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold">{isEditMode ? 'Edit product group' : 'Create a product group'}</h1>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/products/product/group">Back to groups</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Group basics</CardTitle>
                                <CardDescription>Give this group a name and internal note so it is easy to find later.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="group-name">Group name</Label>
                                    <Input
                                        id="group-name"
                                        placeholder="e.g. Summer bundle"
                                        value={groupMeta.name}
                                        onChange={(e) => setGroupMeta((prev) => ({ ...prev, name: e.target.value }))}
                                    />
                                    {formErrors.group_name && <p className="text-xs text-red-500">{formErrors.group_name}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Hierarchy selection</CardTitle>
                                    <CardDescription>
                                        Follow the same steps as the single product flow to anchor this group. Collection and sub collection are
                                        single-select; the rest can take multiple selections.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setHierarchy({
                                            unitIds: [],
                                            subunitIds: [],
                                            categoryIds: [],
                                            subcategoryIds: [],
                                            divisionIds: [],
                                            variantIds: []
                                        })
                                    }
                                >
                                    <RefreshCw className="size-4" />
                                    Reset
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="unit">Collection</Label>
                                        <MultiSelect
                                            options={unitOptions}
                                            values={hierarchy.unitIds}
                                            onChange={handleUnitChange}
                                            placeholder="Select a collection"
                                            maxSelections={1}
                                        />
                                        {formErrors.unit_id && <p className="text-xs text-red-500">{formErrors.unit_id}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subunit">Category</Label>
                                        <MultiSelect
                                            options={subunitOptions}
                                            values={hierarchy.subunitIds}
                                            onChange={handleSubunitChange}
                                            placeholder="Select a Category"
                                            disabled={!subunitOptions.length}
                                            maxSelections={1}
                                        />
                                        {formErrors.sub_unit_id && <p className="text-xs text-red-500">{formErrors.sub_unit_id}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="category">Variant</Label>
                                        <MultiSelect
                                            options={categoryOptions}
                                            values={hierarchy.categoryIds}
                                            onChange={handleCategoryChange}
                                            placeholder="Select Variant(s)"
                                            disabled={!categoryOptions.length}
                                        />
                                        {formErrors.categories && <p className="text-xs text-red-500">{formErrors.categories}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subcategory">Type</Label>
                                        <MultiSelect
                                            options={subcategoryOptions}
                                            values={hierarchy.subcategoryIds}
                                            onChange={handleSubcategoryChange}
                                            placeholder="Select type(s)"
                                            disabled={!subcategoryOptions.length}
                                        />
                                        {formErrors.sub_categories && <p className="text-xs text-red-500">{formErrors.sub_categories}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="division">Option</Label>
                                        <MultiSelect
                                            options={divisionOptions}
                                            values={hierarchy.divisionIds}
                                            onChange={handleDivisionChange}
                                            placeholder="Select option(s)"
                                            disabled={!divisionOptions.length}
                                        />
                                        {/* {formErrors.divisions && <p className="text-xs text-red-500">{formErrors.divisions}</p>} */}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="variant">Selection</Label>
                                        <MultiSelect
                                            options={variantOptions}
                                            values={hierarchy.variantIds}
                                            onChange={handleVariantChange}
                                            placeholder="Select selection(s)"
                                            disabled={!variantOptions.length}
                                        />
                                        {/* {formErrors.variants && <p className="text-xs text-red-500">{formErrors.variants}</p>} */}
                                    </div>
                                </div>

                                {!units.length && (
                                    <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        No hierarchy data was shared with this page yet. The selects will populate automatically once units and
                                        related collections are passed from the server.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & Discounts</CardTitle>
                                <CardDescription>
                                    Choose to use default prices/discounts from the selected collection or enter manual values.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {selectedUnits.length > 1 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="default-unit">Default collection for pricing</Label>
                                        <select
                                            id="default-unit"
                                            className="w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            value={defaultUnitId ?? ''}
                                            onChange={(e) => setDefaultUnitId(e.target.value)}
                                        >
                                            {selectedUnits.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} — Rp {formatRupiah(String(u.price ?? 0))} / ${formatUsd(String(u.usd_price ?? 0))}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">Defaults to the highest price if you don’t pick one.</p>
                                    </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 rounded-md border border-yellow-300 bg-white p-3">
                                        <div className="text-sm font-medium text-yellow-700">Price (IDR)</div>
                                        <div className="space-y-2 text-sm text-yellow-700">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    checked={pricing.use_unit_price}
                                                    onChange={() => toggleUnitPrice(true)}
                                                    className="text-yellow-700"
                                                />
                                                <span>Use default price (Rp {formatRupiah(String(selectedUnitPrice || 0))})</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    checked={!pricing.use_unit_price}
                                                    onChange={() => toggleUnitPrice(false)}
                                                    className="text-yellow-700"
                                                />
                                                <span>Enter manually</span>
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute top-2 left-3 text-gray-500">Rp</span>
                                            <input
                                                type="text"
                                                value={formatRupiah(pricing.price)}
                                                onChange={handlePriceChange}
                                                className={`w-full rounded-md border py-2 pr-3 pl-10 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                                    pricing.use_unit_price ? 'bg-gray-50 text-gray-500' : 'bg-white text-foreground'
                                                }`}
                                                placeholder="0"
                                                disabled={pricing.use_unit_price}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 rounded-md border border-yellow-300 bg-white p-3">
                                        <div className="text-sm font-medium text-yellow-700">Price (USD)</div>
                                        <div className="space-y-2 text-sm text-yellow-700">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    checked={pricing.use_unit_usd_price}
                                                    onChange={() => toggleUnitUsdPrice(true)}
                                                    className="text-yellow-700"
                                                />
                                                <span>Use default price (${formatUsd(String(selectedUnitUsdPrice || 0))})</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    checked={!pricing.use_unit_usd_price}
                                                    onChange={() => toggleUnitUsdPrice(false)}
                                                    className="text-yellow-700"
                                                />
                                                <span>Enter manually</span>
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute top-2 left-3 text-gray-500">$</span>
                                            <input
                                                type="text"
                                                value={formatUsd(pricing.product_usd_price)}
                                                onChange={handlePriceUsdChange}
                                                className={`w-full rounded-md border py-2 pr-3 pl-10 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                                    pricing.use_unit_usd_price ? 'bg-gray-50 text-gray-500' : 'bg-white text-foreground'
                                                }`}
                                                placeholder="0"
                                                disabled={pricing.use_unit_usd_price}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-md border border-yellow-300 bg-white p-3">
                                    <div className="mb-2 text-sm font-medium text-yellow-700">Product discount</div>
                                    <div className="space-y-2 text-sm text-yellow-700">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={pricing.use_unit_discount}
                                                onChange={() => toggleUnitDiscount(true)}
                                                className="text-yellow-700"
                                            />
                                            <span>Use default discount ({selectedUnitDiscount || 0}%)</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={!pricing.use_unit_discount}
                                                onChange={() => toggleUnitDiscount(false)}
                                                className="text-yellow-700"
                                            />
                                            <span>Enter manually</span>
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={pricing.product_discount}
                                            onChange={handleDiscountChange}
                                            className={`w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                                pricing.use_unit_discount ? 'bg-gray-50 text-gray-500' : 'bg-white text-foreground'
                                            }`}
                                            placeholder="Enter discount percentage"
                                            maxLength={3}
                                            disabled={pricing.use_unit_discount}
                                        />
                                        <span className="absolute top-2 right-3 text-gray-500">%</span>
                                    </div>
                                </div>

                                {hierarchy.subcategoryIds.length > 0 && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="mb-3">
                                            <label className="text-sm font-medium">Subcategory discounts</label>
                                        </div>
                                        <div className="space-y-4">
                                            {hierarchy.subcategoryIds.map((id) => (
                                                <div key={id} className="rounded-md border border-blue-300 bg-white p-3">
                                                    <div className="mb-2 text-sm font-medium">{subcatNameById[id] || id}</div>
                                                    <div className="space-y-2 text-sm text-blue-700">
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`subcatDiscount-${id}`}
                                                                value={id}
                                                                checked={subcategoryDiscounts[id]?.source === id}
                                                                onChange={() => handleDiscountSourceChange('subcategory', id, id)}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Use default ({subcatDiscountById[id] ?? 0}%)</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`subcatDiscount-${id}`}
                                                                value="manual"
                                                                checked={subcategoryDiscounts[id]?.source === 'manual'}
                                                                onChange={() => handleDiscountSourceChange('subcategory', id, 'manual')}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Enter manually</span>
                                                        </label>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={subcategoryDiscounts[id]?.value || ''}
                                                            onChange={(e) =>
                                                                handleDiscountValueChange('subcategory', id, e.target.value.replace(/\D/g, ''))
                                                            }
                                                            className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                            placeholder="Enter discount percentage"
                                                            disabled={
                                                                subcategoryDiscounts[id]?.source !== 'manual' &&
                                                                subcategoryDiscounts[id]?.source !== ''
                                                            }
                                                            maxLength={3}
                                                        />
                                                        <span className="absolute top-2 right-3 text-gray-500">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hierarchy.divisionIds.length > 0 && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="mb-3">
                                            <label className="text-sm font-medium">Option discounts</label>
                                        </div>
                                        <div className="space-y-4">
                                            {hierarchy.divisionIds.map((id) => (
                                                <div key={id} className="rounded-md border border-blue-300 bg-white p-3">
                                                    <div className="mb-2 text-sm font-medium">{divisionNameById[id] || id}</div>
                                                    <div className="space-y-2 text-sm text-blue-700">
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`divisionDiscount-${id}`}
                                                                value={id}
                                                                checked={divisionDiscounts[id]?.source === id}
                                                                onChange={() => handleDiscountSourceChange('division', id, id)}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Use default ({divisionDiscountById[id] ?? 0}%)</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`divisionDiscount-${id}`}
                                                                value="manual"
                                                                checked={divisionDiscounts[id]?.source === 'manual'}
                                                                onChange={() => handleDiscountSourceChange('division', id, 'manual')}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Enter manually</span>
                                                        </label>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={divisionDiscounts[id]?.value || ''}
                                                            onChange={(e) =>
                                                                handleDiscountValueChange('division', id, e.target.value.replace(/\D/g, ''))
                                                            }
                                                            className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                            placeholder="Enter discount percentage"
                                                            disabled={
                                                                divisionDiscounts[id]?.source !== 'manual' && divisionDiscounts[id]?.source !== ''
                                                            }
                                                            maxLength={3}
                                                        />
                                                        <span className="absolute top-2 right-3 text-gray-500">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hierarchy.variantIds.length > 0 && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="mb-3">
                                            <label className="text-sm font-medium">Variant discounts</label>
                                        </div>
                                        <div className="space-y-4">
                                            {hierarchy.variantIds.map((id) => (
                                                <div key={id} className="rounded-md border border-blue-300 bg-white p-3">
                                                    <div className="mb-2 text-sm font-medium">{variantNameById[id] || id}</div>
                                                    <div className="space-y-2 text-sm text-blue-700">
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`variantDiscount-${id}`}
                                                                value={id}
                                                                checked={variantDiscounts[id]?.source === id}
                                                                onChange={() => handleDiscountSourceChange('variant', id, id)}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Use default ({variantDiscountById[id] ?? 0}%)</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`variantDiscount-${id}`}
                                                                value="manual"
                                                                checked={variantDiscounts[id]?.source === 'manual'}
                                                                onChange={() => handleDiscountSourceChange('variant', id, 'manual')}
                                                                className="text-blue-700"
                                                            />
                                                            <span>Enter manually</span>
                                                        </label>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={variantDiscounts[id]?.value || ''}
                                                            onChange={(e) =>
                                                                handleDiscountValueChange('variant', id, e.target.value.replace(/\D/g, ''))
                                                            }
                                                            className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                            placeholder="Enter discount percentage"
                                                            disabled={
                                                                variantDiscounts[id]?.source !== 'manual' && variantDiscounts[id]?.source !== ''
                                                            }
                                                            maxLength={3}
                                                        />
                                                        <span className="absolute top-2 right-3 text-gray-500">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Bulk add products</CardTitle>
                                    <CardDescription>Draft multiple products at once with names, weight (gram), and a cover image.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={addEmptyRow}>
                                        <Plus className="size-4" />
                                        Add row
                                    </Button>
                                    <Button type="button" size="sm" onClick={addBulkRowsFromNames}>
                                        <ListPlus className="size-4" />
                                        Use pasted names
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="bulk-weight">Bulk weight (gram)</Label>
                                    <Input
                                        id="bulk-weight"
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 500"
                                        value={bulkWeight}
                                        onChange={(e) => applyBulkWeight(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Setting this will fill the weight field for all rows (including existing ones).
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="bulk-description">Bulk description</Label>
                                        <span className="text-xs text-muted-foreground">Applies to all rows</span>
                                    </div>
                                    <div className="rounded-md border">
                                        <div className="flex space-x-2 border-b border-gray-200 p-2">
                                            <button
                                                type="button"
                                                onClick={() => insertBulkFormatting('**', '**')}
                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                title="Bold (wrap with **text**)"
                                            >
                                                <Bold size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertBulkFormatting('*', '*')}
                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                title="Italic (wrap with *text*)"
                                            >
                                                <Italic size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertBulkFormatting('__', '__')}
                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                title="Underline (wrap with __text__)"
                                            >
                                                <Underline size={14} />
                                            </button>
                                        </div>
                                        <textarea
                                            ref={bulkDescriptionRef}
                                            id="bulk-description"
                                            rows={5}
                                            className="min-h-[110px] w-full resize-none p-3 text-sm focus:outline-none"
                                            placeholder="Enter product description... Use **bold**, *italic*, __underline__"
                                            value={bulkDescription}
                                            onChange={(e) => applyBulkDescription(e.target.value)}
                                        />
                                        {bulkDescription && (
                                            <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                <div className="mb-1 text-xs text-muted-foreground">Preview:</div>
                                                <div
                                                    className="prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatDescriptionPreview(bulkDescription),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Setting this will fill the description field for all rows (including existing ones). Formatting: **bold**,
                                        *italic*, __underline__
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-lg border">
                                    <div className="divide-y">
                                        {bulkRows.map((row) => (
                                            <div key={row.id} className="space-y-4 px-4 py-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-sm">Delete Row</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRow(row.id)}
                                                            disabled={bulkRows.length === 1}
                                                            aria-label="Remove row"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`name-${row.id}`}>Product name</Label>
                                                    <Input
                                                        id={`name-${row.id}`}
                                                        placeholder="e.g. Bulbasaur"
                                                        value={row.name}
                                                        onChange={(e) => handleRowNameChange(row.id, e.target.value)}
                                                    />
                                                    {rowErrors[row.id]?.name && <p className="text-xs text-red-500">{rowErrors[row.id]?.name}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`weight-${row.id}`}>Weight (gram)</Label>
                                                    <Input
                                                        id={`weight-${row.id}`}
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 500"
                                                        value={row.weight}
                                                        onChange={(e) => handleRowWeightChange(row.id, e.target.value)}
                                                    />
                                                    {rowErrors[row.id]?.weight && <p className="text-xs text-red-500">{rowErrors[row.id]?.weight}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label>Tags</Label>
                                                    <MultiSelect
                                                        options={tagsOptions}
                                                        values={row.tags}
                                                        onChange={(e) => handleTagChange(row.id, e)}
                                                        placeholder="Select tags(s)"
                                                    />
                                                    {rowErrors[row.id]?.tags && <p className="text-xs text-red-500">{rowErrors[row.id]?.tags}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={`file-${row.id}`}>Product images (max 5)</Label>
                                                        <span className="text-xs text-muted-foreground">
                                                            {row.images.length + (row.existingPictures?.length ?? 0)} / 5
                                                        </span>
                                                    </div>

                                                    {row.existingPictures && row.existingPictures.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-medium text-muted-foreground">Current pictures</p>
                                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                                {row.existingPictures.map((pic) => (
                                                                    <div key={pic.id} className="relative">
                                                                        <img
                                                                            src={pic.url}
                                                                            alt={row.name || 'Existing product image'}
                                                                            className="h-24 w-full rounded-md border object-cover"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveExistingPicture(row.id, pic.id)}
                                                                            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                                                                            aria-label="Remove existing image"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {row.previews.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                            {row.previews.map((preview, index) => (
                                                                <div key={preview} className="relative">
                                                                    <img
                                                                        src={preview}
                                                                        alt={row.images[index]?.name || `Preview ${index + 1}`}
                                                                        className="h-24 w-full rounded-md border object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeRowImage(row.id, index)}
                                                                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                                                                        aria-label="Remove image"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                    <div className="mt-1 truncate text-center text-xs text-muted-foreground">
                                                                        {row.images[index]?.name}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {row.images.length + (row.existingPictures?.length ?? 0) < 5 && (
                                                        <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                                                            <Upload className="h-6 w-6 text-gray-400" />
                                                            <p className="mt-1 text-xs text-muted-foreground">Upload images</p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {5 - row.images.length - (row.existingPictures?.length ?? 0)} remaining
                                                            </p>
                                                            <input
                                                                id={`file-${row.id}`}
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    handleRowImagesChange(row.id, e.target.files);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                        </label>
                                                    )}

                                                    <p className="text-xs text-muted-foreground">
                                                        Select up to 5 images. Each must be under 2MB. Supported: JPEG, PNG, GIF, WebP.
                                                    </p>
                                                    {rowErrors[row.id]?.images && <p className="text-xs text-red-500">{rowErrors[row.id]?.images}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={`description-${row.id}`}>Product description</Label>
                                                        <span className="text-xs text-muted-foreground">Optional</span>
                                                    </div>
                                                    <div className="rounded-md border">
                                                        <div className="flex space-x-2 border-b border-gray-200 p-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => insertFormatting(row.id, '**', '**')}
                                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                                title="Bold (wrap with **text**)"
                                                            >
                                                                <Bold size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => insertFormatting(row.id, '*', '*')}
                                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                                title="Italic (wrap with *text*)"
                                                            >
                                                                <Italic size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => insertFormatting(row.id, '__', '__')}
                                                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                                                title="Underline (wrap with __text__)"
                                                            >
                                                                <Underline size={14} />
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            ref={(el) => {
                                                                descriptionRefs.current[row.id] = el;
                                                            }}
                                                            id={`description-${row.id}`}
                                                            value={row.description}
                                                            onChange={(e) => handleRowDescriptionChange(row.id, e.target.value)}
                                                            placeholder="Enter product description... Use **bold**, *italic*, __underline__"
                                                            className="min-h-[110px] w-full resize-none p-3 text-sm focus:outline-none"
                                                            rows={5}
                                                        />
                                                        {row.description && (
                                                            <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                                <div className="mb-1 text-xs text-muted-foreground">Preview:</div>
                                                                <div
                                                                    className="prose prose-sm max-w-none"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: formatDescriptionPreview(row.description),
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {rowErrors[row.id]?.description && (
                                                        <p className="text-xs text-red-500">{rowErrors[row.id]?.description}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">Formatting: **bold**, *italic*, __underline__</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bulk-name-list">Paste names to create rows</Label>
                                    <textarea
                                        id="bulk-name-list"
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                        placeholder="One product name per line"
                                        value={bulkNames}
                                        onChange={(e) => setBulkNames(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        We will add new rows for every non-empty line. Pictures stay attached to existing rows.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving…' : isEditMode ? 'Update group' : 'Save group'}
                            </Button>
                            {formErrors.products && <p className="text-sm text-red-500">{formErrors.products}</p>}
                        </div>
                    </div>
                </div>
            </div>
            </AppLayout>
        </>
    );
}

type GroupStockDialogProps = {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    data: GroupStockFormData;
    setData: (field: keyof GroupStockFormData, value: string) => void;
    errors: Partial<Record<keyof GroupStockFormData, string>>;
    isSubmitting: boolean;
};

function GroupStockDialog({ open, onOpenChange, onSubmit, data, setData, errors, isSubmitting }: GroupStockDialogProps) {
    useEffect(() => {
        if (open) {
            setData('quantity', data.quantity || '');
            setData('remarks', data.remarks || '');
        }
    }, [data.quantity, data.remarks, open, setData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">Add stock</DialogTitle>
                    <form method="POST" onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity *</label>
                            <input
                                type="text"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                    errors.quantity ? 'border-red-500' : 'border-gray-200'
                                }`}
                                placeholder="0"
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <input
                                type="text"
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                    errors.remarks ? 'border-red-500' : 'border-gray-200'
                                }`}
                                placeholder="Enter remarks"
                            />
                            {errors.remarks && <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>}
                        </div>
                        <DialogClose asChild>
                            <Button type="submit" className="capitalize" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving…' : 'Add stock'}
                            </Button>
                        </DialogClose>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
