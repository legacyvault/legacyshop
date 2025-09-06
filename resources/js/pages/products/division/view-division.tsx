import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PencilLine, Trash2Icon } from 'lucide-react';

const stockHistory = [
    {
        id: 1,
        date: '2025-09-03 09:16:26',
        stock: '12',
    },
    {
        id: 1,
        date: '2025-09-01 09:16:26',
        stock: '10',
    },
];

export default function ViewDivision() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Product - Division - View',
            href: '/products/subcategory/viewsub',
        },
    ];

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product - Sub Category - View" />
            <div className="min-h-screen bg-background p-6">
                <div className="space-y-6">
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </button>
                    </div>
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="mb-2 text-3xl font-bold text-foreground">Division Details</h1>
                    </div>

                    {/* Total Stocks Card */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="text-center">
                            <h2 className="mb-2 text-lg font-semibold text-card-foreground">Total Stocks</h2>
                            <div className="text-4xl font-bold text-primary">12</div>
                        </div>
                    </div>

                    {/* Stock Information Card */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-6 border-b border-border pb-2 text-xl font-semibold text-card-foreground">Division Information</h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Name */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Name</h3>
                                <p className="text-lg font-semibold text-card-foreground">Value</p>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 md:col-span-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Description</h3>
                                <p className="leading-relaxed font-semibold text-card-foreground">Value</p>
                            </div>

                            {/* Unit */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Unit</h3>
                                <p className="text-lg font-semibold text-card-foreground">Value</p>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Category</h3>
                                <p className="text-lg font-semibold text-card-foreground">Value</p>
                            </div>

                            {/* Sub Category */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Sub Category</h3>
                                <p className="text-lg font-semibold text-card-foreground">Value</p>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Price</h3>
                                <p className="text-xl font-bold text-primary">Rp. {formatRupiah('200000')}</p>
                            </div>

                            {/* discount */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Discount</h3>
                                <p className="text-xl font-bold text-primary">10 %</p>
                            </div>
                        </div>
                    </div>

                    {/* Stock History Table */}
                    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <div className="border-b border-border p-6">
                            <h2 className="text-xl font-semibold text-card-foreground">Stock Purchase History</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Track of all stock purchases and additions</p>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Add Stock
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Stock Added
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stockHistory.length > 0 ? (
                                        stockHistory.map((item, index) => (
                                            <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-card-foreground">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">{formatDate(item.date)}</td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                    <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                        +{item.stock.toLocaleString()} units
                                                    </span>
                                                </td>
                                                {index === 0 ? (
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                        <div className="flex gap-4">
                                                            <PencilLine></PencilLine>
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
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                No stock purchase history available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
