import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UnitsDialog from '@/components/units-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Unit',
        href: '/products/unit',
    },
];

const units = [
    { id: 1, name: 'Design' },
    { id: 2, name: 'Wonder Legacy TCG Accessories' },
];

export default function Unit() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Unit" />
            <div className="p-4">
                <UnitsTable />
            </div>
        </AppLayout>
    );
}

function UnitsTable() {
    const [openEdit, isOpenEdit] = useState(false);
    const [openDel, isOpenDel] = useState(false);
    const [selected, setSelected] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelected(selectedItem);

        if (type === 'edit') isOpenEdit(true);
        if (type === 'delete') isOpenDel(true);
    };

    const SubmitHandler = (data: any, type: 'add' | 'delete' | 'edit') => {
        console.log(type);
        console.log(data);
    };

    return (
        <>
            <UnitsDialog open={openEdit} isOpen={isOpenEdit} type="edit" unit={selected} onSubmit={SubmitHandler} />
            <UnitsDialog open={openDel} isOpen={isOpenDel} type="delete" unit={selected} onSubmit={SubmitHandler} />

            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {units.map((unit, i) => (
                        <tr key={unit.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{i + 1}</td>
                            <td className="border border-popover px-4 py-3">{unit.name}</td>
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
                    ))}
                </tbody>
            </table>
        </>
    );
}
