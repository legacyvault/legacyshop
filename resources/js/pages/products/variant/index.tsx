import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IRootVariants, IVariants, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Selection',
        href: '/products/variant',
    },
];

interface PropsVariantTable {
    variantsPaginated: IRootVariants;
    filters: any;
}

export default function Variant() {
    const { variantsPaginated, filters } = usePage<SharedData>().props as any;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Selection" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/variant/addvar'}>Add Selection</Link>
                </Button>
                <VariantsTable variantsPaginated={variantsPaginated} filters={filters} />
            </div>
        </AppLayout>
    );
}

function VariantsTable({ variantsPaginated, filters }: PropsVariantTable) {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatUsd = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('en-US').format(Number(number));
    };

    const currentPage = variantsPaginated?.current_page ?? 1;
    const perPage = variantsPaginated?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/variant', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'name' | 'description' | 'price' | 'usd_price' | 'discount' | 'total_stock') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/variant', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/variant', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
        <>
            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {variantsPaginated?.total ? (
                        <>
                            Showing {variantsPaginated.from ?? 0}-{variantsPaginated.to ?? 0} of {variantsPaginated.total}
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
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Option</th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('price')}
                        >
                            Price (IDR) {filters?.sort_by === 'price' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('usd_price')}
                        >
                            Price (USD) {filters?.sort_by === 'usd_price' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('discount')}
                        >
                            Discount {filters?.sort_by === 'discount' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('total_stock')}
                        >
                            Total Stocks {filters?.sort_by === 'total_stock' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {variantsPaginated?.data?.length > 0 ? (
                        variantsPaginated.data.map((variant: IVariants, i: number) => (
                            <tr key={variant.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
                                <td className="border border-popover px-4 py-3">{variant.name}</td>
                                <td className="border border-popover px-4 py-3">{variant.description}</td>
                                <td className="border border-popover px-4 py-3">{variant.division.name}</td>
                                <td className="border border-popover px-4 py-3">Rp. {formatRupiah(variant.price.toString())}</td>
                                <td className="border border-popover px-4 py-3">$ {formatUsd(variant.usd_price.toString())}</td>
                                <td className="border border-popover px-4 py-3">{variant.discount}%</td>
                                <td className="border border-popover px-4 py-3">{variant.total_stock}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <Link href={`/products/variant/viewvar/${variant.id}`}>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                            </Link>
                                            <Link href={`/products/variant/addvar/${variant.id}`}>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                onClick={() => {
                                                    if (!confirm(`Delete variant "${variant.name}"?`)) return;
                                                    router.delete(route('variant.delete', { id: variant.id }));
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
                            <td colSpan={9} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
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
                    Page {currentPage} of {variantsPaginated?.last_page ?? 1}
                </span>
                <Button variant="outline" disabled={currentPage >= (variantsPaginated?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
