import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ISubcats, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface FormData {
    id: string | null;
    name: string;
    description: string;
    category_id: string;
    price: number;
    discount: number;
}

export default function AddSubCategory() {
    const { id, categories, subcat } = usePage<SharedData>().props;
    const isEdit = !!id;

    const [selectedSubcat, setSelectedSubcat] = useState<ISubcats>(subcat as ISubcats);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isEdit ? 'Edit' : 'Add'} Sub Category`,
            href: '/products/subcategory/addsub',
        },
    ];
    const { data, setData, post, errors } = useForm<Required<FormData>>({
        id: isEdit ? selectedSubcat.id : null,
        name: isEdit ? selectedSubcat.name : '',
        description: isEdit ? selectedSubcat.description : '',
        category_id: isEdit ? selectedSubcat.category_id : '',
        price: isEdit ? selectedSubcat.price : 0,
        discount: isEdit ? selectedSubcat.discount : 0,
    });

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setData('price', Number(value));
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('discount', Number(value));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        post(route(isEdit ? 'subcat.update' : 'subcat.create'));
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

                {/* Category Field */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Category *</label>
                    <select
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value)}
                        className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                            errors.category_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select category</option>
                        {categories.length > 0 &&
                            categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                    </select>
                    {errors.category_id && <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>}
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
