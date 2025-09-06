import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Bold, Italic, Underline, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FormData {
    name: string;
    image: File | null;
    description: string;
    price: string;
    unit: string;
    category: string;
    subcategory: string;
    division: string;
    variant: string;
    // Discount options
    useSubcategoryDiscount: boolean;
    subcategoryDiscountValue: string;
    useDivisionDiscount: boolean;
    divisionDiscountValue: string;
    useVariantDiscount: boolean;
    variantDiscountValue: string;
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
    // Discount options
    useSubcategoryDiscount?: boolean;
    subcategoryDiscountValue?: string;
    useDivisionDiscount?: boolean;
    divisionDiscountValue?: string;
    useVariantDiscount?: boolean;
    variantDiscountValue?: string;
}

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
        category: '',
        subcategory: '',
        division: '',
        variant: '',
        useSubcategoryDiscount: false,
        subcategoryDiscountValue: '',
        useDivisionDiscount: false,
        divisionDiscountValue: '',
        useVariantDiscount: false,
        variantDiscountValue: '',
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

        setFormData((prev) => {
            const newData: any = { ...prev, [useField]: checked };

            const selectedOption = prev[type as keyof FormData] as string;
            const predefinedValue = DISCOUNT_VALUES[type][selectedOption];
            if (predefinedValue) {
                newData[valueField] = predefinedValue;
            }
            return newData;
        });
    };

    // Calculate final price with discounts
    const calculateFinalPrice = () => {
        const basePrice = Number(formData.price) || 0;
        let finalPrice = basePrice;

        if (formData.subcategoryDiscountValue) {
            finalPrice = finalPrice * (1 - Number(formData.subcategoryDiscountValue) / 100);
        }

        if (formData.divisionDiscountValue) {
            finalPrice = finalPrice * (1 - Number(formData.divisionDiscountValue) / 100);
        }

        if (formData.variantDiscountValue) {
            finalPrice = finalPrice * (1 - Number(formData.variantDiscountValue) / 100);
        }

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

                {/* Category Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Category *</label>
                    <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select category</option>
                        <option value="pokemon">Pokemon</option>
                        <option value="one piece">One Piece</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {/* Sub Category Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Sub Category *</label>
                    <select
                        value={formData.subcategory}
                        onChange={(e) => handleInputChange('subcategory', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.subcategory ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Sub Category</option>
                        <option value="subcategory 1">subcategory 1</option>
                        <option value="subcategory 2">subcategory 2</option>
                    </select>
                    {errors.subcategory && <p className="mt-1 text-sm text-red-500">{errors.subcategory}</p>}
                </div>

                {/* Subcategory Discount */}
                {formData.subcategory && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium">Subcategory Discount</label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.useSubcategoryDiscount}
                                    onChange={(e) => handleDiscountToggle('subcategory', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Use Sub Category discount</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <span>Predefined discount for "{formData.subcategory}":</span>
                                <span className="font-medium">{DISCOUNT_VALUES.subcategory[formData.subcategory] || 'N/A'}%</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.subcategoryDiscountValue}
                                    onChange={(e) => handleDiscountChange('subcategoryDiscountValue', e)}
                                    className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter discount percentage"
                                    disabled={formData.useSubcategoryDiscount}
                                    maxLength={3}
                                />
                                <span className="absolute top-2 right-3 text-gray-500">%</span>
                            </div>
                            {errors.subcategoryDiscountValue && <p className="text-sm text-red-500">{errors.subcategoryDiscountValue}</p>}
                        </div>
                    </div>
                )}

                {/* Division Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Division *</label>
                    <select
                        value={formData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.division ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Division</option>
                        <option value="division 1">division 1</option>
                        <option value="division 2">division 2</option>
                    </select>
                    {errors.division && <p className="mt-1 text-sm text-red-500">{errors.division}</p>}
                </div>

                {/* Division Discount */}
                {formData.division && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium">Division Discount</label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.useDivisionDiscount}
                                    onChange={(e) => handleDiscountToggle('division', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Use division discount</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <span>Predefined discount for "{formData.division}":</span>
                                <span className="font-medium">{DISCOUNT_VALUES.division[formData.division] || 'N/A'}%</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.divisionDiscountValue}
                                    onChange={(e) => handleDiscountChange('divisionDiscountValue', e)}
                                    className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter discount percentage"
                                    disabled={formData.useDivisionDiscount}
                                    maxLength={3}
                                />
                                <span className="absolute top-2 right-3 text-gray-500">%</span>
                            </div>
                            {errors.divisionDiscountValue && <p className="text-sm text-red-500">{errors.divisionDiscountValue}</p>}
                        </div>
                    </div>
                )}

                {/* Variant Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Variant *</label>
                    <select
                        value={formData.variant}
                        onChange={(e) => handleInputChange('variant', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.variant ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Variant</option>
                        <option value="variant 1">variant 1</option>
                        <option value="variant 2">variant 2</option>
                    </select>
                    {errors.variant && <p className="mt-1 text-sm text-red-500">{errors.variant}</p>}
                </div>

                {/* Variant Discount */}
                {formData.variant && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium">Variant Discount</label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.useVariantDiscount}
                                    onChange={(e) => handleDiscountToggle('variant', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Use variant discount</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <span>Predefined discount for "{formData.variant}":</span>
                                <span className="font-medium">{DISCOUNT_VALUES.variant[formData.variant] || 'N/A'}%</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.variantDiscountValue}
                                    onChange={(e) => handleDiscountChange('variantDiscountValue', e)}
                                    className="w-full rounded-md border border-blue-300 px-3 py-2 pr-8 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter discount percentage"
                                    disabled={formData.useVariantDiscount}
                                    maxLength={3}
                                />
                                <span className="absolute top-2 right-3 text-gray-500">%</span>
                            </div>
                            {errors.variantDiscountValue && <p className="text-sm text-red-500">{errors.variantDiscountValue}</p>}
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
                            {formData.subcategoryDiscountValue && (
                                <div className="flex justify-between text-blue-600">
                                    <span>Subcategory Discount ({formData.subcategoryDiscountValue}%):</span>
                                    <span>
                                        -Rp {formatRupiah(String((Number(formData.price) * Number(formData.subcategoryDiscountValue)) / 100))}
                                    </span>
                                </div>
                            )}
                            {formData.divisionDiscountValue && (
                                <div className="flex justify-between text-green-600">
                                    <span>Division Discount ({formData.divisionDiscountValue}%):</span>
                                    <span>-Rp {formatRupiah(String((Number(formData.price) * Number(formData.divisionDiscountValue)) / 100))}</span>
                                </div>
                            )}
                            {formData.variantDiscountValue && (
                                <div className="flex justify-between text-purple-600">
                                    <span>Variant Discount ({formData.variantDiscountValue}%):</span>
                                    <span>-Rp {formatRupiah(String((Number(formData.price) * Number(formData.variantDiscountValue)) / 100))}</span>
                                </div>
                            )}
                            <hr className="my-2" />
                            <div className="flex justify-between font-medium">
                                <span>Final Price:</span>
                                <span className={hasDiscount ? 'text-green-600' : ''}>Rp {formatRupiah(String(Math.round(finalPrice)))}</span>
                            </div>
                            {hasDiscount && (
                                <div className="text-xs text-gray-500">
                                    Discount price: Rp {formatRupiah(String(Number(formData.price) - Math.round(finalPrice)))}
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
