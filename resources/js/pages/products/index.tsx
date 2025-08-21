import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head, Link } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

const categories = [
    { id: 1, name: "pokemon" },
    { id: 2, name: "one piece" },
];

const types = [
    { id: 1, name: "case" },
    { id: 2, name: "extended art" },
]

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
        type: 'extended art'
        
    }
]

export default function Products(){
    return(
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={breadcrumbs[0].title} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div>
                        <span>Categories</span>
                        <CategoriesTable/>
                    </div>
                    <div>
                        <span>Type</span>
                        <TypesTable/>
                    </div>
                </div>
                <div className="min-h-[100vh] flex-1">
                    <div className="flex items-center justify-between">
                        <span>Products</span>
                        <Button>
                            <Link href={'/add-product'}>Add Product</Link>
                        </Button>

                    </div>
                    <ProductsTable/>
                </div>
            </div>
        </AppLayout>
    )
}

function CategoriesTable(){
    return(
        <table className="min-w-full border-collapse text-sm mt-4">
        <thead>
        <tr className="bg-sidebar-accent">
            <th className="border border-popover px-4 py-3 text-left font-medium">
            #
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
            Name
            </th>
            <th className="border border-popover px-4 py-3 text-right font-medium">
            Actions
            </th>
        </tr>
        </thead>
        <tbody>
        {categories.map((cat, i) => (
            <tr key={cat.id} className="hover:bg-gray-50">
            <td className="border border-popover px-4 py-3">{i+1}</td>
            <td className="border border-popover px-4 py-3">{cat.name}</td>
            <td className="border border-popover px-4 py-3 text-right">
                <DropdownMenu>
                <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
                    ⋮
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer">
                    Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-red-600">
                    Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </td>
            </tr>
        ))}
        </tbody>
        </table>
    )
}

function TypesTable(){
    return(
        <table className="min-w-full border-collapse text-sm mt-4">
        <thead>
        <tr className="bg-sidebar-accent">
            <th className="border border-popover px-4 py-3 text-left font-medium">
            #
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
            Name
            </th>
            <th className="border border-popover px-4 py-3 text-right font-medium">
            Actions
            </th>
        </tr>
        </thead>
        <tbody>
        {types.map((type, i) => (
            <tr key={type.id} className="hover:bg-gray-50">
            <td className="border border-popover px-4 py-3">{i+1}</td>
            <td className="border border-popover px-4 py-3">{type.name}</td>
            <td className="border border-popover px-4 py-3 text-right">
                <DropdownMenu>
                <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
                    ⋮
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer">
                    Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-red-600">
                    Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </td>
            </tr>
        ))}
        </tbody>
        </table>
    )
}

function ProductsTable(){
    return(
        <table className="min-w-full border-collapse text-sm mt-4">
        <thead>
        <tr className="bg-sidebar-accent">
            <th className="border border-popover px-4 py-3 text-left font-medium">
            #
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Name
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Description
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Category
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Type
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Price
            </th>
            <th className="border border-popover px-4 py-3 text-left font-medium">
                Quantity
            </th>
            <th className="border border-popover px-4 py-3 text-right font-medium">
            Actions
            </th>
        </tr>
        </thead>
        <tbody>
        {products.map((prod, i) => (
            <tr key={prod.id} className="hover:bg-gray-50">
            <td className="border border-popover px-4 py-3">{i+1}</td>
            <td className="border border-popover px-4 py-3">{prod.name}</td>
            <td className="border border-popover px-4 py-3">{prod.description}</td>
            <td className="border border-popover px-4 py-3">{prod.category}</td>
            <td className="border border-popover px-4 py-3">{prod.type}</td>
            <td className="border border-popover px-4 py-3">{prod.price}</td>
            <td className="border border-popover px-4 py-3">{prod.qty}</td>
            <td className="border border-popover px-4 py-3 text-right">
                <DropdownMenu>
                <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
                    ⋮
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer">
                    Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-red-600">
                    Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </td>
            </tr>
        ))}
        </tbody>
        </table>
    )
}