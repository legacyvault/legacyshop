import Empty from '@/components/empty';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ISubcats, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products - Sub Category',
        href: '/products/subcategory',
    },
];

interface PropsSubcatTable {
    subcats: ISubcats[];
}

export default function Subcategory() {
    const { subcats } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Sub Category" />
            <div className="p-4">
                <Button>
                    <Link href={'/products/subcategory/addsub'}>Add Sub Category</Link>
                </Button>
                <SubcategoriesTable subcats={subcats} />
            </div>
        </AppLayout>
    );
}

function SubcategoriesTable({ subcats }: PropsSubcatTable) {
    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    return (
        <>
            {subcats.length > 0 ? (
                <>
                    <table className="mt-4 min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent">
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Description</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Category</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Price</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Total Stocks</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subcats.map((subcat, i) => (
                                <tr key={subcat.id} className="hover:bg-gray-50">
                                    <td className="border border-popover px-4 py-3">{i + 1}</td>
                                    <td className="border border-popover px-4 py-3">{subcat.name}</td>
                                    <td className="border border-popover px-4 py-3">{subcat.description}</td>
                                    <td className="border border-popover px-4 py-3">{subcat.category.name}</td>
                                    <td className="border border-popover px-4 py-3">Rp. {formatRupiah(subcat.price.toString())}</td>
                                    <td className="border border-popover px-4 py-3">{subcat.discount}%</td>
                                    <td className="border border-popover px-4 py-3">{subcat.total_stock}</td>
                                    <td className="border border-popover px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                                <Link href={`/products/subcategory/viewsub/${subcat.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                                </Link>
                                                <Link href={`/products/subcategory/addsub/${subcat.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                                </Link>
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
            ) : (
                <>
                    <Empty title="No Data Yet" description="Get started by creating sub category." />
                </>
            )}
        </>
    );
}
