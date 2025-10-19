import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IOrdersPaginated, IRootHistoryOrders, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { MoreHorizontal, Search } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
    },
];

type Filters = Record<string, any>;
type SortableColumn = 'order_number' | 'grand_total' | 'payment_status' | 'status' | 'transaction_status' | 'created_at';

const perPageOptions = [10, 15, 25, 50, 100];

const formatCurrency = (value?: string | number | null) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(numeric);
};

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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

const paymentStatusVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((status ?? '').toLowerCase()) {
        case 'paid':
        case 'settlement':
            return 'default';
        case 'pending':
        case 'challenge':
            return 'secondary';
        case 'failed':
        case 'expire':
        case 'expired':
        case 'cancelled':
        case 'canceled':
            return 'destructive';
        default:
            return 'outline';
    }
};

const orderStatusVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((status ?? '').toLowerCase()) {
        case 'completed':
        case 'delivered':
            return 'default';
        case 'processing':
        case 'shipped':
        case 'on delivery':
            return 'secondary';
        case 'cancelled':
        case 'canceled':
        case 'failed':
            return 'destructive';
        default:
            return 'outline';
    }
};

const transactionStatusVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((status ?? '').toLowerCase()) {
        case 'settlement':
        case 'success':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'deny':
        case 'expire':
        case 'failure':
        case 'cancel':
        case 'cancelled':
            return 'destructive';
        default:
            return 'outline';
    }
};

export default function Orders() {
    const { ordersPaginated, filters } = usePage<SharedData & { filters?: Filters }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="p-4">
                <OrdersTable ordersPaginated={ordersPaginated} filters={filters ?? {}} />
            </div>
        </AppLayout>
    );
}

