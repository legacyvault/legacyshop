import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Bold, ChevronDown, Italic, Underline, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FormData {
    name: string;
    image: File | null;
    description: string;
    price: string;
    unit: string;
    category: string[];
    subcategory: string[];
    division: string[];
    variant: string[];
    // New discount structure - each value has its own discount settings
    subcategoryDiscounts: Record<string, { source: string; value: string }>; // e.g., { "subcategory 1": { source: "subcategory 1", value: "10" } }
    divisionDiscounts: Record<string, { source: string; value: string }>;
    variantDiscounts: Record<string, { source: string; value: string }>;
}

interface FormErrors {
    name?: string;
    image?: string;
    description?: string;
    price?: string;
    unit?: string;
    category?: string;
    subcategory?: string;
    division?: string;
    variant?: string;
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
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, values, onChange, placeholder, error }) => {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                    error ? 'border-red-500' : 'border-gray-300'
                }`}
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

            {isOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => toggleOption(option.value)}
                            className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 ${
                                values.includes(option.value) ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                        >
                            <input type="checkbox" checked={values.includes(option.value)} onChange={() => {}} className="pointer-events-none" />
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Dummy discount values for each option
const DISCOUNT_VALUES: {
    subcategory: Record<string, string>;
    division: Record<string, string>;
    variant: Record<string, string>;
} = {
    subcategory: {
        'subcategory 1': '10',
        'subcategory 2': '15',
    },
    division: {
        'division 1': '5',
        'division 2': '8',
    },
    variant: {
        'variant 1': '12',
        'variant 2': '20',
    },
};

// Options for multi-selects
const OPTIONS = {
    category: [
        { value: 'pokemon', label: 'Pokemon' },
        { value: 'one piece', label: 'One Piece' },
        { value: 'naruto', label: 'Naruto' },
        { value: 'dragon ball', label: 'Dragon Ball' },
    ],
    subcategory: [
        { value: 'subcategory 1', label: 'Subcategory 1' },
        { value: 'subcategory 2', label: 'Subcategory 2' },
    ],
    division: [
        { value: 'division 1', label: 'Division 1' },
        { value: 'division 2', label: 'Division 2' },
    ],
    variant: [
        { value: 'variant 1', label: 'Variant 1' },
        { value: 'variant 2', label: 'Variant 2' },
    ],
};

export default function AddProduct() {
    const { props } = usePage();
    const product = props.product;
    const isEdit = !!product;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Product`,
            href: '/add-product',
        },
    ];

    const [formData, setFormData] = useState<FormData>({
        name: '',
        image: null,
        description: '',
        price: '',
        unit: '',
        category: [],
        subcategory: [],
        division: [],
        variant: [],
        subcategoryDiscounts: {},
        divisionDiscounts: {},
        variantDiscounts: {},
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

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

        setFormData((prev) => ({
            ...prev,
            [discountField]: {
                ...(prev[discountField] ?? {}), // ✅ ensure object
                [selectedValue]: {
                    source,
                    value: source === 'manual' ? '' : DISCOUNT_VALUES[type][selectedValue] || '',
                },
            },
        }));
    };

    const handleDiscountValueChange = (type: 'subcategory' | 'division' | 'variant', selectedValue: string, value: string) => {
        const discountField = `${type}Discounts` as 'subcategoryDiscounts' | 'divisionDiscounts' | 'variantDiscounts';

        if (Number(value) <= 100) {
            setFormData((prev) => ({
                ...prev,
                [discountField]: {
                    ...prev[discountField],
                    [selectedValue]: {
                        ...prev[discountField][selectedValue],
                        value: value,
                    },
                },
            }));
        }
    };

    const initializeDiscounts = (type: 'subcategory' | 'division' | 'variant', values: string[]) => {
        setFormData((prev) => {
            const currentDiscounts =
                type === 'subcategory' ? prev.subcategoryDiscounts : type === 'division' ? prev.divisionDiscounts : prev.variantDiscounts;

            const newDiscounts = { ...currentDiscounts };

            // Add new selections with default settings
            values.forEach((value) => {
                if (!newDiscounts[value]) {
                    newDiscounts[value] = { source: '', value: '' };
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
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));

            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image
    const removeImage = () => {
        setFormData((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
    };

    // Handle form input changes
    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
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

    // Handle discount percentage input
    const handleDiscountChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (Number(value) <= 100) {
            handleInputChange(field as keyof FormData, value);
        }
    };

    // Handle discount toggle and auto-populate value
    const handleDiscountToggle = (type: 'subcategory' | 'division' | 'variant', checked: boolean) => {
        const useField = `use${type.charAt(0).toUpperCase() + type.slice(1)}Discount` as keyof FormData;
        const valueField = `${type}DiscountValue` as keyof FormData;
        const selectedField = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Discount` as keyof FormData;

        setFormData((prev) => {
            const newData: any = { ...prev, [useField]: checked };

            if (checked) {
                // Reset selected discount and value when toggling on
                newData[selectedField] = '';
                newData[valueField] = '';
            }

            return newData;
        });
    };

    const handleDiscountSelection = (type: 'subcategory' | 'division' | 'variant', selectedOption: string) => {
        const valueField = `${type}DiscountValue` as keyof FormData;
        const selectedField = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Discount` as keyof FormData;

        setFormData((prev) => ({
            ...prev,
            [selectedField]: selectedOption,
            [valueField]: selectedOption === 'manual' ? '' : DISCOUNT_VALUES[type][selectedOption] || '',
        }));
    };

    // Calculate final price with discounts
    const calculateFinalPrice = () => {
        const basePrice = Number(formData.price) || 0;
        let finalPrice = basePrice;

        // Apply subcategory discounts
        Object.values(formData.subcategoryDiscounts).forEach((discount) => {
            if (discount.value) {
                finalPrice = finalPrice * (1 - Number(discount.value) / 100);
            }
        });

        // Apply division discounts
        Object.values(formData.divisionDiscounts).forEach((discount) => {
            if (discount.value) {
                finalPrice = finalPrice * (1 - Number(discount.value) / 100);
            }
        });

        // Apply variant discounts
        Object.values(formData.variantDiscounts).forEach((discount) => {
            if (discount.value) {
                finalPrice = finalPrice * (1 - Number(discount.value) / 100);
            }
        });

        return finalPrice;
    };

    // Handle form submission
    const handleSubmit = () => {
        const submitData = {
            ...formData,
            price: Number(formData.price),
            finalPrice: calculateFinalPrice(),
        };

        console.log('Form submitted:', submitData);
        // Here you would typically send the data to your backend
        alert('Form submitted successfully! Check console for data.');
    };

    const finalPrice = calculateFinalPrice();
    const hasDiscount = finalPrice < Number(formData.price || 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="p-6">
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

                {/* Image Upload */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Product Image *</label>
                    <div className="space-y-3">
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="h-32 w-32 rounded-lg border object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                                <Upload className="h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-xs text-gray-500">Upload Image</p>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                    {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image as string}</p>}
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

                {/* Unit Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Unit *</label>
                    <select
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.unit ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Unit</option>
                        <option value="pokemon">Unit 1</option>
                        <option value="one piece">Unit 2</option>
                    </select>
                    {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit}</p>}
                </div>

                {/* Category Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Category *</label>
                    <MultiSelect
                        options={OPTIONS.category}
                        values={formData.category}
                        onChange={(values) => handleInputChange('category', values)}
                        placeholder="Select categories"
                        error={errors.category}
                    />
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {/* Sub Category Multi-Select */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Sub Category *</label>
                    <MultiSelect
                        options={OPTIONS.subcategory}
                        values={formData.subcategory}
                        onChange={(values) => {
                            handleInputChange('subcategory', values);
                            initializeDiscounts('subcategory', values);
                        }}
                        placeholder="Select subcategories"
                        error={errors.subcategory}
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
                                    <div className="mb-2 text-sm font-medium">{sub}</div>

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
                                                        Use "{sub}" discount ({DISCOUNT_VALUES.subcategory[sub] || 'N/A'}%)
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
                        options={OPTIONS.division}
                        values={formData.division}
                        onChange={(values) => {
                            handleInputChange('division', values);
                            initializeDiscounts('division', values);
                        }}
                        placeholder="Select divisions"
                        error={errors.division}
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
                                    <div className="mb-2 text-sm font-medium">{div}</div>

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
                                                        Use "{div}" discount ({DISCOUNT_VALUES.division[div] || 'N/A'}%)
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
                        options={OPTIONS.variant}
                        values={formData.variant}
                        onChange={(values) => {
                            handleInputChange('variant', values);
                            initializeDiscounts('variant', values);
                        }}
                        placeholder="Select variants"
                        error={errors.variant}
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
                                    <div className="mb-2 text-sm font-medium">{variant}</div>

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
                                                        Use "{variant}" discount ({DISCOUNT_VALUES.variant[variant] || 'N/A'}%)
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

                {/* Price Summary */}
                {formData.price && (
                    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-3 font-medium">Price Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Base Price:</span>
                                <span>Rp {formatRupiah(formData.price)}</span>
                            </div>

                            {/* Subcategory discounts */}
                            {Object.entries(formData.subcategoryDiscounts).map(
                                ([key, discount]) =>
                                    discount.value && (
                                        <div key={key} className="flex justify-between text-blue-600">
                                            <span>
                                                {key} Discount ({discount.value}%):
                                            </span>
                                            <span>-Rp {formatRupiah(String((Number(formData.price) * Number(discount.value)) / 100))}</span>
                                        </div>
                                    ),
                            )}

                            {/* Division discounts */}
                            {Object.entries(formData.divisionDiscounts).map(
                                ([key, discount]) =>
                                    discount.value && (
                                        <div key={key} className="flex justify-between text-green-600">
                                            <span>
                                                {key} Discount ({discount.value}%):
                                            </span>
                                            <span>-Rp {formatRupiah(String((Number(formData.price) * Number(discount.value)) / 100))}</span>
                                        </div>
                                    ),
                            )}

                            {/* Variant discounts */}
                            {Object.entries(formData.variantDiscounts).map(
                                ([key, discount]) =>
                                    discount.value && (
                                        <div key={key} className="flex justify-between text-purple-600">
                                            <span>
                                                {key} Discount ({discount.value}%):
                                            </span>
                                            <span>-Rp {formatRupiah(String((Number(formData.price) * Number(discount.value)) / 100))}</span>
                                        </div>
                                    ),
                            )}

                            <hr className="my-2" />
                            <div className="flex justify-between font-medium">
                                <span>Final Price:</span>
                                <span className={hasDiscount ? 'text-green-600' : ''}>Rp {formatRupiah(String(Math.round(finalPrice)))}</span>
                            </div>
                            {hasDiscount && (
                                <div className="text-xs text-gray-500">
                                    Total discount: Rp {formatRupiah(String(Number(formData.price) - Math.round(finalPrice)))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        className="bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80"
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Button onClick={handleSubmit}>{isEdit ? 'Edit' : 'Create'} Product</Button>
                </div>
            </div>
        </AppLayout>
    );
}
