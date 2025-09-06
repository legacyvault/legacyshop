import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface FormData {
    name: string;
    description: string;
    price: string;
    discount: string;
    unit: string;
    category: string;
}

interface FormErrors {
    name?: string;
    description?: string;
    price?: string;
    discount?: string;
    unit?: string;
    category?: string;
}

export default function AddSubCategory() {
    const { props } = usePage();
    const product = props.product;
    const isEdit = !!product;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Sub Category`,
            href: '/products/subcategory/addsub',
        },
    ];

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        price: '',
        discount: '',
        unit: '',
        category: '',
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
            price: Number(formData.price),
            discount: Number(formData.discount) || 0,
        };

        console.log('Form submitted:', submitData);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="p-6">
                {/* Name Field */}
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

                {/* Description Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Description *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.name ? 'border-red-500' : 'border-gray-200'
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
                        <option value="pokemon">Category 1</option>
                        <option value="one piece">Category 2</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
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
