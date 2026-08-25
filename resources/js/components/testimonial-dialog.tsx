import { ITestimonial } from '@/types';
import { Upload } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

export interface TestimonialForm {
    name: string;
    instagram_account: string;
    message: string;
    image: File | null;
}

const MAX_MESSAGE_LENGTH = 500;

interface ITestimonialDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'edit' | 'view' | 'delete';
    testimonial?: ITestimonial;

    data: TestimonialForm;
    setData: (field: any, value: any) => void;
    errors: Partial<Record<keyof TestimonialForm, string>>;
    processing?: boolean;

    onSubmit: (e: React.FormEvent) => void;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function TestimonialDialog({ open, isOpen, type, testimonial, onSubmit, data, setData, errors, processing }: ITestimonialDialog) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        setImageError(null);

        if (type === 'edit' && testimonial) {
            setData('name', testimonial.name);
            setData('instagram_account', testimonial.instagram_account ?? '');
            setData('message', testimonial.message);
            setData('image', null);
            setImagePreview(testimonial.picture_url || null);
        } else if (type === 'add') {
            setData('name', '');
            setData('instagram_account', '');
            setData('message', '');
            setData('image', null);
            setImagePreview(null);
        }
    }, [open, testimonial, type]);

    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        e.target.value = '';
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(`"${file.name}" is too large. Maximum size is 2MB.`);
            return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            setImageError(`Unsupported format for "${file.name}". Allowed: JPG, JPEG, PNG, WEBP.`);
            return;
        }

        setImageError(null);
        setData('image', file);

        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const requiresImage = type === 'add' && !data.image;

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogTitle className="capitalize">{type} Testimonial</DialogTitle>

                    {type === 'view' && testimonial && (
                        <div className="space-y-4">
                            <img src={testimonial.picture_url} alt={testimonial.name} className="h-64 w-full rounded-lg border object-cover" />
                            <div>
                                <p className="text-sm font-medium">Name</p>
                                <p className="text-sm text-muted-foreground">{testimonial.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Instagram Account</p>
                                <p className="text-sm text-muted-foreground">
                                    {testimonial.instagram_account ? `@${testimonial.instagram_account}` : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Message</p>
                                <p className="text-sm whitespace-pre-line text-muted-foreground">{testimonial.message}</p>
                            </div>
                            <Button variant="outline" onClick={() => isOpen(false)}>
                                Close
                            </Button>
                        </div>
                    )}

                    {type === 'delete' && (
                        <>
                            <span className="text-sm">
                                Are you sure want to delete testimonial from <strong>{testimonial?.name}</strong>?
                            </span>
                            <div className="flex gap-2">
                                <Button variant="destructive" disabled={processing} onClick={onSubmit}>
                                    Delete
                                </Button>
                                <Button variant="outline" onClick={() => isOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    {(type === 'add' || type === 'edit') && (
                        <form method="POST" onSubmit={onSubmit} encType="multipart/form-data">
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    maxLength={100}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.name ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Instagram Account</label>
                                <div
                                    className={`flex items-center rounded-md border shadow-sm focus-within:border-primary ${
                                        errors.instagram_account ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                >
                                    <span className="pl-3 text-sm text-muted-foreground">@</span>
                                    <input
                                        type="text"
                                        value={data.instagram_account}
                                        maxLength={30}
                                        onChange={(e) => setData('instagram_account', e.target.value.replace(/^@+/, ''))}
                                        className="w-full rounded-md bg-transparent px-2 py-2 focus:outline-none"
                                        placeholder="username"
                                    />
                                </div>
                                {errors.instagram_account && <p className="mt-1 text-sm text-red-500">{errors.instagram_account}</p>}
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Message *</label>
                                <textarea
                                    value={data.message}
                                    rows={4}
                                    maxLength={MAX_MESSAGE_LENGTH}
                                    onChange={(e) => setData('message', e.target.value)}
                                    className={`w-full resize-y rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.message ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter testimonial message"
                                />
                                <div className="mt-1 flex items-start justify-between gap-2">
                                    <p className="text-sm text-red-500">{errors.message}</p>
                                    <p className="shrink-0 text-xs text-muted-foreground">
                                        {data.message.length}/{MAX_MESSAGE_LENGTH}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Image (Max 2MB) {type === 'add' && '*'}</label>

                                {imagePreview && <img src={imagePreview} alt="Preview" className="mb-4 h-40 w-32 rounded-lg border object-cover" />}

                                <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-xs text-gray-500">Upload Image</p>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onImageChange} className="hidden" />
                                </label>
                                <p className="mt-2 text-xs text-gray-500">Allowed formats: JPG, JPEG, PNG, WEBP.</p>
                                {imageError && <p className="mt-1 text-sm text-red-500">{imageError}</p>}
                                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                            </div>

                            <Button type="submit" className="capitalize" disabled={processing || !data.name.trim() || !data.message.trim() || requiresImage}>
                                {type}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
