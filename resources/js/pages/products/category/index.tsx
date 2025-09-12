import CategoriesDialog from '@/components/categories-dialog';
import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ICategories, IUnit, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Category',
        href: '/products/category',
    },
];

interface CatForm {
    name: string;
    description: string;
    unit_id: string;
}

interface PropsCatTable {
    categories: ICategories[];
    units: IUnit[];
}

type EditCatForm = CatForm & {
    id: string;
};

export default function Category() {
    const { categories, units } = usePage<SharedData>().props;

    const { data, setData, post, errors } = useForm<Required<CatForm>>({
        name: '',
        description: '',
        unit_id: '',
    });

    const [openAddCat, isOpenAddCat] = useState(false);

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('category.create'), {
            onSuccess: () => isOpenAddCat(false),
            onError: () => isOpenAddCat(true),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Category" />
            <div className="p-4">
                <Button onClick={() => isOpenAddCat(true)}>Add Categories</Button>
                <CategoriesDialog
                    data={data}
                    setData={setData}
                    units={units}
                    open={openAddCat}
                    isOpen={isOpenAddCat}
                    type={'add'}
                    onSubmit={catSubmitHandler}
                    errors={errors}
                />
                <CategoriesTable categories={categories} units={units} />
            </div>
        </AppLayout>
    );
}

function CategoriesTable({ categories, units }: PropsCatTable) {
    const { data, setData, post, errors } = useForm<Required<EditCatForm>>({
        id: '',
        name: '',
        description: '',
        unit_id: '',
    });

    const [openEditCat, isOpenEditCat] = useState(false);
    const [openDelCat, isOpenDelCat] = useState(false);
    const [selectedCat, setSelectedCat] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedCatItem: any) => {
        setSelectedCat(selectedCatItem);

        if (type === 'edit') isOpenEditCat(true);
        if (type === 'delete') isOpenDelCat(true);
    };

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('category.update'), {
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
            {categories.length > 0 ? (
                <>
                    <CategoriesDialog
                        data={data}
                        setData={setData}
                        open={openEditCat}
                        isOpen={isOpenEditCat}
                        errors={errors}
                        type="edit"
                        category={selectedCat}
                        onSubmit={catSubmitHandler}
                        units={units}
                    />
                    {/* <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} /> */}

                    <table className="mt-4 min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent">
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Unit</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat, i) => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
                                    <td className="border border-popover px-4 py-3">{cat.name}</td>
                                    <td className="border border-popover px-4 py-3">{cat.description}</td>
                                    <td className="border border-popover px-4 py-3">{cat.unit.name}</td>
                                    <td className="border border-popover px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                    onClick={() => itemHandler('edit', cat)}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                    onClick={() => itemHandler('delete', cat)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <>
                    <Empty title="No Data Yet" description="Get started by creating unit." />
                </>
            )}
        </>
    );
}
