import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UnitsDialog from '@/components/units-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IRootUnits, IUnit, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Collection',
        href: '/products/unit',
    },
];

interface UnitForm {
    name: string;
    description: string;
    image: File | null;
    is_active: boolean;
    price: number;
    usd_price: number;
    discount: number;
}

type EditUnitForm = UnitForm & {
    id: string;
};

interface PropsUnitTable {
    unitsPaginated: IRootUnits;
    filters: any;
}

export default function Unit() {
    const { unitsPaginated, filters } = usePage<SharedData>().props;

    const { data, setData, post, processing, errors } = useForm<Required<UnitForm>>({
        name: '',
        description: '',
        image: null,
        is_active: false,
        price: 0,
        usd_price: 0,
        discount: 0,
    });

    const [openAdd, isOpenAdd] = useState(false);

    const submitHandler = (e: any) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('description', data.description);
        fd.append('is_active', data.is_active ? '1' : '0');

        if (data.image instanceof File) fd.append('image', data.image);

        router.post(route('unit.create'), fd, {
            forceFormData: true,
            onSuccess: () => {
                isOpenAdd(false);
            },
            onError: () => {
                isOpenAdd(true);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Collection" />
            <div className="p-4">
                {' '}
                <Button onClick={() => isOpenAdd(true)}>Add Collection</Button>
                <UnitsDialog open={openAdd} isOpen={isOpenAdd} type={'add'} onSubmit={submitHandler} data={data} setData={setData} errors={errors} />
                <div>
                    <UnitsTable unitsPaginated={unitsPaginated} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}

function UnitsTable({ unitsPaginated, filters }: PropsUnitTable) {
    const { data, setData, post, processing, errors } = useForm<Required<EditUnitForm & { image: File | null }>>({
        id: '',
        name: '',
        description: '',
        is_active: false,
        image: null,
        price: 0,
        usd_price: 0,
        discount: 0,
    });

    const [openEdit, isOpenEdit] = useState(false);
    const [openDel, isOpenDel] = useState(false);
    const [selected, setSelected] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelected(selectedItem);

        if (type === 'edit') isOpenEdit(true);
        if (type === 'delete') isOpenDel(true);
    };

    const SubmitHandler = (e: any) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('id', (data as any).id);
        fd.append('name', data.name);
        fd.append('description', data.description);
        fd.append('is_active', data.is_active ? '1' : '0');
        if ((data as any).image instanceof File) fd.append('image', (data as any).image);
        router.post(route('unit.update'), fd, {
            forceFormData: true,
            onSuccess: () => {
                isOpenEdit(false);
            },
            onError: () => {
                isOpenEdit(true);
            },
        });
    };

    const currentPage = unitsPaginated?.current_page ?? 1;
    const perPage = unitsPaginated?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/unit', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'name' | 'description' | 'is_active') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/unit', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/unit', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
        <>
            <UnitsDialog
                open={openEdit}
                isOpen={isOpenEdit}
                type="edit"
                unit={selected}
                onSubmit={SubmitHandler}
                data={data}
                setData={setData}
                errors={errors}
            />
            {/* <UnitsDialog open={openDel} isOpen={isOpenDel} type="delete" unit={selected} onSubmit={SubmitHandler} /> */}

            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {unitsPaginated?.total ? (
                        <>
                            Showing {unitsPaginated.from ?? 0}-{unitsPaginated.to ?? 0} of {unitsPaginated.total}
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
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground select-none"
                            onClick={() => toggleSort('id')}
                            title="Sort by ID"
                        >
                            # {filters?.sort_by === 'id' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground select-none"
                            onClick={() => toggleSort('name')}
                        >
                            Name {filters?.sort_by === 'name' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground select-none"
                            onClick={() => toggleSort('description')}
                        >
                            Description {filters?.sort_by === 'description' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground select-none"
                            onClick={() => toggleSort('is_active')}
                        >
                            Active {filters?.sort_by === 'is_active' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {unitsPaginated?.data?.length > 0 ? (
                        unitsPaginated.data.map((unit: IUnit, i: number) => (
                            <tr key={unit.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
                                <td className="border border-popover px-4 py-3">{unit.name}</td>
                                <td className="border border-popover px-4 py-3">{unit.description}</td>
                                <td className="border border-popover px-4 py-3">{unit.is_active ? 'Yes' : 'No'}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                onClick={() => itemHandler('edit', unit)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                onClick={() => itemHandler('delete', unit)}
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
                                No Collection found. Try adjusting your search.
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
                    Page {currentPage} of {unitsPaginated?.last_page ?? 1}
                </span>
                <Button variant="outline" disabled={currentPage >= (unitsPaginated?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
