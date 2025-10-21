// import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IProducts, IRootProducts, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface PropsProductTable {
    products: IRootProducts;
}

export default function Product() {
    const { products, filters } = usePage<SharedData>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products',
            href: '/products/product',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/product/add-product'}>Add Product</Link>
                </Button>
                <ProductsTable products={products} filters={filters as any} />
            </div>
        </AppLayout>
    );
}

function ProductsTable({ products, filters }: { products: IRootProducts; filters: any }) {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const currentPage = products?.current_page ?? 1;
    const perPage = products?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/product', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'product_name' | 'description' | 'product_price' | 'total_stock') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/product', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/product', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
        <>
            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {products?.total ? (
                        <>
                            Showing {products.from ?? 0}-{products.to ?? 0} of {products.total}
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
            </div>{' '}
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
                            onClick={() => toggleSort('product_name')}
                        >
                            Name {filters?.sort_by === 'product_name' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('description')}
                        >
                            Description {filters?.sort_by === 'description' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Unit</th>
                        <th
                            className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground"
                            onClick={() => toggleSort('product_price')}
                        >
                            Price {filters?.sort_by === 'product_price' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
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
                    {products?.data?.length > 0 ? (
                        products.data.map((prod: IProducts, i: number) => (
                            <tr key={prod.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
                                <td className="border border-popover px-4 py-3">{prod.product_name}</td>
                                <td className="border border-popover px-4 py-3">{prod.description}</td>
                                <td className="border border-popover px-4 py-3">{prod.unit.name}</td>
                                <td className="border border-popover px-4 py-3">Rp. {formatRupiah(prod.product_price.toString())}</td>
                                <td className="border border-popover px-4 py-3">{prod.total_stock}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <Link href={`/products/product/viewprod/${prod.id}`}>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                            </Link>
                                            <Link href={`/products/product/add-product/${prod.id}`}>
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
                                No products found. Try adjusting your search.
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
                    Page {currentPage} of {products?.last_page ?? 1}
                </span>
                <Button variant="outline" disabled={currentPage >= (products?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
