import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const subcategories = [
    {
        id: 1,
        name: 'Art Print Only',
        description: 'Ini adalah description',
        unit: 'Design',
        category_name: 'Extended Art Print',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
    {
        id: 2,
        name: 'Art Print  + Wonder Legacy Magnetic Case',
        description: 'Ini adalah description',
        unit: 'Design',
        category_name: 'Extended Art Print',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
    {
        id: 3,
        name: 'With Stand',
        description: 'Ini adalah description',
        unit: 'Design',
        category_name: 'Raw Akrilik',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
    {
        id: 4,
        name: 'Without Stand',
        description: 'Ini adalah description',
        unit: 'Design',
        category_name: 'Raw Akrilik',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
];

export default function Subcategory() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Sub Category',
            href: '/products/subcategory',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Sub Category" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/subcategory/addsub'}>Add Sub Category</Link>
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
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Category</th>
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
                            <td className="border border-popover px-4 py-3">{cat.category_name}</td>
                            <td className="border border-popover px-4 py-3">Rp. {formatRupiah(cat.price.toString())}</td>
                            <td className="border border-popover px-4 py-3">{cat.discount}%</td>
                            <td className="border border-popover px-4 py-3">{cat.total_stocks}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={'/products/subcategory/viewsub/1'}>
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
