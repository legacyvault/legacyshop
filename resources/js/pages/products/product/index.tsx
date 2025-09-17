import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IRootProducts, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

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
                <ProductsTable products={products} />
            </div>
        </AppLayout>
    );
}

function ProductsTable({ products }: PropsProductTable) {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    return (
        <>
            {products.data.length > 0 ? (
                <>
                    {' '}
                    <table className="mt-4 min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent">
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Unit</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Total Stocks</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((prod, i: number) => (
                                <tr key={prod.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
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

                                                {/* <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                    // onClick={() => itemHandler('delete', prod)}
                                                >
                                                    Delete
                                                </DropdownMenuItem> */}
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
                    <Empty title="No Data Yet" description="Get started by creating product." />
                </>
            )}
        </>
    );
}
