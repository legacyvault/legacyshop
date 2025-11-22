import { Upload } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface IUnitsDialogProps {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    unit?: {
        id: string;
        name: string;
        description: string;
        picture_url?: string | null;
        is_active: boolean;
        price: number;
        usd_price: number;
        discount: number;
    };

    //Inertia’s useForm
    data: {
        id?: string;
        name: string;
        description: string;
        image?: File | null;
        is_active: boolean;
        price: number;
        usd_price: number;
        discount: number;
    };
    setData: (field: any, value: any) => void;
    errors: { name?: string; description?: string; image?: string; is_active?: string; price?: string; usd_price?: string; discount?: string };

    onSubmit: (e: React.FormEvent) => void;
}

export default function UnitsDialog({ open, isOpen, type, unit, data, setData, errors, onSubmit }: IUnitsDialogProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            if (type === 'edit' && unit) {
                setData('id', unit.id);
                setData('name', unit.name);
                setData('description', unit.description);
                setData('image', null);
                setData('is_active', unit.is_active);
                setData('usd_price', unit.usd_price);
                setData('price', unit.price);
                setData('discount', unit.discount);
                setImagePreview(unit.picture_url || null);
            } else if (type === 'add') {
                setData('name', '');
                setData('description', '');
                setData('image', null);
                setData('is_active', false);
                setData('usd_price', 0);
                setData('price', 0);
                setData('discount', 0);
                setImagePreview(null);
            }
        }
    }, [open, type, unit]);

    const validateImage = (file: File): string | null => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (file.size > maxSize) return `Image "${file.name}" is too large. Maximum size is 2MB.`;
        if (!allowedTypes.includes(file.type)) return `Unsupported format for "${file.name}". Allowed: JPG, JPEG, PNG, GIF, WEBP.`;
        return null;
    };

    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target.files && e.target.files[0]) || null;
        if (!file) return;

        const err = validateImage(file);
        if (err) {
            alert(err);
            e.target.value = '';
            return;
        }

        setData('image', file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatUsd = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('en-US').format(Number(number));
    };

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

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Collection</DialogTitle>

                    {type !== 'delete' ? (
                        <form method="POST" onSubmit={onSubmit} encType="multipart/form-data">
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

                            <div className="mb-6 flex flex-col">
                                <label htmlFor="is_active" className="text-sm font-medium">
                                    Active
                                </label>
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                                ></Checkbox>
                            </div>

                            {/* Image Upload (single) */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Unit Image (Max 2MB)</label>

                                {imagePreview && (
                                    <div className="mb-4">
                                        <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg border object-cover" />
                                    </div>
                                )}

                                <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-xs text-gray-500">Upload Image</p>
                                    <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
                                </label>
                                <p className="mt-2 text-xs text-gray-500">Allowed formats: JPG, JPEG, PNG, GIF.</p>
                                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                            </div>

                            <DialogClose asChild>
                                <Button type="submit" className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </form>
                    ) : (
                        <>
                            <span>Are you sure want to delete this unit?</span>
                            <DialogClose asChild>
                                <Button onClick={onSubmit} className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
