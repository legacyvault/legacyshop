import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type IDashboardSummary, type IProductHierarchySummary, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, type ChartOptions } from 'chart.js';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const formatCompactCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

export default function Dashboard() {
    const { summary } = usePage<SharedData & { summary?: IDashboardSummary }>().props;
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const trendLabels = summary?.trend.labels ?? [];
    const trendTotals = summary?.trend.totals ?? [];
    const productHierarchy = summary?.productHierarchy ?? [];

    const chartData = useMemo(
        () => ({
            labels: trendLabels,
            datasets: [
                {
                    label: 'Sales (IDR)',
                    data: trendTotals,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    fill: true,
                },
            ],
        }),
        [trendLabels, trendTotals],
    );

    const chartOptions = useMemo<ChartOptions<'line'>>(
        () =>
            ({
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => formatCurrency(Number(context.parsed.y ?? context.parsed)),
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                        },
                    },
                    y: {
                        grid: { drawBorder: false },
                        ticks: {
                            callback: (value) => formatCompactCurrency(Number(value)),
                        },
                    },
                },
            }) as ChartOptions<'line'>,
        [],
    );

    const kpis = summary?.kpis;
    const periodTotal = trendTotals.reduce((acc, value) => acc + value, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <KpiCard title="Total Sales" value={formatCurrency(kpis?.totalRevenue ?? 0)} helper="Last 7 days" />
                    <KpiCard title="Total Orders" value={(kpis?.totalOrders ?? 0).toLocaleString('id-ID')} helper="All orders" />
                    <KpiCard title="Average Order Value" value={formatCurrency(kpis?.averageOrderValue ?? 0)} helper="Paid orders only" />
                    <KpiCard title="Today's Sales" value={formatCurrency(kpis?.todayRevenue ?? 0)} helper={`${kpis?.todayOrders ?? 0} orders`} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 lg:col-span-2 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Sales Trend</p>
                                <h3 className="text-xl font-semibold">Last 7 Days</h3>
                            </div>
                            <span className="text-sm text-muted-foreground">IDR</span>
                        </div>
                        <div className="h-80">
                            {isClient ? (
                                <Line data={chartData} options={chartOptions} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <h3 className="text-xl font-semibold">Quick Summary</h3>
                        <dl className="mt-6 space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">7-day Sales</dt>
                                <dd className="font-medium">{formatCurrency(periodTotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Orders Today</dt>
                                <dd className="font-medium">{kpis?.todayOrders ?? 0}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Order Tracking</p>
                            <h3 className="text-xl font-semibold">Product Hierarchy (Last 30 Days)</h3>
                            <p className="text-xs text-muted-foreground">Paid orders only · Showing top 15 combinations by quantity</p>
                        </div>
                    </div>
                    {productHierarchy.length ? (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-normal">#</th>
                                        <th className="py-2 pr-4 font-normal">Product</th>
                                        <th className="py-2 pr-4 font-normal">Hierarchy</th>
                                        <th className="py-2 pr-4 text-right font-normal">Qty Ordered</th>
                                        <th className="py-2 pr-4 text-right font-normal">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productHierarchy.map((node, index) => (
                                        <tr
                                            key={`${node.product_id ?? node.product_name}-${index}`}
                                            className="border-t border-sidebar-border/60 last:border-b"
                                        >
                                            <td className="py-3 pr-4 text-muted-foreground">{index + 1}</td>
                                            <td className="py-3 pr-4">
                                                <p className="font-medium">{node.product_name}</p>
                                                <p className="text-xs text-muted-foreground">{node.unit_name ?? '—'}</p>
                                            </td>
                                            <td className="py-3 pr-4 text-sm text-muted-foreground">{formatHierarchyPath(node)}</td>
                                            <td className="py-3 pr-4 text-right font-medium">{node.total_quantity.toLocaleString('id-ID')}</td>
                                            <td className="py-3 pr-4 text-right font-medium">{formatCurrency(node.total_revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="mt-6 text-sm text-muted-foreground">No paid orders recorded in the last 30 days.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function KpiCard({ title, value, helper }: { title: string; value: string; helper?: string }) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>{helper}</span>
            </div>
        </div>
    );
}

const formatHierarchyPath = (node: IProductHierarchySummary) => {
    const segments = [node.category_name, node.sub_category_name, node.division_name, node.variant_name].filter(Boolean);
    return segments.length ? segments.join(' / ') : '—';
};
