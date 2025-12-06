import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IProductGroup, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Layers } from 'lucide-react';
import { useState } from 'react';

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));

const getHierarchy = (group: IProductGroup): string[] => {
    const names = new Set<string>();

    group.products?.forEach((product) => {
        if (product.unit?.name) names.add(product.unit.name);
        if (product.sub_unit?.name) names.add(product.sub_unit.name);
        product.categories?.forEach((cat) => names.add(cat.name));
        product.subcategories?.forEach((subcat) => names.add(subcat.name));
        product.divisions?.forEach((division) => names.add(division.name));
        product.variants?.forEach((variant) => names.add(variant.name));
    });

    return Array.from(names);
};

export default function ViewGroup() {
    const { productGroup } = usePage<SharedData>().props as SharedData & { productGroup: IProductGroup };

    const [openAddStock, isOpenAddStock] = useState(false);

    if (!productGroup) return null;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Groups',
            href: '/products/product/group',
        },
        {
            title: productGroup.name,
            href: `/products/product/group/view/${productGroup.id}`,
        },
    ];

    const hierarchy = getHierarchy(productGroup);
    const products = productGroup.products ?? [];

    return (
        <>
            {/* <AddStockDialog
                open={openAddStock}
                isOpen={isOpenAddStock}
                type={'add'}
                onSubmit={submitHandlder}
                errors={errors}
                data={data}
                setData={setData}
                subcatId={selectedSubcat.id}
            />

            <AddStockDialog
                open={openEditStock}
                isOpen={isOpenEditStock}
                type={'edit'}
                onSubmit={editSubmitHandler}
                errors={errors}
                data={data}
                setData={setData}
                subcatId={selectedSubcat.id}
                stock={selectedStock}
            /> */}
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Group - ${productGroup.name}`} />

                <div className="space-y-6 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Layers className="size-4" />
                            <span className="text-sm">Group details</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/products/product/group">
                                    <ArrowLeft className="mr-2 size-4" />
                                    Back to groups
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/products/product/group/edit/${productGroup.id}`}>Edit group</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{productGroup.name}</span>
                                    <span className="text-sm font-normal text-muted-foreground">ID: {productGroup.id}</span>
                                </CardTitle>
                                <CardDescription>Summary of the selected product group.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="text-xs text-muted-foreground uppercase">Products</p>
                                        <p className="text-2xl font-semibold">{productGroup.products_count ?? products.length}</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="text-xs text-muted-foreground uppercase">Last updated</p>
                                        <p className="text-lg font-semibold">{formatDate(productGroup.updated_at)}</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="text-xs text-muted-foreground uppercase">Created at</p>
                                        <p className="text-lg font-semibold">{formatDate(productGroup.created_at)}</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="text-xs text-muted-foreground uppercase">Hierarchy</p>
                                        <p className="text-sm font-semibold">
                                            {hierarchy.length ? hierarchy.join(' • ') : 'No hierarchy data available'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Quick links</CardTitle>
                                <CardDescription>Shortcuts to manage this group.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href={`/products/product/group/edit/${productGroup.id}`}>
                                        Edit this group
                                        <ExternalLink className="size-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href="/products/product/group/create">
                                        Create new group
                                        <ExternalLink className="size-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Products in this group</CardTitle>
                            <CardDescription>All products currently attached to this group.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {products.length ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">SKU</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Weight</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Collections</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Updated</th>
                                                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {products.map((product) => (
                                                <tr key={product.id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-medium">{product.product_name}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{product.product_sku ?? '—'}</td>
                                                    <td className="px-4 py-3">{product.product_weight ? `${product.product_weight} gram` : '—'}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {product.unit?.name || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(product.updated_at)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/products/product/viewprod/${product.id}`}>View</Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                                    No products are linked to this group yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock History Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Purchase History Bulk</CardTitle>
                            <CardDescription>Track of all stock purchases</CardDescription>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                    onClick={() => isOpenAddStock(true)}
                                >
                                    Add Stock
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Stock Added
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                No stock purchase history available
                                            </td>
                                        </tr>
                                        {/* {selectedSubcat.stocks.length > 0 ? (
                                        selectedSubcat.stocks.map((item, index) => (
                                            <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-card-foreground">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                    {formatDate(item.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                    <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                        +{item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">{item.remarks}</td>
                                                {index === 0 ? (
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                        <div className="flex gap-4">
                                                            <PencilLine onClick={() => editStockHandler(item, 'edit')}></PencilLine>
                                                            <Trash2Icon className="text-destructive"></Trash2Icon>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <td></td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                No stock purchase history available
                                            </td>
                                        </tr>
                                    )} */}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}

// function AddStockDialog({ open, isOpen, type, onSubmit, data, setData, errors, subcatId, stock }: IDialog) {
//     useEffect(() => {
//         if (open) {
//             if (type === 'edit') {
//                 setData('id', stock!.id);
//                 setData('sub_category_id', subcatId);
//                 setData('quantity', stock!.quantity.toString());
//                 setData('remarks', stock!.remarks);
//             } else if (type === 'add') {
//                 setData('sub_category_id', subcatId);
//                 setData('quantity', '');
//                 setData('remarks', '');
//             }
//         }
//     }, [open, type]);
//     return (
//         <Dialog open={open} onOpenChange={isOpen}>
//             <DialogPortal>
//                 <DialogOverlay />
//                 <DialogContent>
//                     <DialogTitle className="capitalize">{type} Categories</DialogTitle>
//                     {type !== 'delete' ? (
//                         <form method="POST" onSubmit={onSubmit}>
//                             <div className="mb-6">
//                                 <label className="mb-2 block text-sm font-medium">Quantity *</label>
//                                 <input
//                                     type="text"
//                                     value={data.quantity}
//                                     onChange={(e) => setData('quantity', e.target.value)}
//                                     className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
//                                         errors.quantity ? 'border-red-500' : 'border-gray-200'
//                                     }`}
//                                     placeholder="0"
//                                 />
//                                 {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
//                             </div>
//                             <div className="mb-6">
//                                 <label className="mb-2 block text-sm font-medium">Remarks</label>
//                                 <input
//                                     type="text"
//                                     value={data.remarks}
//                                     onChange={(e) => setData('remarks', e.target.value)}
//                                     className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
//                                         errors.remarks ? 'border-red-500' : 'border-gray-200'
//                                     }`}
//                                     placeholder="Enter Remarks"
//                                 />
//                                 {errors.remarks && <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>}
//                             </div>
//                             <DialogClose asChild>
//                                 <Button type="submit" className="capitalize">
//                                     {type}
//                                 </Button>
//                             </DialogClose>
//                         </form>
//                     ) : (
//                         <>
//                             <span>Are you sure want to delete this category?</span>
//                             <DialogClose asChild>
//                                 <Button className="capitalize">{type}</Button>
//                             </DialogClose>
//                         </>
//                     )}
//                 </DialogContent>
//             </DialogPortal>
//         </Dialog>
//     );
// }
