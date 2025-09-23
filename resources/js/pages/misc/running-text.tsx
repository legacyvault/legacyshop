import RunnigTextDialog from '@/components/running-text-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IRunningText, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Misc - Running Text',
        href: '/misc/view-running-text',
    },
];

interface Form {
    running_text: string;
    is_active: boolean;
}

interface PropsTable {
    runningText: IRunningText[];
}

type EditCatForm = Form & {
    id: string;
};

export default function RunningText() {
    const { runningText } = usePage<SharedData>().props;

    const { data, setData, post, errors } = useForm<Required<Form>>({
        running_text: '',
        is_active: false,
    });

    const [openAdd, isOpenAdd] = useState(false);

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('add-runningtext'), {
            onSuccess: () => isOpenAdd(false),
            onError: () => isOpenAdd(true),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Misc - Running Text" />
            <div className="p-4">
                <Button onClick={() => isOpenAdd(true)}>Add Running Text</Button>
                <RunnigTextDialog
                    data={data}
                    setData={setData}
                    open={openAdd}
                    isOpen={isOpenAdd}
                    type={'add'}
                    onSubmit={catSubmitHandler}
                    errors={errors}
                />
                <RunningTextTable runningText={runningText} />
            </div>
        </AppLayout>
    );
}

function RunningTextTable({ runningText }: PropsTable) {
    const { data, setData, post, errors } = useForm<Required<EditCatForm>>({
        id: '',
        running_text: '',
        is_active: false,
    });

    const [openEditCat, isOpenEditCat] = useState(false);
    const [openDelCat, isOpenDelCat] = useState(false);
    const [selectedText, setSelectedText] = useState<IRunningText>();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelectedText(selectedItem);

        if (type === 'edit') isOpenEditCat(true);
        if (type === 'delete') isOpenDelCat(true);
    };

    const catSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('edit-runningtext'), {
            onSuccess: () => {
                isOpenEditCat(false);
            },
            onError: () => {
                isOpenEditCat(true);
            },
        });
    };

    return (
        <>
            <RunnigTextDialog
                data={data}
                setData={setData}
                open={openEditCat}
                isOpen={isOpenEditCat}
                errors={errors}
                type="edit"
                runningText={selectedText}
                onSubmit={catSubmitHandler}
            />
            {/* <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} /> */}

            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Text</th>
                        <th className="cursor-pointer border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Active</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {runningText.length > 0 ? (
                        runningText.map((text, i) => (
                            <tr key={text.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{i + 1}</td>
                                <td className="border border-popover px-4 py-3">{text.running_text}</td>
                                <td className="border border-popover px-4 py-3">{text.is_active ? 'Yes' : 'No'}</td>
                                <td className="border border-popover px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                onClick={() => itemHandler('edit', text)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                onClick={() => itemHandler('delete', text)}
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
                            <td colSpan={4} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                No Running Text Found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}
