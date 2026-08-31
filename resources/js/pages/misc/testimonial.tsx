import TestimonialDialog, { TestimonialForm } from '@/components/testimonial-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ITestimonial, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Misc - Testimonials',
        href: '/misc/testimonial',
    },
];

type DialogType = 'add' | 'edit' | 'view' | 'delete';

const emptyForm: TestimonialForm = {
    name: '',
    instagram_account: '',
    message: '',
    image: null,
};

export default function Testimonials() {
    const { testimonials } = usePage<SharedData>().props;

    const { data, setData, post, errors, processing, reset, clearErrors, transform } = useForm<TestimonialForm>({ ...emptyForm });

    const [dialogType, setDialogType] = useState<DialogType>('add');
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<ITestimonial>();

    const openDialog = (type: DialogType, item?: ITestimonial) => {
        clearErrors();
        setDialogType(type);
        setSelected(item);
        setOpen(true);
    };

    transform((form) => ({
        ...form,
        name: form.name.trim(),
        instagram_account: form.instagram_account.trim(),
        message: form.message.trim(),
    }));

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();

        if (dialogType === 'delete' && selected) {
            router.delete(route('testimonial.delete', { id: selected.id }), { preserveScroll: true, onSuccess: () => setOpen(false) });
            return;
        }

        const url = dialogType === 'edit' && selected ? route('testimonial.update', { id: selected.id }) : route('testimonial.create');

        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Misc - Testimonials" />
            <div className="p-4">
                <div className="flex justify-end">
                    <Button onClick={() => openDialog('add')}>Add Testimonial</Button>
                </div>

                <TestimonialDialog
                    data={data}
                    setData={setData}
                    open={open}
                    isOpen={setOpen}
                    type={dialogType}
                    testimonial={selected}
                    errors={errors}
                    processing={processing}
                    onSubmit={submitHandler}
                />

                <table className="mt-4 w-full table-fixed border-collapse text-sm">
                    <thead>
                        <tr className="bg-sidebar-accent">
                            <th className="w-14 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                            <th className="w-28 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Image</th>
                            <th className="w-40 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                            <th className="w-40 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Instagram</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Message</th>
                            <th className="w-28 border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testimonials.length > 0 ? (
                            testimonials.map((item, i) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
                                    <td className="border border-popover px-4 py-3">
                                        <img
                                            src={item.thumbnail_url ?? item.picture_url}
                                            alt={item.name}
                                            loading="lazy"
                                            className="h-14 w-14 rounded-md border object-cover"
                                        />
                                    </td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">{item.name}</td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">
                                        {item.instagram_account ? `@${item.instagram_account}` : '-'}
                                    </td>
                                    <td className="border border-popover px-4 py-3">
                                        <p className="line-clamp-2 break-words">{item.message}</p>
                                    </td>
                                    <td className="border border-popover px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                    onClick={() => openDialog('view', item)}
                                                >
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                    onClick={() => openDialog('edit', item)}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                    onClick={() => openDialog('delete', item)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                    No Testimonial Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
