import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UnitsDialog from '@/components/units-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IUnit, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Unit',
        href: '/products/unit',
    },
];

interface UnitForm {
    name: string;
    description: string;
}

type EditUnitForm = UnitForm & {
    id: string;
};

interface PropsUnitTable {
    units: IUnit[];
}

export default function Unit() {
    const { units } = usePage<SharedData>().props;

    const { data, setData, post, processing, errors } = useForm<Required<UnitForm>>({
        name: '',
        description: '',
    });

    const [openAdd, isOpenAdd] = useState(false);

    const submitHandler = (e: any) => {
        e.preventDefault();

        post(route('unit.create'), {
            onFinish: () => (Object.keys(errors).length === 0 ? isOpenAdd(false) : isOpenAdd(true)),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Unit" />
            <div className="p-4">
                {' '}
                <Button onClick={() => isOpenAdd(true)}>Add Unit</Button>
                <UnitsDialog open={openAdd} isOpen={isOpenAdd} type={'add'} onSubmit={submitHandler} data={data} setData={setData} errors={errors} />
                <div>
                    <UnitsTable units={units} />
                </div>
            </div>
        </AppLayout>
    );
}

function UnitsTable({ units }: PropsUnitTable) {
    const { data, setData, post, processing, errors } = useForm<Required<EditUnitForm>>({
        id: '',
        name: '',
        description: '',
    });

    const [openEdit, isOpenEdit] = useState(false);
    const [openDel, isOpenDel] = useState(false);
    const [selected, setSelected] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelected(selectedItem);

        if (type === 'edit') isOpenEdit(true);
        if (type === 'delete') isOpenDel(true);
    };

    const SubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('unit.update'), {
            onSuccess: () => {
                isOpenEdit(false); // close on success only
            },
            onError: () => {
                isOpenEdit(true);
            },
        });
    };

    return (
        <>
            {units.length > 0 ? (
                <>
                    <UnitsDialog
                        open={openEdit}
                        isOpen={isOpenEdit}
                        type="edit"
                        unit={selected}
                        onSubmit={SubmitHandler}
                        data={data}
                        setData={setData}
                        errors={errors}
                    />
                    {/* <UnitsDialog open={openDel} isOpen={isOpenDel} type="delete" unit={selected} onSubmit={SubmitHandler} /> */}

                    <table className="mt-4 min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent">
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit, i) => (
                                <tr key={unit.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
                                    <td className="border border-popover px-4 py-3">{unit.name}</td>
                                    <td className="border border-popover px-4 py-3">{unit.description}</td>
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
            ) : (
                <>
                    <Empty title="No Data Yet" description="Get started by creating unit." />
                </>
            )}
        </>
    );
}
