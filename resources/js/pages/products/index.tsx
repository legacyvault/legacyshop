import CategoriesDialog from '@/components/categories-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

const categories = [
    { id: 1, name: 'pokemon', description: 'isinya untuk pokemon' },
    { id: 2, name: 'one piece', description: 'isinya untuk one piece' },
];

const types = [
    { id: 1, name: 'case' },
    { id: 2, name: 'extended art' },
];

const products = [
    {
        id: 1,
        name: 'Case Metal',
        image: '',
        description: 'description dari case metal ini adalah long text',
        price: 20000,
        discount: 0.2,
        qty: 2,
        category: 'pokemon',
        type: 'extended art',
    },
];

export default function Products() {
    const [openAddCat, isOpenAddCat] = useState(false);

    const catSubmitHandler = (data: any, type: 'add' | 'delete' | 'edit') => {
        console.log(type);
        console.log(data);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div>
                        <div className="flex items-center justify-between">
                            <span>Categories</span>
                            <Button onClick={() => isOpenAddCat(true)}>Add Categories</Button>
                            <CategoriesDialog open={openAddCat} isOpen={isOpenAddCat} type={'add'} onSubmit={catSubmitHandler} />
                        </div>
                        <CategoriesTable />
                    </div>
                    <div>
                        <span className="pt-4">Type</span>
                        <div className="mt-7">
                            <TypesTable />
                        </div>
                    </div>
                </div>
                <div className="min-h-[100vh] flex-1">
                    <div className="flex items-center justify-between">
                        <span>Products</span>
                        <Button>
                            <Link href={'/add-product'}>Add Product</Link>
                        </Button>
                    </div>
                    <ProductsTable />
                </div>
            </div>
        </AppLayout>
    );
}

function CategoriesTable() {
    const [openEditCat, isOpenEditCat] = useState(false);
    const [openDelCat, isOpenDelCat] = useState(false);
    const [selectedCat, setSelectedCat] = useState();

    const itemHandler = (type: 'edit' | 'delete', selectedCatItem: any) => {
        setSelectedCat(selectedCatItem);

        if (type === 'edit') isOpenEditCat(true);
        if (type === 'delete') isOpenDelCat(true);
    };

    const catSubmitHandler = (data: any, type: 'add' | 'delete' | 'edit') => {
        console.log(type);
        console.log(data);
    };

    return (
        <>
            <CategoriesDialog open={openEditCat} isOpen={isOpenEditCat} type="edit" category={selectedCat} onSubmit={catSubmitHandler} />
            <CategoriesDialog open={openDelCat} isOpen={isOpenDelCat} type="delete" category={selectedCat} onSubmit={catSubmitHandler} />

            <table className="mt-4 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-sidebar-accent">
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                        <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                        <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat, i) => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{i + 1}</td>
                            <td className="border border-popover px-4 py-3">{cat.name}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <DropdownMenuItem
                                            className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                            onClick={() => itemHandler('edit', cat)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100"
                                            onClick={() => itemHandler('delete', cat)}
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

function TypesTable() {
    return (
        <table className="mt-4 min-w-full border-collapse text-sm">
            <thead>
                <tr className="bg-sidebar-accent">
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                    <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                </tr>
            </thead>
            <tbody>
                {types.map((type, i) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                        <td className="border border-popover px-4 py-3">{i + 1}</td>
                        <td className="border border-popover px-4 py-3">{type.name}</td>
                        <td className="border border-popover px-4 py-3 text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function ProductsTable() {
    return (
        <table className="mt-4 min-w-full border-collapse text-sm">
            <thead>
                <tr className="bg-sidebar-accent">
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Category</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Type</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Quantity</th>
                    <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                </tr>
            </thead>
            <tbody>
                {products.map((prod, i) => (
                    <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="border border-popover px-4 py-3">{i + 1}</td>
                        <td className="border border-popover px-4 py-3">{prod.name}</td>
                        <td className="border border-popover px-4 py-3">{prod.description}</td>
                        <td className="border border-popover px-4 py-3">{prod.category}</td>
                        <td className="border border-popover px-4 py-3">{prod.type}</td>
                        <td className="border border-popover px-4 py-3">{prod.price}</td>
                        <td className="border border-popover px-4 py-3">{prod.qty}</td>
                        <td className="border border-popover px-4 py-3 text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">
                                        <Link href={`/add-product/${prod.id}`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 text-red-600 hover:bg-gray-100">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
