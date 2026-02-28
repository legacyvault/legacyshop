import CategoriesDialog from '@/components/categories-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ICategories, IRootCategories, ISubUnits, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Variant',
        href: '/products/category',
    },
];

interface CatForm {
    name: string;
    description: string;
    sub_unit_id: string;
}

interface PropsCatTable {
    categoriesPaginated: IRootCategories;
    subunits: ISubUnits[];
    filters: any;
}

type EditCatForm = CatForm & {
    id: string;
};

export default function Category() {
    const { categoriesPaginated, subunits, filters } = usePage<SharedData>().props;

    const { data, setData, post, errors } = useForm<Required<CatForm>>({
        name: '',
        description: '',
        sub_unit_id: '',
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
            <Head title="Products - Variant" />
            <div className="p-4">
                <Button onClick={() => isOpenAddCat(true)}>Add Variant</Button>
                <CategoriesDialog
                    data={data}
                    setData={setData}
                    subunits={subunits}
                    open={openAddCat}
                    isOpen={isOpenAddCat}
                    type={'add'}
                    onSubmit={catSubmitHandler}
                    errors={errors}
                />
                <CategoriesTable categoriesPaginated={categoriesPaginated} subunits={subunits} filters={filters} />
            </div>
        </AppLayout>
    );
}

function CategoriesTable({ categoriesPaginated, subunits, filters }: PropsCatTable) {
    const { data, setData, post, errors } = useForm<Required<EditCatForm>>({
        id: '',
        name: '',
        description: '',
        sub_unit_id: '',
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

    const currentPage = categoriesPaginated?.current_page ?? 1;
    const perPage = categoriesPaginated?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/category', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'name' | 'description' | 'unit_id') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/category', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/category', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
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
                subunits={subunits}
            />
            {/* <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} /> */}

            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {categoriesPaginated?.total ? (
                        <>
                            Showing {categoriesPaginated.from ?? 0}-{categoriesPaginated.to ?? 0} of {categoriesPaginated.total}
                        </>
                    ) : (
                        <>No results</>
                    )}
                </div>
                <input
                    type="text"
                    className="w-60 rounded border px-3 py-2 text-sm"
                    placeholder="Search name or description..."
                    defaultValue={filters?.q || ''}
                    onChange={handleSearch}
                />
            </div>

            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('id')}
                        >
                            # {filters?.sort_by === 'id' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('name')}
                        >
                            Name {filters?.sort_by === 'name' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('description')}
                        >
                            Description {filters?.sort_by === 'description' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Category</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categoriesPaginated?.data?.length > 0 ? (
                        categoriesPaginated.data.map((cat: ICategories, i: number) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
                                <td className="border border-popover px-4 py-3">{cat.name}</td>
                                <td className="border border-popover px-4 py-3">{cat.description}</td>
                                <td className="border border-popover px-4 py-3">{cat.sub_unit.name}</td>
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
                                                onClick={() => {
                                                    if (!confirm(`Delete category "${cat.name}"?`)) return;
                                                    router.delete(route('category.delete', { id: cat.id }));
                                                }}
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
                            <td colSpan={5} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                No variants found. Try adjusting your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                    Previous
                </Button>
                <span className="text-sm">
                    Page {currentPage} of {categoriesPaginated?.last_page ?? 1}
                </span>
                <Button variant="outline" disabled={currentPage >= (categoriesPaginated?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
