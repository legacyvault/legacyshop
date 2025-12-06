import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IProductGroup, IRootProductGroups, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

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

const getWeightLabel = (group: IProductGroup) => {
    const product = group.products?.[0];
    if (!product || product.product_weight === null || product.product_weight === undefined) return '—';
    return `${product.product_weight} gram`;
};

const getProductCount = (group: IProductGroup) => group.products_count ?? group.products?.length ?? 0;

export default function GroupProductList() {
    const { productGroupsPaginated, filters } = usePage<SharedData>().props as SharedData & {
        productGroupsPaginated?: IRootProductGroups;
        filters?: Record<string, any>;
    };

    const [query, setQuery] = useState<string>((filters as any)?.q ?? '');
    const groups = useMemo(() => productGroupsPaginated?.data ?? [], [productGroupsPaginated]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Groups',
            href: '/products/product/group',
        },
    ];

    const handleSearch = (value: string) => {
        setQuery(value);
        router.get(
            '/products/product/group',
            { ...(filters || {}), q: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            '/products/product/group',
            { ...(filters || {}), q: query, page },
            { preserveState: true, replace: true },
        );
    };

    const paginationSummary = useMemo(() => {
        if (!productGroupsPaginated?.total) return 'No groups available';
        return `Showing ${productGroupsPaginated.from ?? 0}-${productGroupsPaginated.to ?? 0} of ${
            productGroupsPaginated.total
        }`;
    }, [productGroupsPaginated]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Groups" />

            <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Product groups</h1>
                        <p className="text-sm text-muted-foreground">{paginationSummary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href="/products/product/group/create">Create group</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Groups table</CardTitle>
                            <CardDescription>Search, filter, and manage groups in one place.</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search group or hierarchy..."
                                    className="pl-9"
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="hidden overflow-hidden rounded-lg border lg:block">
                            <table className="min-w-full divide-y text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Group</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Hierarchy</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Items</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Weight</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Updated</th>
                                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {groups.length ? (
                                        groups.map((group) => {
                                            const hierarchy = getHierarchy(group);
                                            return (
                                                <tr key={group.id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                                                {group.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{group.name}</p>
                                                                <p className="text-xs text-muted-foreground">ID: {group.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {hierarchy.length ? hierarchy.join(' • ') : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold">{getProductCount(group)}</td>
                                                    <td className="px-4 py-3">{getWeightLabel(group)}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(group.updated_at)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={`/products/product/group/edit/${group.id}`}>Edit</Link>
                                                            </Button>
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/products/product/group/view/${group.id}`}>Open</Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                No groups found. Try adjusting your filters or create a new group.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 lg:hidden">
                            {groups.length ? (
                                groups.map((group) => {
                                    const hierarchy = getHierarchy(group);
                                    return (
                                        <div key={group.id} className="rounded-lg border p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">ID: {group.id}</p>
                                                    <h3 className="text-lg font-semibold">{group.name}</h3>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {hierarchy.length ? hierarchy.join(' • ') : 'No hierarchy data yet'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                                <span className="rounded-full bg-muted px-3 py-1">Items: {getProductCount(group)}</span>
                                                <span className="rounded-full bg-muted px-3 py-1">Weight: {getWeightLabel(group)}</span>
                                                <span className="rounded-full bg-muted px-3 py-1">
                                                    Updated {formatDate(group.updated_at)}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Button size="sm" asChild>
                                                    <Link href={`/products/product/group/edit/${group.id}`}>Edit</Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/products/product/group/view/${group.id}`}>Open</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                                    No groups match your filters.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{paginationSummary}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={(productGroupsPaginated?.current_page ?? 1) <= 1}
                                    onClick={() => goToPage((productGroupsPaginated?.current_page ?? 1) - 1)}
                                >
                                    Previous
                                </Button>
                                <span>
                                    Page {productGroupsPaginated?.current_page ?? 1} of {productGroupsPaginated?.last_page ?? 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        (productGroupsPaginated?.current_page ?? 1) >= (productGroupsPaginated?.last_page ?? 1)
                                    }
                                    onClick={() => goToPage((productGroupsPaginated?.current_page ?? 1) + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
