import { IBanner } from '@/types';
import { Upload } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface IBannerDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    banner?: IBanner;

    //Inertia’s useForm
    data: { id?: string; banner_text: string; is_active: boolean; image?: File | null; url: string; banner_title: string; button_text: string };
    setData: (field: any, value: any) => void;
    errors: { banner_text?: string; is_active?: string; image?: string; url?: string; banner_title?: string; button_text?: string };

    onSubmit: (e: React.FormEvent) => void;
}

export default function BannerDialog({ open, isOpen, type, banner, onSubmit, data, setData, errors }: IBannerDialog) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            if (type === 'edit' && banner) {
                setData('id', banner.id);
                setData('banner_text', banner.banner_text);
                setData('is_active', banner.is_active);
                setData('image', null);
                setData('url', banner.url);
                setData('banner_title', banner.banner_title);
                setData('button_text', banner.button_text);
                setImagePreview(banner.picture_url || null);
            } else if (type === 'add') {
                setData('banner_text', '');
                setData('is_active', false);
                setData('image', null);
                setData('url', '');
                setData('banner_title', '');
                setData('button_text', '');
                setImagePreview(null);
            }
        }
    }, [open, banner, type]);

    const validateImage = (file: File): string | null => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (file.size > maxSize) return `Image "${file.name}" is too large. Maximum size is 2MB.`;
        if (!allowedTypes.includes(file.type)) return `Unsupported format for "${file.name}". Allowed: JPG, JPEG, PNG, GIF.`;
        return null;
    };

    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target.files && e.target.files[0]) || null;
        if (!file) return;

        const err = validateImage(file);
        if (err) {
            // surface via setData to errors from server later; for now just ignore set
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

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-h-7/12 overflow-scroll">
                    <DialogTitle className="capitalize">{type} Banner</DialogTitle>
                    {type !== 'delete' ? (
                        <form method="POST" onSubmit={onSubmit} encType="multipart/form-data">
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Text</label>
                                <textarea
                                    value={data.banner_text}
                                    onChange={(e) => setData('banner_text', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.banner_text ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter Text"
                                />
                                {errors.banner_text && <p className="mt-1 text-sm text-red-500">{errors.banner_text}</p>}
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Url</label>
                                <textarea
                                    value={data.url}
                                    onChange={(e) => setData('url', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.url ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter url"
                                />
                                {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url}</p>}
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Banner Title</label>
                                <textarea
                                    value={data.banner_title}
                                    onChange={(e) => setData('banner_title', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.url ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter Banner Title"
                                />
                                {errors.banner_title && <p className="mt-1 text-sm text-red-500">{errors.banner_title}</p>}
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Text Button</label>
                                <textarea
                                    value={data.button_text}
                                    onChange={(e) => setData('button_text', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.button_text ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter Button Text"
                                />
                                {errors.button_text && <p className="mt-1 text-sm text-red-500">{errors.button_text}</p>}
                            </div>

                            {/* Image Upload (single) */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Banner Image (Max 2MB)</label>

                                {imagePreview && (
                                    <div className="mb-4">
                                        <img src={imagePreview} alt="Preview" className="h-24 w-48 rounded-lg border object-cover" />
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

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Active *</label>
                                <Checkbox checked={data.is_active} onCheckedChange={(e) => setData('is_active', e)}></Checkbox>
                                {errors.is_active && <p className="mt-1 text-sm text-red-500">{errors.is_active}</p>}
                            </div>
                            <DialogClose asChild>
                                <Button type="submit" className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </form>
                    ) : (
                        <>
                            <span>Are you sure want to delete this banner?</span>
                            <DialogClose asChild>
                                <Button className="capitalize" onClick={onSubmit}>
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
