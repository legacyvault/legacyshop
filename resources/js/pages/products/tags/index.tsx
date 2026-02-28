import Empty from '@/components/empty';
import TagsDialog from '@/components/tags-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IRootTags, ITags, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
    is_show: number | boolean;
}

interface PropsTagsTable {
    tagsPaginated: IRootTags;
    filters: any;
}

type EditTagsForm = TagsForm & {
    id: string;
};

export default function Tags() {
    const { tagsPaginated, filters } = usePage<SharedData>().props as any;

    const { data, setData, post, errors } = useForm<Required<TagsForm>>({
        name: '',
        description: '',
        is_show: 0,
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
                <TagsTable tagsPaginated={tagsPaginated} filters={filters} />
            </div>
        </AppLayout>
    );
}

function TagsTable({ tagsPaginated, filters }: PropsTagsTable) {
    const { data, setData, post, errors } = useForm<Required<EditTagsForm>>({
        id: '',
        name: '',
        description: '',
        is_show: 0,
    });

    const [openEdit, isOpenEdit] = useState(false);

    const [selectedTags, setSelectedTags] = useState<ITags | undefined>();

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

    const currentPage = tagsPaginated?.current_page ?? 1;
    const perPage = tagsPaginated?.per_page ?? 15;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        router.get('/products/tags', { ...filters, q, page: 1 }, { preserveState: true, replace: true });
    };

    const toggleSort = (column: 'id' | 'name' | 'description') => {
        const sort_by = column;
        const sort_dir = filters?.sort_by === column && filters?.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/products/tags', { ...filters, sort_by, sort_dir }, { preserveState: true, replace: true });
    };

    const goToPage = (page: number) => {
        router.get('/products/tags', { ...filters, page }, { preserveState: true, replace: true });
    };

    return (
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

            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {tagsPaginated?.total ? (
                        <>Showing {tagsPaginated.from ?? 0}-{tagsPaginated.to ?? 0} of {tagsPaginated.total}</>
                    ) : (
                        <>No results</>
                    )}
                </div>
                <input
                    type="text"
                    className="w-60 rounded border px-3 py-2 text-sm"
                    placeholder="Search name or description..."
                    defaultValue={filters?.q || ''}
                    onChange={handleSearch}
                />
            </div>

            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('id')}>
                            # {filters?.sort_by === 'id' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                            Name {filters?.sort_by === 'name' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground cursor-pointer" onClick={() => toggleSort('description')}>
                            Description {filters?.sort_by === 'description' ? (filters?.sort_dir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tagsPaginated?.data?.length > 0 ? (
                        tagsPaginated.data.map((tag: ITags, i: number) => (
                            <tr key={tag.id} className="hover:bg-gray-50">
                                <td className="border border-popover px-4 py-3">{(currentPage - 1) * perPage + i + 1}</td>
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
                                            <DropdownMenuItem
                                                className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                                onClick={() => {
                                                    if (!confirm(`Delete tag "${tag.name}"?`)) return;
                                                    router.delete(route('tag.delete', { id: tag.id }));
                                                }}
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
                                No tags found. Try adjusting your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                    Previous
                </Button>
                <span className="text-sm">Page {currentPage} of {tagsPaginated?.last_page ?? 1}</span>
                <Button variant="outline" disabled={currentPage >= (tagsPaginated?.last_page ?? 1)} onClick={() => goToPage(currentPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    );
}
