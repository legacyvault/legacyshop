import Empty from '@/components/empty';
import TagsDialog from '@/components/tags-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ITags, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Tags',
        href: '/products/tags',
    },
];

interface TagsForm {
    name: string;
    description: string;
}

interface PropsTagsTable {
    tags: ITags[];
}

type EditTagsForm = TagsForm & {
    id: string;
};

export default function Tags() {
    const { tags } = usePage<SharedData>().props;

    const { data, setData, post, errors } = useForm<Required<TagsForm>>({
        name: '',
        description: '',
    });

    const [openAdd, isOpenAdd] = useState(false);

    const submitHandler = (e: any) => {
        e.preventDefault();
        post(route('tag.create'), {
            onSuccess: () => {
                isOpenAdd(false);
            },
            onError: () => {
                isOpenAdd(true);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Tags" />
            <TagsDialog data={data} setData={setData} open={openAdd} isOpen={isOpenAdd} errors={errors} type="add" onSubmit={submitHandler} />
            <div className="p-4">
                <Button onClick={() => isOpenAdd(true)}>Add Tags</Button>
                <TagsTable tags={tags} />
            </div>
        </AppLayout>
    );
}

function TagsTable({ tags }: PropsTagsTable) {
    const { data, setData, post, errors } = useForm<Required<EditTagsForm>>({
        id: '',
        name: '',
        description: '',
    });

    const [openEdit, isOpenEdit] = useState(false);

    const [selectedTags, setSelectedTags] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedItem: any) => {
        setSelectedTags(selectedItem);

        if (type === 'edit') isOpenEdit(true);
    };

    const submitHandler = (e: any) => {
        e.preventDefault();
        post(route('tag.update'), {
            onSuccess: () => {
                isOpenEdit(false);
            },
            onError: () => {
                isOpenEdit(true);
            },
        });
    };

    return (
        <>
            {tags.length > 0 ? (
                <>
                    <TagsDialog
                        data={data}
                        setData={setData}
                        open={openEdit}
                        isOpen={isOpenEdit}
                        errors={errors}
                        type="edit"
                        onSubmit={submitHandler}
                        tags={selectedTags}
                    />
                    {/* <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} /> */}

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
                            {tags.map((tag: any, i: number) => (
                                <tr key={tag.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
                                    <td className="border border-popover px-4 py-3">{tag.name}</td>
                                    <td className="border border-popover px-4 py-3">{tag.description}</td>
                                    <td className="border border-popover px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                    onClick={() => itemHandler('edit', tag)}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                {/* <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                    onClick={() => itemHandler('delete', cat)}
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
                    <Empty title="No Data Yet" description="Get started by creating unit." />
                </>
            )}
        </>
    );
}
