import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IProductGroup, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Layers } from 'lucide-react';

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));

const getHierarchy = (group: IProductGroup): string[] => {
    const names = new Set<string>();

    group.products?.forEach((product) => {
        product.units?.forEach((unit) => names.add(unit.name));
        product.sub_units?.forEach((sub) => names.add(sub.name));
        product.categories?.forEach((cat) => names.add(cat.name));
        product.subcategories?.forEach((subcat) => names.add(subcat.name));
        product.divisions?.forEach((division) => names.add(division.name));
        product.variants?.forEach((variant) => names.add(variant.name));
    });

    return Array.from(names);
};

export default function ViewGroup() {
    const { productGroup } = usePage<SharedData>().props as SharedData & { productGroup: IProductGroup };

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
                                                    {product.units?.map((u) => u.name).join(', ') || '—'}
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
            </div>
        </AppLayout>
    );
}
