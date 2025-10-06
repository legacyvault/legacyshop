import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IWarehouse, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

export default function Warehouse() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Warehouse',
            href: '/warehouse',
        },
    ];

    const { warehouses } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse" />
            <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        {warehouses.length > 0 ? `Total Warehouse: ${warehouses.length}` : 'No warehouse available yet.'}
                    </div>
                    <Link href={'/warehouse/add-warehouse'}>
                        <Button>Add Warehouse</Button>
                    </Link>
                </div>
                <WarehouseTable warehouses={warehouses} />
            </div>
        </AppLayout>
    );
}

function WarehouseTable({ warehouses }: { warehouses: IWarehouse[] }) {
    const formatDateTime = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    return (
        <table className="mt-4 w-full table-fixed border-collapse text-sm">
            <thead>
                <tr className="bg-sidebar-accent">
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Address</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Active</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Created At</th>
                    <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                </tr>
            </thead>
            <tbody>
                {warehouses.length > 0 ? (
                    warehouses.map((warehouse, index) => (
                        <tr key={warehouse.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{index + 1}</td>
                            <td className="border border-popover px-4 py-3 break-words whitespace-normal">{warehouse.name}</td>
                            <td className="border border-popover px-4 py-3 break-words whitespace-normal">{warehouse.address}</td>
                            <td className="border border-popover px-4 py-3">{warehouse.is_active ? 'Yes' : 'No'}</td>
                            <td className="border border-popover px-4 py-3">{formatDateTime(warehouse.created_at)}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={`/warehouse/add-warehouse/${warehouse.id}`}>
                                            <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                            No Warehouse found. Try creating one from the Add Warehouse button.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
