import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ICategories, IDivisions, IProducts, ISubcats, ITags, IVariants, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Bold, ChevronDown, Italic, Search, Underline, Upload, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface FormData {
    name: string;
    images: File[];
    description: string;
    price: string;
    product_discount: string;
    unit: string;
    product_sku: string;
    product_usd_price: string;
    category: string[];
    subcategory: string[];
    division: string[];
    variant: string[];
    tags: string[];
    is_showcase: boolean;
    // New discount structure - each value has its own discount settings
    subcategoryDiscounts: Record<string, { source: string; value: string; base_price: number }>; // e.g., { "subcategory 1": { source: "subcategory 1", value: "10" } }
    divisionDiscounts: Record<string, { source: string; value: string; base_price: number }>;
    variantDiscounts: Record<string, { source: string; value: string; base_price: number }>;
}

interface FormErrors {
    name?: string;
    images?: string;
    description?: string;
    price?: string;
    product_discount?: string;
    unit?: string;
    category?: string;
    subcategory?: string;
    division?: string;
    variant?: string;
    tags?: string;
    product_sku?: string;
    product_usd_price?: string;
    is_showcase?: string;
    // New discount error structure
    subcategoryDiscounts?: Record<string, string>;
    divisionDiscounts?: Record<string, string>;
    variantDiscounts?: Record<string, string>;
}

// Multi-select component
interface MultiSelectProps {
    options: { value: string; label: string }[];
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    error?: string;
    disabled?: boolean;
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts
                .filter((part) => part)
                .map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="rounded bg-yellow-200 px-1 text-yellow-900">
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    ),
                )}
        </span>
    );
};

