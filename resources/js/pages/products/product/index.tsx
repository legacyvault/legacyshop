import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const subcategories = [
    {
        id: 1,
        name: 'PSA Bulbasaur pokemon X edition',
        description: 'Ini adalah description',
        unit: 'Design',
        category: 'Extended Art Print',
        subcategory: 'Art Print Only',
        division: 'PSA',
        variant: 'PSA Bulbasaur',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
];

export default function Product() {
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
                <SubcategoriesTable />
            </div>
        </AppLayout>
    );
}

function SubcategoriesTable() {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    return (
        <>
            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Unit</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Category</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Sub Category</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Division</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Variant</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Total Stocks</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {subcategories.map((cat, i) => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{i + 1}</td>
                            <td className="border border-popover px-4 py-3">{cat.name}</td>
                            <td className="border border-popover px-4 py-3">{cat.description}</td>
                            <td className="border border-popover px-4 py-3">{cat.unit}</td>
                            <td className="border border-popover px-4 py-3">{cat.category}</td>
                            <td className="border border-popover px-4 py-3">{cat.subcategory}</td>
                            <td className="border border-popover px-4 py-3">{cat.division}</td>
                            <td className="border border-popover px-4 py-3">{cat.variant}</td>
                            <td className="border border-popover px-4 py-3">Rp. {formatRupiah(cat.price.toString())}</td>
                            <td className="border border-popover px-4 py-3">{cat.discount}%</td>
                            <td className="border border-popover px-4 py-3">{cat.total_stocks}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={'/products/product/viewprod/1'}>
                                            <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem
                                            className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                            // onClick={() => itemHandler('edit', cat)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                            // onClick={() => itemHandler('delete', cat)}
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
    );
}
