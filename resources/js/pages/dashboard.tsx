import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type DashboardRangePreset,
    type IDashboardSegment,
    type IDashboardSummary,
    type IProductHierarchySummary,
    type SharedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
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

const formatIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const formatCompactIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

const formatUSD = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const formatCompactUSD = (value: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

type TabKey = 'indonesia' | 'international' | 'all';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'indonesia', label: 'Indonesia' },
    { key: 'international', label: 'International' },
    { key: 'all', label: 'All' },
];

const RANGE_PRESETS: { key: DashboardRangePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'lifetime', label: 'Lifetime' },
    { key: 'custom', label: 'Custom Range' },
];

const formatRangeDate = (value: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

export default function Dashboard() {
    const { summary } = usePage<SharedData & { summary?: IDashboardSummary }>().props;
    const [isClient, setIsClient] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('indonesia');

    const range = summary?.range;
    const activePreset: DashboardRangePreset = range?.preset ?? '7d';
    const minDate = range?.minDate ?? '';
    const maxDate = range?.maxDate ?? '';

    const [showCustom, setShowCustom] = useState(activePreset === 'custom');
    const [customStart, setCustomStart] = useState(range?.start ?? '');
    const [customEnd, setCustomEnd] = useState(range?.end ?? '');
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Keep the pickers in sync with whatever range the server actually applied
    // (it clamps custom ranges to the last 30 days).
    useEffect(() => {
        if (!range) return;
        setCustomStart(range.start);
        setCustomEnd(range.end);
        setShowCustom(range.preset === 'custom');
    }, [range?.start, range?.end, range?.preset]);

    const reloadRange = (params: Record<string, string>) => {
        router.get('/dashboard', params, {
            only: ['summary'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsReloading(true),
            onFinish: () => setIsReloading(false),
        });
    };

    const handlePresetChange = (preset: DashboardRangePreset) => {
        if (preset === 'custom') {
            setShowCustom(true);
            return;
        }

        setShowCustom(false);
        reloadRange({ range: preset });
    };

    const applyCustomRange = () => {
        if (!customStart || !customEnd || customStart > customEnd) return;
        reloadRange({ range: 'custom', start_date: customStart, end_date: customEnd });
    };

    const isUSD = activeTab === 'international';
    const formatter = isUSD ? formatUSD : formatIDR;
    const compactFormatter = isUSD ? formatCompactUSD : formatCompactIDR;
    const currencyLabel = isUSD ? 'USD' : 'IDR';

    const activeSegment: IDashboardSegment | null | undefined =
        activeTab === 'indonesia'
            ? summary?.indonesia
            : activeTab === 'international'
              ? summary?.international
              : summary?.all;

    const showExchangeError = activeTab === 'all' && summary?.exchangeRateAvailable === false;

    const trendLabels = activeSegment?.trend.labels ?? [];
    const trendTotals = activeSegment?.trend.totals ?? [];
    const productHierarchy = activeSegment?.productHierarchy ?? [];

    const chartData = useMemo(
        () => ({
            labels: trendLabels,
            datasets: [
                {
                    label: `Sales (${currencyLabel})`,
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
        [trendLabels, trendTotals, currencyLabel],
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
                            label: (context) => formatter(Number(context.parsed.y ?? context.parsed)),
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
                            callback: (value) => compactFormatter(Number(value)),
                        },
                    },
                },
            }) as ChartOptions<'line'>,
        [formatter, compactFormatter],
    );

    const kpis = activeSegment?.kpis;
    const periodTotal = trendTotals.reduce((acc, value) => acc + value, 0);
    const rangeTitle = RANGE_PRESETS.find((preset) => preset.key === activePreset)?.label ?? 'Last 7 Days';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Tab Switcher */}
                <div className="flex gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Exchange Rate Error Banner */}
                {showExchangeError && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        Exchange rate unavailable — cannot combine IDR and USD totals. Indonesia and International tabs are unaffected.
                    </div>
                )}

                {/* Exchange Rate Info (All tab, when available) */}
                {activeTab === 'all' && summary?.exchangeRateAvailable && summary.exchangeRate && (
                    <p className="text-xs text-muted-foreground">
                        Rate used: 1 USD = {formatIDR(summary.exchangeRate)} (updated daily)
                    </p>
                )}

                {!showExchangeError && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <KpiCard title="Total Sales" value={formatter(kpis?.totalRevenue ?? 0)} helper="All time" />
                            <KpiCard title="Total Confirmed Orders" value={(kpis?.totalOrders ?? 0).toLocaleString('id-ID')} helper="Confirmed orders" />
                            <KpiCard title="Average Order Value" value={formatter(kpis?.averageOrderValue ?? 0)} helper="Confirmed orders only" />
                            <KpiCard title="Today's Sales" value={formatter(kpis?.todayRevenue ?? 0)} helper={`${kpis?.todayOrders ?? 0} orders`} />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 lg:col-span-2 dark:border-sidebar-border">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sales Trend</p>
                                        <h3 className="text-xl font-semibold">{rangeTitle}</h3>
                                        {range && (
                                            <p className="text-xs text-muted-foreground">
                                                {formatRangeDate(range.start)} – {formatRangeDate(range.end)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{currencyLabel}</span>
                                </div>

                                <div className="mb-4 flex flex-wrap gap-2">
                                    {RANGE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => handlePresetChange(preset.key)}
                                            disabled={isReloading}
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                                                (preset.key === 'custom' ? showCustom : activePreset === preset.key)
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-sidebar-border/70 bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {showCustom && (
                                    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-sidebar-border/70 p-3 sm:flex-row sm:items-end">
                                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            Start date
                                            <input
                                                type="date"
                                                value={customStart}
                                                min={minDate}
                                                max={customEnd || maxDate}
                                                onChange={(event) => setCustomStart(event.target.value)}
                                                className="rounded-md border border-sidebar-border/70 bg-background px-2 py-1 text-sm text-foreground"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            End date
                                            <input
                                                type="date"
                                                value={customEnd}
                                                min={customStart || minDate}
                                                max={maxDate}
                                                onChange={(event) => setCustomEnd(event.target.value)}
                                                className="rounded-md border border-sidebar-border/70 bg-background px-2 py-1 text-sm text-foreground"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={applyCustomRange}
                                            disabled={isReloading || !customStart || !customEnd || customStart > customEnd}
                                            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-50"
                                        >
                                            Apply
                                        </button>
                                        <p className="text-xs text-muted-foreground sm:ml-auto sm:self-center">
                                            Available from {minDate ? formatRangeDate(minDate) : '—'} to today
                                        </p>
                                    </div>
                                )}

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
                                        <dt className="text-muted-foreground">{rangeTitle} Sales</dt>
                                        <dd className="font-medium">{formatter(periodTotal)}</dd>
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
                                                    <td className="py-3 pr-4 text-right font-medium">{formatter(node.total_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-6 text-sm text-muted-foreground">No paid orders recorded in the last 30 days.</p>
                            )}
                        </div>
                    </>
                )}
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