const MultiSelect: React.FC<MultiSelectProps> = ({ options, values, onChange, placeholder, error, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    useEffect(() => {
        const filtered = options.filter(
            (option) =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase()) || option.value.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        setFilteredOptions(filtered);
    }, [searchTerm, options]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(''); // Clear search when closing
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleOption = (value: string) => {
        if (values.includes(value)) {
            onChange(values.filter((v) => v !== value));
        } else {
            onChange([...values, value]);
        }
    };

    const removeValue = (value: string) => {
        onChange(values.filter((v) => v !== value));
    };

    const handleDropdownToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm(''); // Clear search when opening
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={handleDropdownToggle}
                className={`flex min-h-[42px] w-full items-center justify-between rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                    error ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'cursor-pointer'}`}
            >
                <div className="flex flex-wrap gap-1">
                    {values.length > 0 ? (
                        values.map((value) => (
                            <span key={value} className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-800">
                                {options.find((opt) => opt.value === value)?.label || value}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeValue(value);
                                    }}
                                    className="rounded-full p-0.5 hover:bg-blue-200"
                                >
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
                    {/* Search Input */}
                    <div className="border-b border-gray-200 p-2">
                        <div className="relative">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search options..."
                                className="w-full rounded-md border border-gray-300 py-2 pr-8 pl-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 ${
                                        values.includes(option.value) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={values.includes(option.value)}
                                        onChange={() => {}}
                                        className="pointer-events-none"
                                    />
                                    <span className="flex-1">
                                        {/* Highlight matching text */}
                                        {searchTerm ? <HighlightedText text={option.label} highlight={searchTerm} /> : option.label}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">No options found for "{searchTerm}"</div>
                        )}
                    </div>

                    {/* Results Count */}
                    {searchTerm && (
                        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                            {filteredOptions.length} of {options.length} options shown
                            {values.length > 0 && ` • ${values.length} selected`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper to build options for MultiSelects from entities
const toOptions = (items: { id: string; name: string }[] | undefined) => (items || []).map((i) => ({ value: i.id, label: i.name }));

export default function AddProduct() {
    const { units, categories, subcats, divisions, variants, tags, product, id } = usePage<SharedData>().props;

    const isEdit = !!id;

    const selectedProd: IProducts = product as IProducts;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Product`,
            href: '/products/add-product',
        },
    ];

    const [formData, setFormData] = useState<FormData>({
        name: '',
        images: [],
        description: '',
        price: '',
        product_discount: '',
        unit: '',
        category: [],
        subcategory: [],
        division: [],
        variant: [],
        subcategoryDiscounts: {},
        divisionDiscounts: {},
        variantDiscounts: {},
        tags: [],
        product_sku: '',
        product_usd_price: '',
        is_showcase: false,
    });
    // Prevent cascading reset effects during initial prefill
    const [isInitializing, setIsInitializing] = useState(false);

    // Build selection options and maps from server data
    const allCategoryOptions = useMemo(() => toOptions((categories as ICategories[])?.map((c) => ({ id: c.id, name: c.name }))), [categories]);
    const allSubcategoryOptions = useMemo(() => toOptions((subcats as ISubcats[])?.map((s) => ({ id: s.id, name: s.name }))), [subcats]);
    const allDivisionOptions = useMemo(() => toOptions((divisions as IDivisions[])?.map((d) => ({ id: d.id, name: d.name }))), [divisions]);
    const allVariantOptions = useMemo(() => toOptions((variants as IVariants[])?.map((v) => ({ id: v.id, name: v.name }))), [variants]);
    const tagOptions = useMemo(() => toOptions((tags as ITags[])?.map((t) => ({ id: t.id, name: t.name }))), [tags]);

    const subcatNameById = useMemo(() => {
        const m: Record<string, string> = {};
        (subcats as ISubcats[] | undefined)?.forEach((s) => (m[s.id] = s.name));
        return m;
    }, [subcats]);
    const subcatDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        (subcats as ISubcats[] | undefined)?.forEach((s) => (m[s.id] = Number(s.discount || 0)));
        return m;
    }, [subcats]);
    const subcatPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        (subcats as ISubcats[] | undefined)?.forEach((s) => (m[s.id] = Number(s.price || 0)));
        return m;
    }, [subcats]);
    const divisionNameById = useMemo(() => {
        const m: Record<string, string> = {};
        (divisions as IDivisions[] | undefined)?.forEach((d) => (m[d.id] = d.name));
        return m;
    }, [divisions]);
    const divisionDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        (divisions as IDivisions[] | undefined)?.forEach((d) => (m[d.id] = Number(d.discount || 0)));
        return m;
    }, [divisions]);
    const divisionPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        (divisions as IDivisions[] | undefined)?.forEach((d) => (m[d.id] = Number(d.price || 0)));
        return m;
    }, [divisions]);
    const variantNameById = useMemo(() => {
        const m: Record<string, string> = {};
        (variants as IVariants[] | undefined)?.forEach((v) => (m[v.id] = v.name));
        return m;
    }, [variants]);
    const variantDiscountById = useMemo(() => {
        const m: Record<string, number> = {};
        (variants as IVariants[] | undefined)?.forEach((v) => (m[v.id] = Number(v.discount || 0)));
        return m;
    }, [variants]);
    const variantPriceById = useMemo(() => {
        const m: Record<string, number> = {};
        (variants as IVariants[] | undefined)?.forEach((v) => (m[v.id] = Number(v.price || 0)));
        return m;
    }, [variants]);

    // Filtered options based on hierarchy selections
    const categoryOptions = useMemo(() => {
        const unitId = formData.unit;
        if (!unitId) return [] as { value: string; label: string }[];
        const cats = (categories as ICategories[] | undefined) || [];
        return toOptions(cats.filter((c) => c.unit_id === unitId));
    }, [categories, formData.unit]);

    const subcategoryOptions = useMemo(() => {
        if (formData.category.length === 0) return [] as { value: string; label: string }[];
        const subs = (subcats as ISubcats[] | undefined) || [];
        const set = new Set(formData.category);
        return toOptions(subs.filter((s) => set.has(s.category_id)));
    }, [subcats, formData.category]);

    const divisionOptions = useMemo(() => {
        if (formData.subcategory.length === 0) return [] as { value: string; label: string }[];
        const divs = (divisions as IDivisions[] | undefined) || [];
        const set = new Set(formData.subcategory);
        return toOptions(divs.filter((d) => set.has(d.sub_category_id)));
    }, [divisions, formData.subcategory]);

    const variantOptions = useMemo(() => {
        if (formData.division.length === 0) return [] as { value: string; label: string }[];
        const vars = (variants as IVariants[] | undefined) || [];
        const set = new Set(formData.division);
        return toOptions(vars.filter((v) => set.has(v.division_id)));
    }, [variants, formData.division]);

    // Reset children selections when parent changes
    useEffect(() => {
        // When unit changes, clear categories and below
        if (isInitializing) return;
        setFormData((prev) => ({
            ...prev,
            category: [],
            subcategory: [],
            division: [],
            variant: [],
            subcategoryDiscounts: {},
            divisionDiscounts: {},
            variantDiscounts: {},
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.unit]);

    useEffect(() => {
        // When categories change, clear subcategory and below
        if (isInitializing) return;
        setFormData((prev) => ({
            ...prev,
            subcategory: [],
            division: [],
            variant: [],
            subcategoryDiscounts: {},
            divisionDiscounts: {},
            variantDiscounts: {},
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.category.join(',')]);

    useEffect(() => {
        // When subcategories change, clear division and below
        if (isInitializing) return;
        setFormData((prev) => ({
            ...prev,
            division: [],
            variant: [],
            divisionDiscounts: {},
            variantDiscounts: {},
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.subcategory.join(',')]);

    useEffect(() => {
        // When divisions change, clear variant
        if (isInitializing) return;
        setFormData((prev) => ({
            ...prev,
            variant: [],
            variantDiscounts: {},
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.division.join(',')]);

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Prefill when editing
    usePrefillProduct(isEdit, selectedProd, setIsInitializing, setFormData);

    // Existing pictures (edit mode) and removal tracking
    const [existingPictures, setExistingPictures] = useState<IProducts['pictures']>(selectedProd?.pictures || []);
    const [removePictureIds, setRemovePictureIds] = useState<string[]>([]);

    useEffect(() => {
        if (isEdit) {
            setExistingPictures((selectedProd?.pictures || []).map((p) => ({ ...p })));
            setRemovePictureIds([]);
        }
    }, [isEdit, selectedProd]);

    const toggleRemoveExistingPicture = (picId: string) => {
        setRemovePictureIds((prev) => (prev.includes(picId) ? prev.filter((id) => id !== picId) : [...prev, picId]));
    };

    const validateImage = (file: File): string | null => {
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        if (file.size > maxSize) {
            return `Image "${file.name}" is too large. Maximum size is 2MB.`;
        }

        if (!allowedTypes.includes(file.type)) {
            return `Image "${file.name}" has an invalid format. Only JPEG, PNG, GIF, and WebP are allowed.`;
        }

        return null;
    };

    const insertFormatting = (startTag: string, endTag: string) => {
        const textarea = descriptionRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);

        const newText = beforeText + startTag + selectedText + endTag + afterText;
        setFormData((prev) => ({ ...prev, description: newText }));

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleDiscountSourceChange = (type: 'subcategory' | 'division' | 'variant', selectedValue: string, source: string) => {
        const discountField = `${type}Discounts` as 'subcategoryDiscounts' | 'divisionDiscounts' | 'variantDiscounts';
        const priceMap =
            type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;

        setFormData((prev) => {
            const currentDiscounts = (prev[discountField] ?? {}) as Record<
                string,
                { source: string; value: string; base_price: number }
            >;
            const existing = currentDiscounts[selectedValue];
            const basePrice = existing?.base_price ?? priceMap[selectedValue] ?? 0;

            return {
                ...prev,
                [discountField]: {
                    ...currentDiscounts,
                    [selectedValue]: {
                        ...(existing ?? { source: '', value: '', base_price: basePrice }),
                        base_price: basePrice,
                        source,
                        value: '',
                    },
                },
            };
        });
    };

    const handleDiscountValueChange = (type: 'subcategory' | 'division' | 'variant', selectedValue: string, value: string) => {
        const discountField = `${type}Discounts` as 'subcategoryDiscounts' | 'divisionDiscounts' | 'variantDiscounts';
        const priceMap =
            type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;

        if (Number(value) <= 100) {
            setFormData((prev) => {
                const currentDiscounts = (prev[discountField] ?? {}) as Record<
                    string,
                    { source: string; value: string; base_price: number }
                >;
                const existing = currentDiscounts[selectedValue];
                const basePrice = existing?.base_price ?? priceMap[selectedValue] ?? 0;

                return {
                    ...prev,
                    [discountField]: {
                        ...currentDiscounts,
                        [selectedValue]: {
                            ...(existing ?? { source: 'manual', value: '', base_price: basePrice }),
                            base_price: basePrice,
                            value: value,
                        },
                    },
                };
            });
        }
    };

    const initializeDiscounts = (type: 'subcategory' | 'division' | 'variant', values: string[]) => {
        setFormData((prev) => {
            const currentDiscounts =
                type === 'subcategory' ? prev.subcategoryDiscounts : type === 'division' ? prev.divisionDiscounts : prev.variantDiscounts;

            const newDiscounts = { ...currentDiscounts };
            const priceMap =
                type === 'subcategory' ? subcatPriceById : type === 'division' ? divisionPriceById : variantPriceById;

            // Add new selections with default settings
            values.forEach((value) => {
                if (!newDiscounts[value]) {
                    newDiscounts[value] = { source: '', value: '', base_price: priceMap[value] ?? 0 };
                } else if (newDiscounts[value].base_price !== (priceMap[value] ?? 0)) {
                    newDiscounts[value] = {
                        ...newDiscounts[value],
                        base_price: priceMap[value] ?? 0,
                    };
                }
            });

            // Remove discounts for unselected values
            Object.keys(newDiscounts).forEach((key) => {
                if (!values.includes(key)) {
                    delete newDiscounts[key];
                }
            });

            return {
                ...prev,
                ...(type === 'subcategory' && { subcategoryDiscounts: newDiscounts }),
                ...(type === 'division' && { divisionDiscounts: newDiscounts }),
                ...(type === 'variant' && { variantDiscounts: newDiscounts }),
            };
        });
    };

    // Convert description with formatting tags to HTML for preview
    const formatDescriptionPreview = (text: string): string => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br />');
    };

    // Handle image upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Respect 5-image cap including existing kept images
        const existingKept = existingPictures.filter((p) => !removePictureIds.includes(p.id)).length;
        const totalImages = existingKept + formData.images.length + files.length;
        if (totalImages > 5) {
            setErrors((prev) => ({
                ...prev,
                images: `Maximum 5 images allowed. You can add only ${Math.max(0, 5 - (existingKept + formData.images.length))} more image(s).`,
            }));
            return;
        }

        // Validate each file
        const validationErrors: string[] = [];
        const validFiles: File[] = [];

        files.forEach((file) => {
            const error = validateImage(file);
            if (error) {
                validationErrors.push(error);
            } else {
                validFiles.push(file);
            }
        });

        if (validationErrors.length > 0) {
            setErrors((prev) => ({ ...prev, images: validationErrors.join(' ') }));
            return;
        }

        // Clear any previous errors
        setErrors((prev) => ({ ...prev, images: undefined }));

        // Update form data
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...validFiles],
        }));

        // Create previews for new images
        const newPreviews: string[] = [];
        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                newPreviews.push(reader.result as string);
                if (newPreviews.length === validFiles.length) {
                    setImagePreviews((prev) => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset the input value to allow selecting the same file again
        e.target.value = '';
    };

    // Remove image
    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));

        // Clear errors if any
        setErrors((prev) => ({ ...prev, images: undefined }));
    };

    // Handle form input changes
    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing/changing
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    // Format price to Rupiah
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    // Handle price input
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        handleInputChange('price', value);
    };

    // Handle price usd input
    const handlePriceUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        handleInputChange('product_usd_price', value);
    };

    // Calculate final price with discounts
    const calculateFinalPrice = () => {
        const basePrice = Number(formData.price) || 0;
        let finalPrice = basePrice;

        // Apply product discounts
        finalPrice = finalPrice - (basePrice * Number(formData.product_discount)) / 100;

        // Apply subcategory discounts based on selected source
        formData.subcategory.forEach((id) => {
            const d = formData.subcategoryDiscounts[id];
            if (!d) return;
            if (d.source === 'manual' && d.value) {
                finalPrice = finalPrice + (d.base_price - (d.base_price * Number(d.value)) / 100);
            } else if (d.source === id) {
                const def = subcatDiscountById[id] || 0;
                if (def > 0) finalPrice = finalPrice + (d.base_price - (d.base_price * Number(def)) / 100);
            }
        });

        // Apply division discounts
        formData.division.forEach((id) => {
            const d = formData.divisionDiscounts[id];
            if (!d) return;
            if (d.source === 'manual' && d.value) {
                finalPrice = finalPrice + (d.base_price - (d.base_price * Number(d.value)) / 100);
            } else if (d.source === id) {
                const def = divisionDiscountById[id] || 0;
                if (def > 0) finalPrice = finalPrice + (d.base_price - (d.base_price * Number(def)) / 100);
            }
        });

        // Apply variant discounts
        formData.variant.forEach((id) => {
            const d = formData.variantDiscounts[id];
            if (!d) return;
            if (d.source === 'manual' && d.value) {
                finalPrice = finalPrice + (d.base_price - (d.base_price * Number(d.value)) / 100);
            } else if (d.source === id) {
                const def = variantDiscountById[id] || 0;
                if (def > 0) finalPrice = finalPrice + (d.base_price - (d.base_price * Number(def)) / 100);
            }
        });

        return finalPrice;
    };

    // Handle form submission (integrated)
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.price) newErrors.price = 'Price is required';
        if (!formData.unit) newErrors.unit = 'Unit is required';
        // Only require new images for create; allow empty on edit
        if (!isEdit && formData.images.length === 0) newErrors.images = 'At least one image is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const fd = new FormData();
        fd.append('product_name', formData.name);
        fd.append('product_price', String(Number(formData.price)));
        fd.append('product_discount', formData.product_discount);
        fd.append('description', formData.description);
        fd.append('unit_id', formData.unit);
        fd.append('product_sku', formData.product_sku);
        fd.append('product_usd_price', formData.product_usd_price);
        fd.append('is_showcase', formData.is_showcase ? '1' : '0');

        formData.images.forEach((file) => fd.append('pictures[]', file));
        // Removing selected existing pictures on edit
        if (isEdit && removePictureIds.length > 0) {
            removePictureIds.forEach((id) => fd.append('remove_picture_ids[]', id));
        }
        formData.tags.forEach((id) => fd.append('tag_id[]', id));
        formData.category.forEach((id) => fd.append('categories[]', id));

        formData.subcategory.forEach((id, i) => {
            const d = formData.subcategoryDiscounts[id];
            const useDefault = d && d.source !== 'manual';
            fd.append(`sub_categories[${i}][id]`, id);
            if (useDefault) {
                fd.append(`sub_categories[${i}][use_subcategory_discount]`, '1');
                fd.append(`sub_categories[${i}][manual_discount]`, '0');
            } else {
                fd.append(`sub_categories[${i}][use_subcategory_discount]`, '0');
                fd.append(`sub_categories[${i}][manual_discount]`, String(Number(d?.value || 0)));
            }
        });

        formData.division.forEach((id, i) => {
            const d = formData.divisionDiscounts[id];
            const useDefault = d && d.source !== 'manual';
            fd.append(`divisions[${i}][id]`, id);
            if (useDefault) {
                fd.append(`divisions[${i}][use_division_discount]`, '1');
                fd.append(`divisions[${i}][manual_discount]`, '0');
            } else {
                fd.append(`divisions[${i}][use_division_discount]`, '0');
                fd.append(`divisions[${i}][manual_discount]`, String(Number(d?.value || 0)));
            }
        });

        formData.variant.forEach((id, i) => {
            const d = formData.variantDiscounts[id];
            const useDefault = d && d.source !== 'manual';
            fd.append(`variants[${i}][id]`, id);
            if (useDefault) {
                fd.append(`variants[${i}][use_variant_discount]`, '1');
                fd.append(`variants[${i}][manual_discount]`, '0');
            } else {
                fd.append(`variants[${i}][use_variant_discount]`, '0');
                fd.append(`variants[${i}][manual_discount]`, String(Number(d?.value || 0)));
            }
        });
        // Submit to create or update endpoint
        const targetRoute = isEdit ? route('product.edit-product', String(selectedProd?.id ?? '')) : route('product.add-product');
        router.post(targetRoute, fd, {
            forceFormData: true,
            onError: (err) => {
                const mapped: FormErrors = {};
                if ((err as any).product_name) mapped.name = (err as any).product_name as string;
                if ((err as any).product_price) mapped.price = (err as any).product_price as string;
                if ((err as any).description) mapped.description = (err as any).description as string;
                if ((err as any).unit_id) mapped.unit = (err as any).unit_id as string;
                if ((err as any).categories) mapped.category = (err as any).categories as string;
                if ((err as any).tag_id) mapped.tags = (err as any).tag_id as string;
                if ((err as any).is_showcase) mapped.is_showcase = (err as any).is_showcase as string;
                if (Object.keys(err as any).some((k) => k.startsWith('pictures'))) mapped.images = 'Invalid pictures uploaded';
                if (Object.keys(err as any).some((k) => k.startsWith('sub_categories'))) mapped.subcategory = 'Invalid subcategory selection';
                if (Object.keys(err as any).some((k) => k.startsWith('divisions'))) mapped.division = 'Invalid division selection';
                if (Object.keys(err as any).some((k) => k.startsWith('variants'))) mapped.variant = 'Invalid variant selection';
                setErrors(mapped);
            },
        });
    };

    const finalPrice = calculateFinalPrice();

    // Compute remaining slots and counts for UI
    const existingKeptCount = existingPictures.filter((p) => !removePictureIds.includes(p.id)).length;
    const remainingSlots = Math.max(0, 5 - (isEdit ? existingKeptCount + formData.images.length : formData.images.length));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="p-6">
                {/* Existing Images (Edit Mode) */}
                {isEdit && (
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium">Existing Images</label>
                        {existingPictures.length > 0 ? (
                            <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                                {existingPictures.map((pic) => {
                                    const marked = removePictureIds.includes(pic.id);
                                    return (
                                        <div
                                            key={pic.id}
                                            className={`group relative rounded-lg border ${marked ? 'opacity-60 ring-2 ring-red-400' : ''}`}
                                        >
                                            <img src={pic.url} alt={pic.id} className="h-24 w-24 rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => toggleRemoveExistingPicture(pic.id)}
                                                className={`absolute -top-2 -right-2 rounded-full px-2 py-1 text-xs font-medium shadow ${
                                                    marked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                                }`}
                                            >
                                                {marked ? 'Undo' : 'Remove'}
                                            </button>
                                            {marked && (
                                                <div className="absolute bottom-1 left-1 rounded bg-red-500 px-1 py-0.5 text-[10px] text-white">
                                                    To remove
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No existing images.</p>
                        )}
                        <p className="text-xs text-gray-500">You can mark images for removal. Total images allowed is 5 including any new uploads.</p>
                    </div>
                )}
                {/* Name Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Product Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.name ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter product name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* SKU Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">SKU *</label>
                    <input
                        type="text"
                        value={formData.product_sku}
                        onChange={(e) => handleInputChange('product_sku', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.product_sku ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter product SKU"
                    />
                    {errors.product_sku && <p className="mt-1 text-sm text-red-500">{errors.product_sku}</p>}
                </div>

                {/* Multiple Image Upload */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Product Images * (Max 5 images, under 2MB each)</label>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} alt={`Preview ${index + 1}`} className="h-24 w-24 rounded-lg border object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                    <div className="mt-1 truncate text-center text-xs text-gray-500">{formData.images[index]?.name}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Button - Only show if less than 5 images */}
                    {remainingSlots > 0 && (
                        <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-xs text-gray-500">Upload Images</p>
                            <p className="text-xs text-gray-400">{remainingSlots} remaining</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                multiple // Enable multiple file selection
                            />
                        </label>
                    )}

                    {/* Help text */}
                    <p className="mt-2 text-xs text-gray-500">
                        Select multiple images at once. Each image must be under 2MB. Supported formats: JPEG, PNG, GIF, WebP.
                    </p>

                    {/* Error display */}
                    {errors.images && <p className="mt-1 text-sm text-red-500">{errors.images}</p>}

                    {/* Image count display */}
                    {(formData.images.length > 0 || (isEdit && existingKeptCount > 0)) && (
                        <p className="mt-2 text-sm text-gray-600">
                            {isEdit ? existingKeptCount + formData.images.length : formData.images.length} of 5 images counted
                        </p>
                    )}
                </div>

                {/* Rich Text Description */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Description *</label>
                    <div className={`rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'}`}>
                        {/* Toolbar */}
                        <div className="flex space-x-2 border-b border-gray-200 p-2">
                            <button
                                type="button"
                                onClick={() => insertFormatting('**', '**')}
                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                title="Bold (wrap with **text**)"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertFormatting('*', '*')}
                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                title="Italic (wrap with *text*)"
                            >
                                <Italic size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertFormatting('__', '__')}
                                className="rounded p-2 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none"
                                title="Underline (wrap with __text__)"
                            >
                                <Underline size={16} />
                            </button>
                        </div>

                        {/* Textarea Editor */}
                        <textarea
                            ref={descriptionRef}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Enter product description... Use **bold**, *italic*, __underline__ for formatting"
                            className="min-h-[120px] w-full resize-none p-3 focus:outline-none"
                            rows={5}
                        />

                        {/* Preview */}
                        {formData.description && (
                            <div className="border-t border-gray-200 bg-gray-50 p-3">
                                <div className="mb-2 text-sm text-gray-600">Preview:</div>
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: formatDescriptionPreview(formData.description),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                    <p className="mt-1 text-xs text-gray-500">Formatting: **bold**, *italic*, __underline__</p>
                </div>

                {/* Price Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Price (Rupiah) *</label>
                    <div className="relative">
                        <span className="absolute top-2 left-3 text-gray-500">Rp</span>
                        <input
                            type="text"
                            value={formatRupiah(formData.price)}
                            onChange={handlePriceChange}
                            className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border py-2 pr-3 pl-12 shadow-sm focus:ring-2 focus:outline-none ${
                                errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0"
                        />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                {/* USD Price Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Price (USD) *</label>
                    <div className="relative">
                        <span className="absolute top-2 left-3 text-gray-500">$ </span>
                        <input
                            type="text"
                            value={formatRupiah(formData.product_usd_price)}
                            onChange={handlePriceUsdChange}
                            className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border py-2 pr-3 pl-12 shadow-sm focus:ring-2 focus:outline-none ${
                                errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0"
                        />
                    </div>
                    {errors.product_usd_price && <p className="mt-1 text-sm text-red-500">{errors.product_usd_price}</p>}
                </div>

                {/*  Product Discount Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Product Discount</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.product_discount}
                            onChange={(e) => handleInputChange('product_discount', e.target.value)}
                            className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                                errors.product_discount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter discount percentage"
                            maxLength={3}
                        />
                        <span className="absolute top-2 right-3 text-gray-500">%</span>
                    </div>
                </div>

                {/* Showcase Toggle */}
                <div className="mb-6">
                    <label htmlFor="is_showcase" className="mb-2 block text-sm font-medium">
                        Showcase Product
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            id="is_showcase"
                            type="checkbox"
                            checked={formData.is_showcase}
                            onChange={(e) => handleInputChange('is_showcase', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">Display this product on the showcase section.</span>
                    </div>
                    {errors.is_showcase && <p className="mt-1 text-sm text-red-500">{errors.is_showcase}</p>}
                </div>

                {/* Unit Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Unit *</label>
                    <select
                        value={formData.unit}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                                ...prev,
                                unit: val,
                                category: [],
                                subcategory: [],
                                division: [],
                                variant: [],
                                subcategoryDiscounts: {},
                                divisionDiscounts: {},
                                variantDiscounts: {},
                            }));
                        }}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.unit ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value={''}>Select Unit</option>
                        {units.length > 0 &&
                            units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                    </select>
                    {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit}</p>}
                </div>

                {/* Category Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Category *</label>
                    <MultiSelect
                        options={categoryOptions}
                        values={formData.category}
                        onChange={(values) => setFormData((prev) => ({ ...prev, category: values }))}
                        placeholder={formData.unit ? 'Select categories' : 'Select unit first'}
                        error={errors.category}
                        disabled={!formData.unit}
                    />
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {/* Sub Category Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Sub Category *</label>
                    <MultiSelect
                        options={subcategoryOptions}
                        values={formData.subcategory}
                        onChange={(values) => {
                            setFormData((prev) => ({ ...prev, subcategory: values }));
                            initializeDiscounts('subcategory', values);
                        }}
                        placeholder={formData.category.length ? 'Select subcategories' : 'Select category first'}
                        error={errors.subcategory}
                        disabled={formData.category.length === 0}
                    />
                    {errors.subcategory && <p className="mt-1 text-sm text-red-500">{errors.subcategory}</p>}
                </div>

                {/* Subcategory Discount */}
                {formData.subcategory.length > 0 && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3">
                            <label className="text-sm font-medium">Subcategory Discounts</label>
                        </div>

                        <div className="space-y-4">
                            {formData.subcategory.map((sub) => (
                                <div key={sub} className="rounded-md border border-blue-300 bg-white p-3">
                                    <div className="mb-2 text-sm font-medium">{subcatNameById[sub] || sub}</div>

                                    <div className="space-y-2">
                                        <div className="text-sm text-blue-600">
                                            <div className="mb-2">Choose discount source:</div>
                                            <div className="space-y-2">
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`subcategoryDiscountSource-${sub}`}
                                                        value={sub}
                                                        checked={formData.subcategoryDiscounts[sub]?.source === sub}
                                                        onChange={() => handleDiscountSourceChange('subcategory', sub, sub)}
                                                        className="text-blue-600"
                                                    />
                                                    <span>
                                                        Use "{subcatNameById[sub] || sub}" discount ({subcatDiscountById[sub] ?? 'N/A'}%)
                                                    </span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`subcategoryDiscountSource-${sub}`}
                                                        value="manual"
                                                        checked={formData.subcategoryDiscounts[sub]?.source === 'manual'}
                                                        onChange={() => handleDiscountSourceChange('subcategory', sub, 'manual')}
                                                        className="text-blue-600"
                                                    />
                                                    <span>Enter manually</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.subcategoryDiscounts[sub]?.value || ''}
                                                onChange={(e) => handleDiscountValueChange('subcategory', sub, e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter discount percentage"
                                                disabled={
                                                    formData.subcategoryDiscounts[sub]?.source !== 'manual' &&
                                                    formData.subcategoryDiscounts[sub]?.source !== ''
                                                }
                                                maxLength={3}
                                            />
                                            <span className="absolute top-2 right-3 text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Division Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Division *</label>
                    <MultiSelect
                        options={divisionOptions}
                        values={formData.division}
                        onChange={(values) => {
                            setFormData((prev) => ({ ...prev, division: values }));
                            initializeDiscounts('division', values);
                        }}
                        placeholder={formData.subcategory.length ? 'Select divisions' : 'Select subcategory first'}
                        error={errors.division}
                        disabled={formData.subcategory.length === 0}
                    />
                    {errors.division && <p className="mt-1 text-sm text-red-500">{errors.division}</p>}
                </div>

                {/* Division Discount */}
                {formData.division.length > 0 && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3">
                            <label className="text-sm font-medium">Division Discounts</label>
                        </div>

                        <div className="space-y-4">
                            {formData.division.map((div) => (
                                <div key={div} className="rounded-md border border-blue-300 bg-white p-3">
                                    <div className="mb-2 text-sm font-medium">{divisionNameById[div] || div}</div>

                                    <div className="space-y-2">
                                        <div className="text-sm text-blue-600">
                                            <div className="mb-2">Choose discount source:</div>
                                            <div className="space-y-2">
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`divisionDiscountSource-${div}`}
                                                        value={div}
                                                        checked={formData.divisionDiscounts[div]?.source === div}
                                                        onChange={() => handleDiscountSourceChange('division', div, div)}
                                                        className="text-blue-600"
                                                    />
                                                    <span>
                                                        Use "{divisionNameById[div] || div}" discount ({divisionDiscountById[div] ?? 'N/A'}%)
                                                    </span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`divisionDiscountSource-${div}`}
                                                        value="manual"
                                                        checked={formData.divisionDiscounts[div]?.source === 'manual'}
                                                        onChange={() => handleDiscountSourceChange('division', div, 'manual')}
                                                        className="text-blue-600"
                                                    />
                                                    <span>Enter manually</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.divisionDiscounts[div]?.value || ''}
                                                onChange={(e) => handleDiscountValueChange('division', div, e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter discount percentage"
                                                disabled={
                                                    formData.divisionDiscounts[div]?.source !== 'manual' &&
                                                    formData.divisionDiscounts[div]?.source !== ''
                                                }
                                                maxLength={3}
                                            />
                                            <span className="absolute top-2 right-3 text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variant Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Variant *</label>
                    <MultiSelect
                        options={variantOptions}
                        values={formData.variant}
                        onChange={(values) => {
                            setFormData((prev) => ({ ...prev, variant: values }));
                            initializeDiscounts('variant', values);
                        }}
                        placeholder={formData.division.length ? 'Select variants' : 'Select division first'}
                        error={errors.variant}
                        disabled={formData.division.length === 0}
                    />
                    {errors.variant && <p className="mt-1 text-sm text-red-500">{errors.variant}</p>}
                </div>

                {formData.variant.length > 0 && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3">
                            <label className="text-sm font-medium">Variant Discounts</label>
                        </div>

                        <div className="space-y-4">
                            {formData.variant.map((variant) => (
                                <div key={variant} className="rounded-md border border-blue-300 bg-white p-3">
                                    <div className="mb-2 text-sm font-medium">{variantNameById[variant] || variant}</div>

                                    <div className="space-y-2">
                                        <div className="text-sm text-blue-600">
                                            <div className="mb-2">Choose discount source:</div>
                                            <div className="space-y-2">
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`variantDiscountSource-${variant}`}
                                                        value={variant}
                                                        checked={formData.variantDiscounts[variant]?.source === variant}
                                                        onChange={() => handleDiscountSourceChange('variant', variant, variant)}
                                                        className="text-blue-600"
                                                    />
                                                    <span>
                                                        Use "{variantNameById[variant] || variant}" discount ({variantDiscountById[variant] ?? 'N/A'}
                                                        %)
                                                    </span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`variantDiscountSource-${variant}`}
                                                        value="manual"
                                                        checked={formData.variantDiscounts[variant]?.source === 'manual'}
                                                        onChange={() => handleDiscountSourceChange('variant', variant, 'manual')}
                                                        className="text-blue-600"
                                                    />
                                                    <span>Enter manually</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.variantDiscounts[variant]?.value || ''}
                                                onChange={(e) => handleDiscountValueChange('variant', variant, e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter discount percentage"
                                                disabled={
                                                    formData.variantDiscounts[variant]?.source !== 'manual' &&
                                                    formData.variantDiscounts[variant]?.source !== ''
                                                }
                                                maxLength={3}
                                            />
                                            <span className="absolute top-2 right-3 text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Tags *</label>
                    <MultiSelect
                        options={tagOptions}
                        values={formData.tags}
                        onChange={(values) => {
                            handleInputChange('tags', values);
                        }}
                        placeholder="Select tags"
                        error={errors.tags}
                    />
                    {errors.tags && <p className="mt-1 text-sm text-red-500">{errors.tags}</p>}
                </div>

                {/* Price Summary */}
                {formData.price && (
                    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-3 font-medium">Price Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Base Price:</span>
                                <span>Rp {formatRupiah(formData.price)}</span>
                            </div>

                            {/* Product Discounts */}
                            {formData.product_discount && (
                                <div className="flex justify-between text-orange-600">
                                    <span>
                                        Product Discount {formData.product_discount}% (-Rp{' '}
                                        {formatRupiah(String((Number(formData.price) * Number(formData.product_discount)) / 100))})
                                    </span>
                                </div>
                            )}

                            {/* Subcategory discounts */}
                            {formData.subcategory.map((id) => {
                                const d = formData.subcategoryDiscounts[id];
                                console.log(d);
                                const applied = d?.source === 'manual' ? Number(d.value || 0) : d?.source === id ? subcatDiscountById[id] || 0 : 0;
                                return applied ? (
                                    <div key={id} className="flex justify-between text-blue-600">
                                        <span>
                                            {subcatNameById[id] || id}
                                            <br />
                                            Rp. {formatRupiah(d.base_price.toString())}
                                            <br />
                                            Discount {applied}% ( -Rp {formatRupiah(String((Number(d.base_price) * applied) / 100))})
                                        </span>
                                        <span>Rp {formatRupiah(String(d.base_price - (Number(d.base_price) * applied) / 100))}</span>
                                    </div>
                                ) : null;
                            })}

                            {/* Division discounts */}
                            {formData.division.map((id) => {
                                const d = formData.divisionDiscounts[id];
                                const applied = d?.source === 'manual' ? Number(d.value || 0) : d?.source === id ? divisionDiscountById[id] || 0 : 0;
                                return applied ? (
                                    <div key={id} className="flex justify-between text-green-600">
                                        <span>
                                            {divisionNameById[id] || id}
                                            <br />
                                            Rp. {formatRupiah(d.base_price.toString())}
                                            <br />
                                            Discount {applied}% ( -Rp {formatRupiah(String((Number(d.base_price) * applied) / 100))})
                                        </span>
                                        <span>Rp {formatRupiah(String(d.base_price - (Number(d.base_price) * applied) / 100))}</span>
                                    </div>
                                ) : null;
                            })}

                            {/* Variant discounts */}
                            {formData.variant.map((id) => {
                                const d = formData.variantDiscounts[id];
                                const applied = d?.source === 'manual' ? Number(d.value || 0) : d?.source === id ? variantDiscountById[id] || 0 : 0;
                                return applied ? (
                                    <div key={id} className="flex justify-between text-purple-600">
                                        <span>
                                            {variantNameById[id] || id}
                                            <br />
                                            Rp. {formatRupiah(d.base_price.toString())}
                                            <br />
                                            Discount {applied}% ( -Rp {formatRupiah(String((Number(d.base_price) * applied) / 100))})
                                        </span>
                                        <span>Rp {formatRupiah(String(d.base_price - (Number(d.base_price) * applied) / 100))}</span>
                                    </div>
                                ) : null;
                            })}

                            <hr className="my-2" />
                            <div className="flex justify-between font-medium">
                                <span>Final Price:</span>
                                <span>Rp {formatRupiah(String(Math.round(finalPrice)))}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                                Total discount: Rp {formatRupiah(String(Math.round(finalPrice) - Number(formData.price)))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <form onSubmit={handleSubmit} className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        className="bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80"
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Button type="submit">{isEdit ? 'Edit' : 'Create'} Product</Button>
                </form>
            </div>
        </AppLayout>
    );
}

// Prefill form when editing
// This effect is placed after component to ensure helpers exist
export function usePrefillProduct(
    isEdit: boolean,
    selectedProd: IProducts | undefined,
    setIsInitializing: React.Dispatch<React.SetStateAction<boolean>>,
    setFormData: React.Dispatch<React.SetStateAction<FormData>>,
) {
    useEffect(() => {
        if (!isEdit || !selectedProd) return;

        setIsInitializing(true);
        // Build discount maps defaulting to using each entity's default discount
        const subDiscounts: Record<string, { source: string; value: string; base_price: number }> = {};
        const divDiscounts: Record<string, { source: string; value: string; base_price: number }> = {};
        const varDiscounts: Record<string, { source: string; value: string; base_price: number }> = {};

        (selectedProd.subcategories || []).forEach((s) => {
            subDiscounts[s.id] = {
                source: s.pivot.use_subcategory_discount === 1 ? s.id : 'manual',
                value: s.pivot.use_subcategory_discount === 1 ? '' : s.pivot.manual_discount.toString(),
                base_price: s.price,
            };
        });
        (selectedProd.divisions || []).forEach((d) => {
            divDiscounts[d.id] = {
                source: d.pivot.use_division_discount === 1 ? d.id : 'manual',
                value: d.pivot.use_division_discount === 1 ? '' : d.pivot.manual_discount.toString(),
                base_price: d.price,
            };
        });
        (selectedProd.variants || []).forEach((v) => {
            varDiscounts[v.id] = {
                source: v.pivot.use_variant_discount === 1 ? v.id : 'manual',
                value: v.pivot.use_variant_discount === 1 ? '' : v.pivot.manual_discount.toString(),
                base_price: v.price,
            };
        });

        setFormData((prev) => ({
            ...prev,
            product_sku: selectedProd.product_sku || '',
            product_usd_price: String(selectedProd.product_usd_price) || '',
            name: selectedProd.product_name || '',
            description: selectedProd.description || '',
            price: String(selectedProd.product_price ?? ''),
            product_discount: String(selectedProd.product_discount ?? ''),
            unit: selectedProd.unit_id || '',
            category: (selectedProd.categories || []).map((c) => c.id),
            subcategory: (selectedProd.subcategories || []).map((s) => s.id),
            division: (selectedProd.divisions || []).map((d) => d.id),
            variant: (selectedProd.variants || []).map((v) => v.id),
            tags: (selectedProd.tags || []).map((t) => t.id),
            subcategoryDiscounts: subDiscounts,
            divisionDiscounts: divDiscounts,
            variantDiscounts: varDiscounts,
            is_showcase: Boolean(selectedProd.is_showcase),
            // images left empty; existing pictures handled server-side
        }));

        // Allow reset effects after single batch update
        // Small timeout to ensure dependent effects skip this cycle
        setTimeout(() => setIsInitializing(false), 0);
    }, [isEdit, selectedProd, setFormData, setIsInitializing]);
}
