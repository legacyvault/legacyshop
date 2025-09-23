import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

interface IRunningDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    runningText?: IFormData;

    //Inertia’s useForm
    data: { id?: string; running_text: string; is_active: boolean };
    setData: (field: any, value: any) => void;
    errors: { running_text?: string; is_active?: string };

    onSubmit: (e: React.FormEvent) => void;
}

interface IFormData {
    id: string;
    running_text: string;
    is_active: boolean;
}

export default function RunnigTextDialog({ open, isOpen, type, runningText, onSubmit, data, setData, errors }: IRunningDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit' && runningText) {
                setData('id', runningText.id);
                setData('running_text', runningText.running_text);
                setData('is_active', runningText.is_active);
            } else if (type === 'add') {
                setData('running_text', '');
                setData('is_active', false);
            }
        }
    }, [open, runningText, type]);

    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Categories</DialogTitle>
                    {type !== 'delete' ? (
                        <form method="POST" onSubmit={onSubmit}>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Text *</label>
                                <input
                                    type="text"
                                    value={data.running_text}
                                    onChange={(e) => setData('running_text', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.running_text ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter Text"
                                />
                                {errors.running_text && <p className="mt-1 text-sm text-red-500">{errors.running_text}</p>}
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
                            <span>Are you sure want to delete this text?</span>
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
