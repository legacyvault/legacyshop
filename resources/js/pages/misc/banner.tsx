import BannerDialog from '@/components/banner-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IBanner, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Misc - Banner',
        href: '/misc/view-banner',
    },
];

interface Form {
    banner_text: string;
    is_active: boolean;
    image: File | null;
}

interface PropsTable {
    banner: IBanner[];
}

type EditCatForm = Form & {
    id: string;
};

export default function RunningText() {
    const { banner } = usePage<SharedData>().props;

    const { data, setData, post, errors } = useForm<Required<Form>>({
        banner_text: '',
        is_active: false,
        image: null,
    });

    const [openAdd, isOpenAdd] = useState(false);

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        // Ensure FormData for file upload
        const fd = new FormData();
        fd.append('banner_text', data.banner_text);
        fd.append('is_active', data.is_active ? '1' : '0');
        if (data.image instanceof File) fd.append('image', data.image);

        router.post(route('add-banner'), fd, {
            forceFormData: true,
            onSuccess: () => isOpenAdd(false),
            onError: () => isOpenAdd(true),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Misc - Running Text" />
            <div className="p-4">
                <Button onClick={() => isOpenAdd(true)}>Add Banner</Button>
                <BannerDialog
                    data={data}
                    setData={setData}
                    open={openAdd}
                    isOpen={isOpenAdd}
                    type={'add'}
                    onSubmit={catSubmitHandler}
                    errors={errors}
                />
                <BannerTable banner={banner} />
            </div>
        </AppLayout>
    );
}

function BannerTable({ banner }: PropsTable) {
    const { data, setData, post, errors } = useForm<Required<EditCatForm & { image: File | null }>>({
        id: '',
        banner_text: '',
        is_active: false,
        image: null,
    });

    const [openEditCat, isOpenEditCat] = useState(false);
    const [openDelCat, isOpenDelCat] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<IBanner>();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelectedBanner(selectedItem);

        if (type === 'edit') isOpenEditCat(true);
        if (type === 'delete') isOpenDelCat(true);
    };

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('id', data.id);
        fd.append('banner_text', data.banner_text);
        fd.append('is_active', data.is_active ? '1' : '0');
        if ((data as any).image instanceof File) fd.append('image', (data as any).image);

        router.post(route('edit-banner'), fd, {
            forceFormData: true,
            onSuccess: () => {
                isOpenEditCat(false);
            },
            onError: () => {
                isOpenEditCat(true);
            },
        });
    };

    return (
        <>
            <BannerDialog
                data={data}
                setData={setData}
                open={openEditCat}
                isOpen={isOpenEditCat}
                errors={errors}
                type="edit"
                banner={selectedBanner}
                onSubmit={catSubmitHandler}
            />
            {/* <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} /> */}

            <table className="mt-4 w-full table-fixed border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Text</th>
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Active</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {banner.length > 0 ? (
                        banner.map((item, i) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{i + 1}</td>
                                <td className="border border-popover px-4 py-3 break-words whitespace-normal">{item.banner_text}</td>
                                <td className="border border-popover px-4 py-3">{item.is_active ? 'Yes' : 'No'}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                onClick={() => itemHandler('edit', item)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                onClick={() => itemHandler('delete', item)}
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
                            <td colSpan={4} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                No Banner Found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}
