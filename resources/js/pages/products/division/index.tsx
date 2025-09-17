import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IDivisions, IRootDivisions, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Division',
        href: '/products/division',
    },
];

interface PropsDivisionTable {
    divisionsPaginated: IRootDivisions;
    filters: any;
}

export default function Division() {
    const { divisionsPaginated, filters } = usePage<SharedData>().props as any;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Division" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/division/adddiv'}>Add Division</Link>
                </Button>
                <DivisionsTable divisionsPaginated={divisionsPaginated} filters={filters} />
            </div>
        </AppLayout>
    );
}

function DivisionsTable({ divisionsPaginated, filters }: PropsDivisionTable) {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const currentPage = divisionsPaginated?.current_page ?? 1;
    const perPage = divisionsPaginated?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/division', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'name' | 'description' | 'price' | 'discount' | 'total_stock') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/division', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/division', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
        <>
            {' '}
            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {divisionsPaginated?.total ? (
                        <>Showing {divisionsPaginated.from ?? 0}-{divisionsPaginated.to ?? 0} of {divisionsPaginated.total}</>
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
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('id')}>
                                    # {filters?.sort_by === 'id' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                                    Name {filters?.sort_by === 'name' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('description')}>
                                    Description {filters?.sort_by === 'description' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Sub Category</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('price')}>
                                    Price {filters?.sort_by === 'price' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('discount')}>
                                    Discount {filters?.sort_by === 'discount' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('total_stock')}>
                                    Total Stocks {filters?.sort_by === 'total_stock' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                            </tr>
                        </thead>
                <tbody>
                    {divisionsPaginated?.data?.length > 0 ? (
                        divisionsPaginated.data.map((div: IDivisions, i: number) => (
                            <tr key={div.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
                                <td className="border border-popover px-4 py-3">{div.name}</td>
                                <td className="border border-popover px-4 py-3">{div.description}</td>
                                <td className="border border-popover px-4 py-3">{div.sub_category.name}</td>
                                <td className="border border-popover px-4 py-3">{formatRupiah(div.price.toString())}</td>
                                <td className="border border-popover px-4 py-3">{div.discount}%</td>
                                <td className="border border-popover px-4 py-3">{div.total_stock}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <Link href={`/products/division/viewdiv/${div.id}`}>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                            </Link>
                                            <Link href={`/products/division/adddiv/${div.id}`}>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                            </Link>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                No divisions found. Try adjusting your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                    Previous
                </Button>
                <span className="text-sm">Page {currentPage} of {divisionsPaginated?.last_page ?? 1}</span>
                <Button variant="outline" disabled={currentPage >= (divisionsPaginated?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
