import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface IUnitsDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    unit?: { id: number; name: string; description: string };
    onSubmit?: (data: IFormData, type: 'add' | 'delete' | 'edit') => void;
}

interface IFormData {
    id: number;
    name: string;
    description: string;
}

interface IFormErrors {
    id?: number;
    name?: string;
    description?: string;
}

export default function UnitsDialog({ open, isOpen, type, unit, onSubmit }: IUnitsDialog) {
    const [errors, setErrors] = useState<IFormErrors>({});

    const [formData, setFormData] = useState<IFormData>({
        id: 0,
        name: '',
        description: '',
    });

    const handleInputChange = (field: keyof IFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            if (field === 'id') return;
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    useEffect(() => {
        if (open) {
            if (type !== 'add' && unit) {
                setFormData({
                    id: unit.id,
                    name: unit.name,
                    description: unit.description,
                });
            } else {
                setFormData({
                    id: 0,
                    name: '',
                    description: '',
                });
            }
            setErrors({});
        }
    }, [open, unit, type]);

    const submitHandler = () => {
        if (type !== 'delete' && (!formData.name.trim() || !formData.description.trim())) {
            setErrors({
                name: !formData.name.trim() ? 'Name is required' : undefined,
                description: !formData.description.trim() ? 'Description is required' : undefined,
            });
            return;
        }

        onSubmit?.(formData, type);
    };

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Unit</DialogTitle>
                    {type !== 'delete' ? (
                        <>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.description ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter description"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </>
                    ) : (
                        <>
                            <span>Are you sure want to delete this category?</span>
                        </>
                    )}

                    <DialogClose asChild>
                        <Button className="capitalize" onClick={submitHandler}>
                            {type}
                        </Button>
                    </DialogClose>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
