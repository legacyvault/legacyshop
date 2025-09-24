import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IVariants, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';

interface FormData {
    id: string | null;
    type: 'text' | 'color' | '';
    name: string;
    color: string;
    description: string;
    price: number;
    usd_price: number;
    discount: number;
    division_id: string;
}

export default function AddVariant() {
    const { id, variant, divisions } = usePage<SharedData>().props;

    const isEdit = !!id;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Variant`,
            href: '/products/variant/addvar',
        },
    ];

    const selectedVariant: IVariants = variant as IVariants;

    const { data, setData, post, errors } = useForm<Required<FormData>>({
        id: isEdit ? selectedVariant.id : null,
        type: isEdit ? selectedVariant.type : 'text',
        name: isEdit ? selectedVariant.name : '',
        color: isEdit ? (selectedVariant.color ?? '') : '',
        description: isEdit ? selectedVariant.description : '',
        price: isEdit ? selectedVariant.price : 0,
        usd_price: isEdit ? selectedVariant.usd_price : 0,
        discount: isEdit ? selectedVariant.discount : 0,
        division_id: isEdit ? selectedVariant.division_id : '',
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

        post(route(isEdit ? 'variant.update' : 'variant.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="p-6">
                {/* Type Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Type *</label>
                    <select
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value as 'text' | 'color' | '')}
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
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                            errors.name ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Color Value Field - Only visible when type is 'color' */}
                {data.type === 'color' && (
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium">Color Value *</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="h-10 w-16 cursor-pointer rounded-md border border-gray-300"
                            />
                            <input
                                type="text"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className={`flex-1 rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                    errors.color ? 'border-red-500' : 'border-gray-200'
                                }`}
                                placeholder="#000000"
                                pattern="^#[0-9A-Fa-f]{6}$"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Click the color box to open color picker or enter hex code manually</p>
                        {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
                    </div>
                )}

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

                {/* Division Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Division *</label>
                    <select
                        value={data.division_id}
                        onChange={(e) => setData('division_id', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.division_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Division</option>
                        {divisions.length > 0 &&
                            divisions.map((div) => (
                                <option key={div.id} value={div.id}>
                                    {div.name}
                                </option>
                            ))}
                    </select>
                    {errors.division_id && <p className="mt-1 text-sm text-red-500">{errors.division_id}</p>}
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
