import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const variants = [
    {
        id: 1,
        name: 'Warna Merah',
        description: 'Ini adalah description',
        division: 'Warna',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
    {
        id: 1,
        name: 'PSA Bulbasaur',
        description: 'Ini adalah description',
        division: 'PSA',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
];

export default function Variant() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Variant',
            href: '/products/variant',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Variant" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/variant/addvar'}>Add Variant</Link>
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
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Divison</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Total Stocks</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {variants.map((variant, i) => (
                        <tr key={variant.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{i + 1}</td>
                            <td className="border border-popover px-4 py-3">{variant.name}</td>
                            <td className="border border-popover px-4 py-3">{variant.description}</td>
                            <td className="border border-popover px-4 py-3">{variant.division}</td>
                            <td className="border border-popover px-4 py-3">Rp. {formatRupiah(variant.price.toString())}</td>
                            <td className="border border-popover px-4 py-3">{variant.discount}%</td>
                            <td className="border border-popover px-4 py-3">{variant.total_stocks}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={'/products/variant/viewvar/1'}>
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
