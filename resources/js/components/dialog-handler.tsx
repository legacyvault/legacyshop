import { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function DialogHandler() {
    const { props } = usePage<any>();
    const alert = props.flash?.alert as { type: string; message: string } | null;

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (alert) {
            setOpen(true);
        }
    }, [alert]);

    if (!alert) return null;
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogOverlay />
            <DialogContent>
                <DialogTitle>{alert.type === 'error' ? 'Error' : 'Success'}</DialogTitle>
                <DialogDescription>{alert.message}</DialogDescription>
                <DialogClose asChild>
                    <Button>Okay</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