function OrdersTable({ ordersPaginated, filters = {} }: { ordersPaginated?: IOrdersPaginated; filters?: Filters }) {
    const [selectedOrder, setSelectedOrder] = useState<IRootHistoryOrders | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const orders = ordersPaginated?.data ?? [];
    const currentPage = ordersPaginated?.current_page ?? Number(filters.page ?? 1);
    const perPage = ordersPaginated?.per_page ?? Number(filters.per_page ?? 15);
    const lastPage = ordersPaginated?.last_page ?? 1;
    const from = ordersPaginated?.from ?? (orders.length ? (currentPage - 1) * perPage + 1 : 0);
    const to = ordersPaginated?.to ?? (orders.length ? (currentPage - 1) * perPage + orders.length : 0);
    const total = ordersPaginated?.total ?? orders.length;

    const statusOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((order) => {
            if (order.status) set.add(order.status);
        });
        return Array.from(set).sort();
    }, [orders]);

    const paymentStatusOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((order) => {
            if (order.payment_status) set.add(order.payment_status);
        });
        return Array.from(set).sort();
    }, [orders]);

    const transactionStatusOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((order) => {
            if (order.transaction_status) set.add(order.transaction_status);
        });
        return Array.from(set).sort();
    }, [orders]);

    const hasActiveFilters = Boolean(filters.q || filters.status || filters.payment_status || filters.transaction_status);

    const updateFilters = (patch: Filters) => {
        const next: Filters = { ...filters, ...patch };
        Object.keys(next).forEach((key) => {
            const value = next[key];
            if (value === '' || value === null || typeof value === 'undefined') {
                delete next[key];
            }
        });

        router.get('/orders', next, { preserveState: true, replace: true });
    };

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
        updateFilters({ q: event.target.value, page: 1 });
    };

    const handleSort = (column: SortableColumn) => {
        const isSameColumn = filters.sort_by === column;
        const nextDirection = isSameColumn && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDirection, page: 1 });
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > lastPage) return;
        updateFilters({ page });
    };

    const handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ per_page: Number(event.target.value), page: 1 });
    };

    const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ status: event.target.value || null, page: 1 });
    };

    const handlePaymentStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ payment_status: event.target.value || null, page: 1 });
    };

    const handleTransactionStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ transaction_status: event.target.value || null, page: 1 });
    };

    const clearFilters = () => {
        const preserved: Filters = {};
        if (filters.per_page) {
            preserved.per_page = filters.per_page;
        }
        updateFilters({ ...preserved, q: '', status: null, payment_status: null, transaction_status: null, page: 1, sort_by: null, sort_dir: null });
    };

    const handleViewDetails = (order: IRootHistoryOrders) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const handleDialogChange = (open: boolean) => {
        setDetailsOpen(open);
        if (!open) {
            setSelectedOrder(null);
        }
    };

    const renderSortIndicator = (column: SortableColumn) => {
        if (filters.sort_by !== column) return null;
        return filters.sort_dir === 'asc' ? '▲' : '▼';
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filters.status ?? ''}
                            onChange={handleStatusChange}
                            className="rounded border border-popover bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                    {titleCase(option)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.payment_status ?? ''}
                            onChange={handlePaymentStatusChange}
                            className="rounded border border-popover bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="">All payment</option>
                            {paymentStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                    {titleCase(option)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.transaction_status ?? ''}
                            onChange={handleTransactionStatusChange}
                            className="rounded border border-popover bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="">All transactions</option>
                            {transactionStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                    {titleCase(option)}
                                </option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="max-w-s relative w-full">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                defaultValue={filters.q ?? ''}
                                onChange={handleSearch}
                                placeholder="Search order number, customer..."
                                className="w-full rounded border border-popover bg-background px-9 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                        </div>
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
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-popover">
                    <table className="min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sidebar-accent text-primary-foreground">
                                <th className="border border-popover px-4 py-3 text-left font-medium">#</th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('order_number')}
                                >
                                    Order {renderSortIndicator('order_number')}
                                </th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">Customer</th>
                                <th className="border border-popover px-4 py-3 text-left font-medium">Items</th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('grand_total')}
                                >
                                    Grand Total {renderSortIndicator('grand_total')}
                                </th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('payment_status')}
                                >
                                    Payment {renderSortIndicator('payment_status')}
                                </th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('transaction_status')}
                                >
                                    Transaction {renderSortIndicator('transaction_status')}
                                </th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    Status {renderSortIndicator('status')}
                                </th>
                                <th
                                    className="cursor-pointer border border-popover px-4 py-3 text-left font-medium select-none"
                                    onClick={() => handleSort('created_at')}
                                >
                                    Created {renderSortIndicator('created_at')}
                                </th>
                                <th className="border border-popover px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length ? (
                                orders.map((order, index) => {
                                    const rowNumber = (currentPage - 1) * perPage + index + 1;
                                    const totalQuantity = order.items?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0;
                                    const customerName = order.shipment?.receiver_name ?? order.user?.name ?? '—';
                                    const customerMeta = order.shipment?.receiver_city ?? order.user?.email ?? '';

                                    return (
                                        <tr key={order.id} className="hover:bg-muted/40">
                                            <td className="border border-popover px-4 py-3">{rowNumber}</td>
                                            <td className="border border-popover px-4 py-3">
                                                <div className="font-medium">{order.order_number}</div>
                                                {order.transaction_id && (
                                                    <div className="text-xs text-muted-foreground">TX: {order.transaction_id}</div>
                                                )}
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <div className="font-medium">{customerName}</div>
                                                {customerMeta && <div className="text-xs text-muted-foreground">{customerMeta}</div>}
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <div className="font-medium">{totalQuantity} items</div>
                                                <div className="text-xs text-muted-foreground">{order.items?.length ?? 0} product lines</div>
                                            </td>
                                            <td className="border border-popover px-4 py-3">{formatCurrency(order.grand_total)}</td>
                                            <td className="border border-popover px-4 py-3">
                                                <Badge variant={paymentStatusVariant(order.payment_status)}>{titleCase(order.payment_status)}</Badge>
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <Badge variant={transactionStatusVariant(order.transaction_status)}>
                                                    {titleCase(order.transaction_status)}
                                                </Badge>
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <Badge variant={orderStatusVariant(order.status)}>{titleCase(order.status)}</Badge>
                                            </td>
                                            <td className="border border-popover px-4 py-3">
                                                <div>{formatDate(order.created_at)}</div>
                                                {order.paid_at && (
                                                    <div className="text-xs text-muted-foreground">Paid: {formatDate(order.paid_at)}</div>
                                                )}
                                            </td>
                                            <td className="border border-popover px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewDetails(order)}>
                                                            View
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                                        No orders found. Adjust your search or filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                        Page {currentPage} of {lastPage}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" disabled={currentPage === lastPage} onClick={() => goToPage(currentPage + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <OrderDetailsDialog open={detailsOpen} onOpenChange={handleDialogChange} order={selectedOrder} />
        </>
    );
}

function OrderDetailsDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: IRootHistoryOrders | null;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Order {order?.order_number}</DialogTitle>
                </DialogHeader>

                {order ? (
                    <div className="space-y-6 text-sm">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg border border-popover p-3">
                                <div className="text-xs text-muted-foreground uppercase">Payment</div>
                                <div className="mt-1 font-medium">{titleCase(order.payment_method)}</div>
                                <Badge variant={paymentStatusVariant(order.payment_status)} className="mt-2">
                                    {titleCase(order.payment_status)}
                                </Badge>
                            </div>
                            <div className="rounded-lg border border-popover p-3">
                                <div className="text-xs text-muted-foreground uppercase">Transaction</div>
                                <div className="mt-1 font-medium">{order.transaction_id ?? '—'}</div>
                                <Badge variant={transactionStatusVariant(order.transaction_status)} className="mt-2">
                                    {titleCase(order.transaction_status)}
                                </Badge>
                            </div>
                            <div className="rounded-lg border border-popover p-3">
                                <div className="text-xs text-muted-foreground uppercase">Order Status</div>
                                <div className="mt-1 font-medium">{formatDate(order.created_at)}</div>
                                <Badge variant={orderStatusVariant(order.status)} className="mt-2">
                                    {titleCase(order.status)}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-popover p-4">
                                <div className="text-sm font-semibold">Customer</div>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="font-medium">{order.user?.name ?? order.shipment?.receiver_name ?? '—'}</div>
                                    {order.user?.email && <div className="text-muted-foreground">{order.user.email}</div>}
                                    {order.shipment?.receiver_phone && <div className="text-muted-foreground">{order.shipment.receiver_phone}</div>}
                                </div>
                            </div>
                            <div className="rounded-lg border border-popover p-4">
                                <div className="text-sm font-semibold">Shipping Address</div>
                                <div className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                                    {order.shipment
                                        ? `${order.shipment.receiver_address}
${order.shipment.receiver_city}, ${order.shipment.receiver_province} ${order.shipment.receiver_postal_code ?? ''}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-popover">
                            <div className="border-b border-popover px-4 py-3 text-sm font-semibold">Items ({order.items?.length ?? 0})</div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-popover text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Product</th>
                                            <th className="px-4 py-2 text-left font-medium">Variant</th>
                                            <th className="px-4 py-2 text-left font-medium">Qty</th>
                                            <th className="px-4 py-2 text-left font-medium">Price</th>
                                            <th className="px-4 py-2 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items?.length ? (
                                            order.items.map((item) => (
                                                <tr key={item.id} className="border-t border-popover">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium">{item.product_name}</div>
                                                        {item.category_name && (
                                                            <div className="text-xs text-muted-foreground">{item.category_name}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">{item.variant_name ? titleCase(item.variant_name) : '—'}</td>
                                                    <td className="px-4 py-2">{item.quantity}</td>
                                                    <td className="px-4 py-2">{formatCurrency(item.price)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-4 text-center text-sm text-muted-foreground">
                                                    No items found for this order.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col gap-2 border-t border-popover px-4 py-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Shipping Fee</span>
                                    <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Grand Total</span>
                                    <span className="text-lg font-semibold">{formatCurrency(order.grand_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">Select an order to view details.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
