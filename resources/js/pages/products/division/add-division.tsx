import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IDivisions, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';

interface FormData {
    id: string | null;
    name: string;
    description: string;
    price: number;
    usd_price: number;
    discount: number;
    sub_category_id: string;
}

export default function AddDivision() {
    const { id, division, subcats } = usePage<SharedData>().props;

    const isEdit = !!id;

    const selectedDivision: IDivisions = division as IDivisions;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Option`,
            href: '/products/division/adddiv',
        },
    ];

    const { data, setData, post, errors } = useForm<Required<FormData>>({
        id: isEdit ? selectedDivision.id : null,
        name: isEdit ? selectedDivision.name : '',
        description: isEdit ? selectedDivision.description : '',
        sub_category_id: isEdit ? selectedDivision.sub_category_id : '',
        price: isEdit ? selectedDivision.price : 0,
        usd_price: isEdit ? selectedDivision.usd_price : 0,
        discount: isEdit ? selectedDivision.discount : 0,
    });

    // Format price to Rupiah
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatUsd = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('en-US').format(Number(number));
    };

    // Handle price input
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setData('price', Number(value));
    };

    const handleUsdPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setData('usd_price', Number(value));
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setData('discount', Number(value));
    };

    // Handle form submission
    const handleSubmit = (e: any) => {
        e.preventDefault();
        post(route(isEdit ? 'division.update' : 'division.create'));
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
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
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
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
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
                            value={formatRupiah(data.price.toString())}
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
                        <span className="absolute top-2 left-3 text-gray-500">$</span>
                        <input
                            type="text"
                            value={formatUsd(data.usd_price.toString())}
                            onChange={handleUsdPriceChange}
                            className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border py-2 pr-3 pl-12 shadow-sm focus:ring-2 focus:outline-none ${
                                errors.usd_price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0"
                        />
                    </div>
                    {errors.usd_price && <p className="mt-1 text-sm text-red-500">{errors.usd_price}</p>}
                </div>

                {/* Discount Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Discount (%)</label>
                    <input
                        type="text"
                        value={data.discount}
                        onChange={handleDiscountChange}
                        className="focus:border-border-primary focus:ring-border-primary w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:outline-none"
                        placeholder="0"
                    />
                </div>

                {/* Sub Category Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Type *</label>
                    <select
                        value={data.sub_category_id}
                        onChange={(e) => setData('sub_category_id', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.sub_category_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select type</option>
                        {subcats.length > 0 &&
                            subcats.map((subcat) => (
                                <option key={subcat.id} value={subcat.id}>
                                    {subcat.name} - {subcat.category.name} - {subcat.category.sub_unit.name} - {subcat.category.sub_unit.unit.name}
                                </option>
                            ))}
                    </select>
                    {errors.sub_category_id && <p className="mt-1 text-sm text-red-500">{errors.sub_category_id}</p>}
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
