import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface ITagsDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    tags?: IFormData;

    //Inertia’s useForm
    data: { id?: string; name: string; description: string; is_show: number | boolean };
    setData: (field: 'name' | 'description' | 'id' | 'is_show', value: string | number | boolean) => void;
    errors: { name?: string; description?: string; is_show?: string };

    onSubmit: (e: React.FormEvent) => void;
}

interface IFormData {
    id: string;
    name: string;
    description: string;
    is_show?: string | number | boolean;
}

export default function TagsDialog({ open, isOpen, type, tags, onSubmit, data, setData, errors }: ITagsDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit' && tags) {
                setData('id', tags.id);
                setData('name', tags.name);
                setData('description', tags.description);
                setData('is_show', Number(tags.is_show) === 1 ? 1 : 0);
            } else if (type === 'add') {
                setData('name', '');
                setData('description', '');
                setData('is_show', 0);
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

                            <div className="mb-6 flex items-center gap-2">
                                <Checkbox
                                    id="is_show"
                                    checked={Boolean(data.is_show)}
                                    onCheckedChange={(checked) => setData('is_show', checked ? 1 : 0)}
                                />
                                <label htmlFor="is_show" className="text-sm font-medium">
                                    Show tag
                                </label>
                            </div>
                            {errors.is_show && <p className="mt-1 text-sm text-red-500">{errors.is_show}</p>}
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
