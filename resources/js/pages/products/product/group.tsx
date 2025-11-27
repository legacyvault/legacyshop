import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type ProductGroup = {
    id: string;
    name: string;
    hierarchy: string[];
    items: number;
    weight: string;
    weightUnit: string;
    updatedAt: string;
    cover?: string;
    createdBy?: string;
};

const mockGroups: ProductGroup[] = [
    {
        id: 'grp-001',
        name: 'Starter pack / 500ml',
        hierarchy: ['Collection A', 'Sub collection 1', 'Category: Drinks', 'Subcat: Ready to serve', 'Option: Cold', 'Variant: Mint'],
        items: 6,
        weight: '500',
        weightUnit: 'gram',
        updatedAt: '2024-06-08T08:00:00Z',
        createdBy: 'Ann',
    },
    {
        id: 'grp-002',
        name: 'Travel minis',
        hierarchy: ['Collection A', 'Sub collection 2', 'Category: Accessories', 'Subcat: Travel'],
        items: 4,
        weight: '320',
        weightUnit: 'gram',
        updatedAt: '2024-06-05T12:00:00Z',
        createdBy: 'Irfan',
    },
    {
        id: 'grp-003',
        name: 'Family size box',
        hierarchy: ['Collection B', 'Sub collection Kitchen', 'Category: Dry goods'],
        items: 8,
        weight: '2.5',
        weightUnit: 'kilogram',
        updatedAt: '2024-05-28T10:00:00Z',
        createdBy: 'Nadia',
    },
];

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));

export default function GroupProductList() {
    const { productGroups } = usePage<SharedData>().props as SharedData & { productGroups?: ProductGroup[] };

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

    const groups = useMemo(() => (productGroups?.length ? productGroups : mockGroups), [productGroups]);

    const filteredGroups = useMemo(
        () =>
            groups.filter((group) => {
                const matchesSearch =
                    query.trim().length === 0 ||
                    group.name.toLowerCase().includes(query.toLowerCase()) ||
                    group.hierarchy.some((h) => h.toLowerCase().includes(query.toLowerCase()));
                return matchesSearch;
            }),
        [groups, query, statusFilter],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products - Groups',
            href: '/products/product/group',
        },
    ];

    const renderHierarchy = (hierarchy: string[]) => hierarchy.join(' • ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Groups" />

            <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Product groups</h1>
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
                                    onChange={(e) => setQuery(e.target.value)}
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
                                    {filteredGroups.length ? (
                                        filteredGroups.map((group) => (
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
                                                <td className="px-4 py-3 text-muted-foreground">{renderHierarchy(group.hierarchy)}</td>
                                                <td className="px-4 py-3 font-semibold">{group.items}</td>
                                                <td className="px-4 py-3">
                                                    {group.weight} {group.weightUnit}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatDate(group.updatedAt)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href="/products/product/group/create">Edit</Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            Open
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                No groups found. Try adjusting your filters or create a new group.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 lg:hidden">
                            {filteredGroups.length ? (
                                filteredGroups.map((group) => (
                                    <div key={group.id} className="rounded-lg border p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">ID: {group.id}</p>
                                                <h3 className="text-lg font-semibold">{group.name}</h3>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">{renderHierarchy(group.hierarchy)}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                            <span className="rounded-full bg-muted px-3 py-1">Items: {group.items}</span>
                                            <span className="rounded-full bg-muted px-3 py-1">
                                                Weight: {group.weight} {group.weightUnit}
                                            </span>
                                            <span className="rounded-full bg-muted px-3 py-1">Updated {formatDate(group.updatedAt)}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Button size="sm" asChild>
                                                <Link href="/products/product/group/create">Edit</Link>
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                                    No groups match your filters.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
