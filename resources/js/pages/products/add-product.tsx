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
    discount: string;
    qty: string;
    category: string;
    type: string;
}

interface FormErrors {
    name?: string;
    image?: string;
    description?: string;
    price?: string;
    discount?: string;
    qty?: string;
    category?: string;
    type?: string;
}

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
        discount: '',
        qty: '',
        category: '',
        type: '',
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

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.image) newErrors.image = 'Image is required';
        if (!formData.price) newErrors.price = 'Price is required';
        if (!formData.qty) newErrors.qty = 'Quantity is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.type) newErrors.type = 'Type is required';

        if (!formData.description.trim()) newErrors.description = 'Description is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
        if (!validateForm()) return;

        const submitData = {
            ...formData,
            price: Number(formData.price),
            discount: Number(formData.discount) || 0,
            qty: Number(formData.qty),
        };

        console.log('Form submitted:', submitData);
        // Here you would typically send the data to your backend
        alert('Form submitted successfully! Check console for data.');
    };

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

                {/* Discount Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Discount (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                        className="focus:border-border-primary focus:ring-border-primary w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:outline-none"
                        placeholder="0"
                    />
                </div>

                {/* Quantity Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Quantity *</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.qty}
                        onChange={(e) => handleInputChange('qty', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.qty ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1"
                    />
                    {errors.qty && <p className="mt-1 text-sm text-red-500">{errors.qty}</p>}
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

                {/* Type Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Type *</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.type ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select type</option>
                        <option value="case">Case</option>
                        <option value="extended art">Extended Art</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <Button onClick={handleSubmit}>{isEdit ? 'Edit' : 'Create'} Product</Button>
                </div>
            </div>
        </AppLayout>
    );
}
