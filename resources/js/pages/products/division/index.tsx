import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const divisions = [
    {
        id: 1,
        name: 'CGC Magnetic Case',
        description: 'Ini adalah description',
        sub_category_name: 'Art Print Only',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
    {
        id: 2,
        name: 'PSA',
        description: 'Ini adalah description',
        sub_category_name: 'Art Print + Wonder Legacy Magnetic Case',
        total_stocks: 10,
        price: 200000,
        discount: 10,
    },
];

export default function Divison() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Division',
            href: '/products/division',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Division" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/division/adddiv'}>Add Division</Link>
                </Button>
                <DivisionsTable />
            </div>
        </AppLayout>
    );
}

function DivisionsTable() {
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
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Sub Category</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Total Stocks</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {divisions.map((div, i) => (
                        <tr key={div.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{i + 1}</td>
                            <td className="border border-popover px-4 py-3">{div.name}</td>
                            <td className="border border-popover px-4 py-3">{div.description}</td>
                            <td className="border border-popover px-4 py-3">{div.sub_category_name}</td>
                            <td className="border border-popover px-4 py-3">{formatRupiah(div.price.toString())}</td>
                            <td className="border border-popover px-4 py-3">{div.discount}%</td>
                            <td className="border border-popover px-4 py-3">{div.total_stocks}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={'/products/division/viewdiv/1'}>
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
