import { IUnit } from '@/types';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface ICategoriesDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    category?: IFormData;
    units: IUnit[];

    //Inertia’s useForm
    data: { id?: string; name: string; description: string; unit_id: string };
    setData: (field: 'name' | 'description' | 'id' | 'unit_id', value: string) => void;
    errors: { name?: string; description?: string; unit_id?: string };

    onSubmit: (e: React.FormEvent) => void;
}

interface IFormData {
    id: string;
    name: string;
    description: string;
    unit_id: string;
}

export default function CategoriesDialog({ open, isOpen, type, category, onSubmit, units, data, setData, errors }: ICategoriesDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit' && category) {
                setData('id', category.id);
                setData('name', category.name);
                setData('description', category.description);
                setData('unit_id', category.unit_id);
            } else if (type === 'add') {
                setData('name', '');
                setData('description', '');
                setData('unit_id', '');
            }
        }
    }, [open, category, type]);

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Categories</DialogTitle>
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
                                    placeholder="Enter category name"
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
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Unit *</label>
                                <select
                                    value={data.unit_id}
                                    onChange={(e) => setData('unit_id', e.target.value)}
                                    className={`focus:border-border-primary focus:ring-border-primary w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
                                        errors.unit_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">--Select Unit--</option>
                                    {units.map((unit, i) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.unit_id && <p className="mt-1 text-sm text-red-500">{errors.unit_id}</p>}
                            </div>
                            <DialogClose asChild>
                                <Button type="submit" className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </form>
                    ) : (
                        <>
                            <span>Are you sure want to delete this category?</span>
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
