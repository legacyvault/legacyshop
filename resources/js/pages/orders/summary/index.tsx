import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IOrderItemSummaryPaginated, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type Filters = {
    q?: string;
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
};

const SUMMARY_ROUTE = '/orders/summary';
const perPageOptions = [10, 15, 25, 50, 100];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/orders/order' },
    { title: 'Summary', href: SUMMARY_ROUTE },
];

const formatCurrency = (value?: string | number | null) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(numeric);
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatShortDate = (date?: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
};

const formatInputDate = (date: Date) => date.toISOString().slice(0, 10);

const parseDateInput = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const titleCase = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split(/[_\s-]+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
        .join(' ');
};

export default function OrdersSummaryPage() {
    const { orderItemsPaginated, filters } = usePage<SharedData & { filters?: Filters; orderItemsPaginated?: IOrderItemSummaryPaginated }>().props;

    const items = orderItemsPaginated?.data ?? [];
    const currentPage = orderItemsPaginated?.current_page ?? Number(filters?.page ?? 1);
    const perPage = orderItemsPaginated?.per_page ?? Number(filters?.per_page ?? 15);
    const lastPage = orderItemsPaginated?.last_page ?? 1;
    const from = orderItemsPaginated?.from ?? (items.length ? (currentPage - 1) * perPage + 1 : 0);
    const to = orderItemsPaginated?.to ?? (items.length ? (currentPage - 1) * perPage + items.length : 0);
    const total = orderItemsPaginated?.total ?? items.length;

    const normalizedSearchFilter = typeof filters?.q === 'string' ? filters.q : '';
    const createdFrom = typeof filters?.date_from === 'string' ? filters.date_from : '';
    const createdTo = typeof filters?.date_to === 'string' ? filters.date_to : '';

    const [searchValue, setSearchValue] = useState<string>(normalizedSearchFilter);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: parseDateInput(createdFrom),
        to: parseDateInput(createdTo),
    }));
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement | null>(null);

    const paginationItems = useMemo(() => {
        if (lastPage <= 7) {
            return Array.from({ length: lastPage }, (_, index) => index + 1);
        }

        const delta = 2;
        const start = Math.max(2, currentPage - delta);
        const end = Math.min(lastPage - 1, currentPage + delta);
        const pages: (number | string)[] = [1];

        if (start > 2) pages.push('ellipsis-start');
        for (let page = start; page <= end; page++) pages.push(page);
        if (end < lastPage - 1) pages.push('ellipsis-end');
        pages.push(lastPage);

        return pages;
    }, [currentPage, lastPage]);

    const dateRangeLabel = useMemo(() => {
        if (dateRange?.from && dateRange.to) return `${formatShortDate(dateRange.from)} - ${formatShortDate(dateRange.to)}`;
        if (dateRange?.from) return `From ${formatShortDate(dateRange.from)}`;
        if (dateRange?.to) return `Until ${formatShortDate(dateRange.to)}`;
        return 'Created date';
    }, [dateRange]);

    useEffect(() => {
        setSearchValue((prev) => (prev === normalizedSearchFilter ? prev : normalizedSearchFilter));
    }, [normalizedSearchFilter]);

    useEffect(() => {
        const nextFrom = parseDateInput(createdFrom);
        const nextTo = parseDateInput(createdTo);
        setDateRange((prev) => {
            if (prev?.from?.getTime() === nextFrom?.getTime() && prev?.to?.getTime() === nextTo?.getTime()) {
                return prev;
            }
            return { from: nextFrom, to: nextTo };
        });
    }, [createdFrom, createdTo]);

    useEffect(() => {
        if (!datePickerOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && event.target instanceof Node && !datePickerRef.current.contains(event.target)) {
                setDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [datePickerOpen]);

    const updateFilters = (patch: Filters) => {
        const next: Filters = { ...(filters ?? {}), ...patch };
        Object.keys(next).forEach((key) => {
            const value = next[key as keyof Filters];
            if (value === null || value === undefined || value === '') {
                delete next[key as keyof Filters];
            }
        });

        router.get(SUMMARY_ROUTE, next, { preserveState: true, replace: true });
    };

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
        updateFilters({ q: value, page: 1 });
    };

    const handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ per_page: Number(event.target.value), page: 1 });
    };

    const handleDateRangeSelect = (range?: DateRange) => {
        const normalized = range && (range.from || range.to) ? range : undefined;
        setDateRange(normalized);
        updateFilters({
            date_from: normalized?.from ? formatInputDate(normalized.from) : undefined,
            date_to: normalized?.to ? formatInputDate(normalized.to) : undefined,
            page: 1,
        });
    };

    const clearDateRange = () => {
        setDateRange(undefined);
        setDatePickerOpen(false);
        updateFilters({ date_from: undefined, date_to: undefined, page: 1 });
    };

    const clearAll = () => {
        setSearchValue('');
        setDateRange(undefined);
        setDatePickerOpen(false);
        updateFilters({ q: '', date_from: undefined, date_to: undefined, page: 1 });
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > lastPage) return;
        updateFilters({ page });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Order Summary" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold text-foreground">Order Summary</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="rounded border border-popover bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            {perPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option} / page
                                </option>
                            ))}
                        </select>
                        <Button variant="outline" onClick={clearAll}>
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={handleSearch}
                            placeholder="Search product, SKU, buyer, order number..."
                            className="w-full rounded border border-popover bg-background px-9 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={datePickerRef}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDatePickerOpen((open) => !open)}
                                className="flex items-center gap-2"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="text-xs font-medium whitespace-nowrap">{dateRangeLabel}</span>
                            </Button>
                            {datePickerOpen && (
                                <div className="absolute z-50 mt-2 w-max rounded-md border border-popover bg-background p-3 shadow-lg">
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={handleDateRangeSelect}
                                        defaultMonth={dateRange?.from ?? dateRange?.to ?? new Date()}
                                        numberOfMonths={2}
                                        weekStartsOn={1}
                                    />
                                    <div className="mt-2 flex justify-between gap-2">
                                        <Button size="sm" variant="ghost" onClick={clearDateRange}>
                                            Clear
                                        </Button>
                                        <Button size="sm" onClick={() => setDatePickerOpen(false)}>
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {dateRange && (dateRange.from || dateRange.to) ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDateRange} aria-label="Clear date range">
                                <X className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-popover bg-background">
                    <table className="min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent text-primary-foreground">
                                <th className="border border-popover px-4 py-3 text-left font-medium">#</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">Date</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">Product</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">SKU</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">Buyer</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium">Qty</th>
                                <th className="border border-popover px-4 py-3 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length ? (
                                items.map((item, index) => {
                                    const rowNumber = (currentPage - 1) * perPage + index + 1;
                                    const buyer =
                                        item.order?.shipment?.receiver_name ?? item.order?.user?.name ?? item.order?.guest?.contact_name ?? '—';

                                    return (
                                        <tr key={item.id} className="hover:bg-muted/40">
                                            <td className="border border-popover px-4 py-3">{rowNumber}</td>
                                            <td className="border border-popover px-4 py-3">
                                                <div className="font-medium">{formatDateTime(item.order_created_at ?? item.created_at)}</div>
                                                {item.order_number && <div className="text-xs text-muted-foreground">Order: {item.order_number}</div>}
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <div className="font-medium">{item.product_name}</div>
                                                {item.category_name && (
                                                    <div className="text-xs text-muted-foreground">{titleCase(item.category_name)}</div>
                                                )}
                                            </td>
                                            <td className="border border-popover px-4 py-3">{item.product_sku ?? '—'}</td>
                                            <td className="border border-popover px-4 py-3">{buyer}</td>
                                            <td className="border border-popover px-4 py-3 text-right font-semibold">{item.quantity}</td>
                                            <td className="border border-popover px-4 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                        No records found. Adjust your search or date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div>{total ? `Showing ${from} - ${to} of ${total}` : 'No records to display'}</div>
                    {lastPage > 1 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => goToPage(1)}>
                                First
                            </Button>
                            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                                Previous
                            </Button>
                            {paginationItems.map((item, idx) =>
                                typeof item === 'number' ? (
                                    <Button
                                        key={item}
                                        size="sm"
                                        variant={item === currentPage ? 'default' : 'outline'}
                                        onClick={() => goToPage(item)}
                                    >
                                        {item}
                                    </Button>
                                ) : (
                                    <span key={`${item}-${idx}`} className="px-2 text-muted-foreground">
                                        ...
                                    </span>
                                ),
                            )}
                            <Button size="sm" variant="outline" disabled={currentPage === lastPage} onClick={() => goToPage(currentPage + 1)}>
                                Next
                            </Button>
                            <Button size="sm" variant="outline" disabled={currentPage === lastPage} onClick={() => goToPage(lastPage)}>
                                Last
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
