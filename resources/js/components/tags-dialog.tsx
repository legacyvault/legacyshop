import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface ITagsDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    tags?: IFormData;

    //Inertia’s useForm
    data: { id?: string; name: string; description: string };
    setData: (field: 'name' | 'description' | 'id' | 'unit_id', value: string) => void;
    errors: { name?: string; description?: string };

    onSubmit: (e: React.FormEvent) => void;
}

interface IFormData {
    id: string;
    name: string;
    description: string;
}

export default function TagsDialog({ open, isOpen, type, tags, onSubmit, data, setData, errors }: ITagsDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit' && tags) {
                setData('id', tags.id);
                setData('name', tags.name);
                setData('description', tags.description);
            } else if (type === 'add') {
                setData('name', '');
                setData('description', '');
            }
        }
    }, [open, tags, type]);

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Tags</DialogTitle>
                    {type !== 'delete' ? (
                        <form method="POST" onSubmit={onSubmit}>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.name ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter tags name"
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
                            <DialogClose asChild>
                                <Button type="submit" className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </form>
                    ) : (
                        <>
                            <span>Are you sure want to delete this tags?</span>
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
