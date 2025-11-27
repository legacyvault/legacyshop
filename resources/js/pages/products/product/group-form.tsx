import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ICategories, IDivisions, ISubUnits, ISubcats, IUnit, IVariants, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronDown, Layers, ListPlus, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    name: string;
    image: File | null;
    preview?: string;
    weight: string;
};

const randomId = () => Math.random().toString(36).slice(2, 10);

interface MultiSelectProps {
    options: { value: string; label: string }[];
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, values, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
        } else {
            onChange([...values, value]);
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
                                    <input type="checkbox" checked={values.includes(option.value)} readOnly />
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
    const shared = usePage<SharedData>().props as Partial<SharedData>;

    const units = (shared.units as IUnit[] | undefined) ?? [];
    const subunits = (shared.subunits as ISubUnits[] | undefined) ?? [];
    const categories = (shared.categories as ICategories[] | undefined) ?? [];
    const subcats = (shared.subcats as ISubcats[] | undefined) ?? [];
    const divisions = (shared.divisions as IDivisions[] | undefined) ?? [];
    const variants = (shared.variants as IVariants[] | undefined) ?? [];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Groups',
            href: '/products/product/group',
        },
        {
            title: 'Create group',
            href: '/products/product/group/create',
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
        { id: randomId(), name: '', image: null, preview: undefined, weight: '' },
        { id: randomId(), name: '', image: null, preview: undefined, weight: '' },
    ]);

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

    const selectedPath = useMemo(() => {
        const findNames = (ids: string[], list: { id: string; name: string }[]) =>
            list.filter((item) => ids.includes(item.id)).map((item) => item.name);
        const path = [
            ...findNames(hierarchy.unitIds, units),
            ...findNames(hierarchy.subunitIds, subunits),
            ...findNames(hierarchy.categoryIds, categories),
            ...findNames(hierarchy.subcategoryIds, subcats),
            ...findNames(hierarchy.divisionIds, divisions),
            ...findNames(hierarchy.variantIds, variants),
        ];

        return path.length ? path.join(' • ') : 'No hierarchy selected yet';
    }, [categories, divisions, hierarchy, subcats, subunits, units, variants]);

    const stats = useMemo(() => {
        const named = bulkRows.filter((row) => row.name.trim().length > 0).length;
        const imaged = bulkRows.filter((row) => !!row.image).length;
        return {
            total: bulkRows.length,
            named,
            imaged,
        };
    }, [bulkRows]);

    useEffect(
        () => () => {
            bulkRows.forEach((row) => {
                if (row.preview) {
                    URL.revokeObjectURL(row.preview);
                }
            });
        },
        [bulkRows],
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
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, unitIds: values }, 'unitIds');
            const allowedSubunits = new Set(subunits.filter((s) => values.includes(s.unit_id)).map((s) => s.id));
            next.subunitIds = next.subunitIds.filter((id) => allowedSubunits.has(id));
            return next;
        });
    };

    const handleSubunitChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, subunitIds: values }, 'subunitIds');
            const allowedCategories = new Set(categories.filter((c) => values.includes(c.sub_unit_id)).map((c) => c.id));
            next.categoryIds = next.categoryIds.filter((id) => allowedCategories.has(id));
            return next;
        });
    };

    const handleCategoryChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, categoryIds: values }, 'categoryIds');
            const allowedSubs = new Set(subcats.filter((s) => values.includes(s.category_id)).map((s) => s.id));
            next.subcategoryIds = next.subcategoryIds.filter((id) => allowedSubs.has(id));
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
    };

    const handleDivisionChange = (values: string[]) => {
        setHierarchy((prev) => {
            const next = resetHierarchyBelow({ ...prev, divisionIds: values }, 'divisionIds');
            const allowedVars = new Set(variants.filter((v) => values.includes(v.division_id)).map((v) => v.id));
            next.variantIds = next.variantIds.filter((id) => allowedVars.has(id));
            return next;
        });
    };

    const handleVariantChange = (values: string[]) => {
        setHierarchy((prev) => ({ ...prev, variantIds: values }));
    };

    const handleRowNameChange = (id: string, name: string) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, name } : row)));
    };

    const handleRowWeightChange = (id: string, weight: string) => {
        setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, weight } : row)));
    };

    const handleRowImageChange = (id: string, fileList: FileList | null) => {
        const file = fileList?.item(0) ?? null;
        setBulkRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                if (row.preview) URL.revokeObjectURL(row.preview);
                return {
                    ...row,
                    image: file,
                    preview: file ? URL.createObjectURL(file) : undefined,
                };
            }),
        );
    };

    const addBulkRowsFromNames = () => {
        const names = bulkNames
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        if (!names.length) return;

        setBulkRows((prev) => [...prev, ...names.map((name) => ({ id: randomId(), name, image: null, preview: undefined, weight: '' }))]);
        setBulkNames('');
    };

    const addEmptyRow = () => setBulkRows((prev) => [...prev, { id: randomId(), name: '', image: null, preview: undefined, weight: '' }]);

    const removeRow = (id: string) => {
        setBulkRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Group Builder" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Layers className="size-4" />
                        <span>Group builder</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold">Create a product group</h1>
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
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Hierarchy selection</CardTitle>
                                    <CardDescription>
                                        Follow the same steps as the single product flow to anchor this group. Multiple selections are allowed.
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
                                            variantIds: [],
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
                                            placeholder="Select collection(s)"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subunit">Sub collection</Label>
                                        <MultiSelect
                                            options={subunitOptions}
                                            values={hierarchy.subunitIds}
                                            onChange={handleSubunitChange}
                                            placeholder="Select sub collection(s)"
                                            disabled={!subunitOptions.length}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="category">Category</Label>
                                        <MultiSelect
                                            options={categoryOptions}
                                            values={hierarchy.categoryIds}
                                            onChange={handleCategoryChange}
                                            placeholder="Select category(ies)"
                                            disabled={!categoryOptions.length}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subcategory">Subcategory</Label>
                                        <MultiSelect
                                            options={subcategoryOptions}
                                            values={hierarchy.subcategoryIds}
                                            onChange={handleSubcategoryChange}
                                            placeholder="Select subcategory(ies)"
                                            disabled={!subcategoryOptions.length}
                                        />
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
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="variant">Variant</Label>
                                        <MultiSelect
                                            options={variantOptions}
                                            values={hierarchy.variantIds}
                                            onChange={handleVariantChange}
                                            placeholder="Select variant(s)"
                                            disabled={!variantOptions.length}
                                        />
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
                                <div className="overflow-hidden rounded-lg border">
                                    <div className="grid grid-cols-12 bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                        <div className="col-span-5">Product name</div>
                                        <div className="col-span-4">Picture</div>
                                        <div className="col-span-2">Weight (gram)</div>
                                        <div className="col-span-1 text-right">Actions</div>
                                    </div>
                                    <div className="divide-y">
                                        {bulkRows.map((row) => (
                                            <div key={row.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                                                <div className="col-span-5">
                                                    <Label className="sr-only" htmlFor={`name-${row.id}`}>
                                                        Product name
                                                    </Label>
                                                    <Input
                                                        id={`name-${row.id}`}
                                                        placeholder="e.g. Midnight Black / 500ml"
                                                        value={row.name}
                                                        onChange={(e) => handleRowNameChange(row.id, e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <Label className="sr-only" htmlFor={`file-${row.id}`}>
                                                        Picture
                                                    </Label>
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            id={`file-${row.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleRowImageChange(row.id, e.target.files)}
                                                        />
                                                        {row.preview ? (
                                                            <img
                                                                src={row.preview}
                                                                alt={row.name || 'Preview'}
                                                                className="size-12 rounded-md border object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-12 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                                                                <Upload className="size-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <Label className="sr-only" htmlFor={`weight-${row.id}`}>
                                                        Weight (gram)
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id={`weight-${row.id}`}
                                                            type="number"
                                                            min="0"
                                                            placeholder="e.g. 500"
                                                            value={row.weight}
                                                            onChange={(e) => handleRowWeightChange(row.id, e.target.value)}
                                                        />
                                                        <span className="text-sm text-muted-foreground">gram</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 flex justify-end gap-2">
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
                            <Button type="button">Save group</Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
