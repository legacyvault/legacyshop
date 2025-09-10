import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface FormData {
    type: 'text' | 'color' | '';
    name: string;
    colorValue: string;
    description: string;
    price: string;
    discount: string;
    division: string;
}

interface FormErrors {
    type?: string;
    name?: string;
    colorValue?: string;
    description?: string;
    price?: string;
    discount?: string;
    division?: string;
}

export default function AddVariant() {
    const { props } = usePage();
    const product = props.product;
    const isEdit = !!product;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Variant`,
            href: '/products/variant/addvar',
        },
    ];

    const [formData, setFormData] = useState<FormData>({
        type: '',
        name: '',
        colorValue: '#000000',
        description: '',
        price: '',
        discount: '',
        division: '',
    });

    const [errors, setErrors] = useState<FormErrors>({});

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

    // Handle form submission
    const handleSubmit = () => {
        const submitData = {
            ...formData,
            // Use the appropriate value based on type
            value: formData.type === 'color' ? formData.colorValue : formData.name,
            price: Number(formData.price),
            discount: Number(formData.discount) || 0,
        };

        console.log('Form submitted:', submitData);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="p-6">
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
                        <option value="text">Text</option>
                        <option value="color">Color</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                </div>

                {/* Name Field - Always visible */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.name ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Color Value Field - Only visible when type is 'color' */}
                {formData.type === 'color' && (
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium">Color Value *</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={formData.colorValue}
                                onChange={(e) => handleInputChange('colorValue', e.target.value)}
                                className="h-10 w-16 cursor-pointer rounded-md border border-gray-300"
                            />
                            <input
                                type="text"
                                value={formData.colorValue}
                                onChange={(e) => handleInputChange('colorValue', e.target.value)}
                                className={`flex-1 rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                    errors.colorValue ? 'border-red-500' : 'border-gray-200'
                                }`}
                                placeholder="#000000"
                                pattern="^#[0-9A-Fa-f]{6}$"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Click the color box to open color picker or enter hex code manually</p>
                        {errors.colorValue && <p className="mt-1 text-sm text-red-500">{errors.colorValue}</p>}
                    </div>
                )}

                {/* Description Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Description *</label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.description ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter description"
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
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
                        <option value="pokemon">Division 1</option>
                        <option value="one piece">Division 2</option>
                    </select>
                    {errors.division && <p className="mt-1 text-sm text-red-500">{errors.division}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        className="bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80"
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Button onClick={handleSubmit}>{isEdit ? 'Edit' : 'Create'}</Button>
                </div>
            </div>
        </AppLayout>
    );
}
