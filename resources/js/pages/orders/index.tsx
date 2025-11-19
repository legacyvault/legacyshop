import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IOrdersPaginated, IRootHistoryOrders, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Loader2, MoreHorizontal, Search } from 'lucide-react';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
    },
];

type Filters = Record<string, any>;
type SortableColumn = 'order_number' | 'grand_total' | 'payment_status' | 'status' | 'transaction_status' | 'created_at';

const perPageOptions = [10, 15, 25, 50, 100];

const getCsrfToken = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const meta = document.head.querySelector('meta[name="csrf-token"]');
    if (meta instanceof HTMLMetaElement) {
        return meta.content;
    }
    return undefined;
};

const formatCurrency = (value?: string | number | null) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(numeric);
};

const parseAmount = (value?: string | number | null) => {
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '');
        const numeric = Number.parseFloat(normalized);
        return Number.isFinite(numeric) ? numeric : 0;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    return 0;
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
        case 'payment_received':
            return 'default';
        case 'awaiting_payment':
            return 'secondary';
        case 'payment_failed':
            return 'destructive';
        default:
            return 'outline';
    }
};

const orderStatusVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((status ?? '').toLowerCase()) {
        case 'completed':
        case 'order_confirmed':
        case 'delivered':
            return 'default';
        case 'pending':
        case 'preparing_order':
            return 'secondary';
        case 'order_failed':
            return 'destructive';
        default:
            return 'outline';
    }
};

const transactionStatusVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((status ?? '').toLowerCase()) {
        case 'settlement':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'expire':
            return 'destructive';
        default:
            return 'outline';
    }
};

export default function Orders() {
    const { ordersPaginated, filters } = usePage<SharedData & { filters?: Filters }>().props;
    const [isSnapReady, setIsSnapReady] = useState<boolean>(() => typeof window !== 'undefined' && Boolean(window.snap?.pay));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="p-4">
                <OrdersTable ordersPaginated={ordersPaginated} filters={filters ?? {}} isSnapReady={isSnapReady} />
            </div>
        </AppLayout>
    );
}

function OrdersTable({
    ordersPaginated,
    filters = {},
    isSnapReady,
}: {
    ordersPaginated?: IOrdersPaginated;
    filters?: Filters;
    isSnapReady: boolean;
}) {
    const [selectedOrder, setSelectedOrder] = useState<IRootHistoryOrders | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
    const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
    const [invoiceFeedback, setInvoiceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

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

    const handleGenerateInvoice = useCallback(
        async (order: IRootHistoryOrders) => {
            if (generatingInvoice) {
                return;
            }

            if (!order?.items?.length) {
                setInvoiceFeedback({
                    type: 'error',
                    message: 'Cannot generate an invoice for an order without items.',
                });
                return;
            }

            const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

            const normalizeId = (value?: string | null) => {
                if (!value) return null;
                const trimmed = value.toString().trim();
                return trimmed.length ? trimmed : null;
            };

            const itemPayload = order.items
                .map((item) => {
                    if (!item.product_id) {
                        return null;
                    }

                    const price = parseAmount(item.price);
                    const quantity = item.quantity ?? 0;

                    return {
                        product_id: item.product_id,
                        quantity,
                        price,
                        category_id: normalizeId(item.category_id),
                        sub_category_id: normalizeId(item.sub_category_id),
                        division_id: normalizeId(item.division_id),
                        variant_id: normalizeId(item.variant_id),
                    };
                })
                .filter(
                    (
                        item,
                    ): item is {
                        product_id: string;
                        quantity: number;
                        price: number;
                        category_id: string | null;
                        sub_category_id: string | null;
                        division_id: string | null;
                        variant_id: string | null;
                    } => Boolean(item && item.quantity > 0),
                );

            if (!itemPayload.length) {
                setInvoiceFeedback({
                    type: 'error',
                    message: 'Cannot generate an invoice because product details are incomplete.',
                });
                return;
            }

            const subtotal = order.items.reduce((acc, item) => acc + parseAmount(item.total), 0);
            const shippingFee = parseAmount(order.shipping_fee);
            const grandTotal = parseAmount(order.grand_total);
            const computedDiscount = Math.max(0, subtotal + shippingFee - grandTotal);

            const paymentStatus = (order.payment_status ?? '').toLowerCase();
            const transactionStatus = (order.transaction_status ?? '').toLowerCase();
            const invoiceStatus: 'draft' | 'issued' = paymentStatus === 'paid' || transactionStatus === 'settlement' ? 'issued' : 'draft';

            const invoiceNumber = order.order_number ? order.order_number.replace(/^ORD/i, 'INV') : undefined;
            const nowIso = new Date().toISOString();

            const payload = {
                invoice_number: invoiceNumber,
                status: invoiceStatus,
                issued_at: nowIso,
                due_at: null,
                bill_to_name: order.shipment?.receiver_name ?? order.user?.name ?? 'Customer',
                bill_to_email: order.user?.email ?? null,
                bill_to_phone: order.shipment?.receiver_phone ?? null,
                bill_to_address: order.shipment?.receiver_address ?? null,
                bill_to_city: order.shipment?.receiver_city ?? null,
                bill_to_province: order.shipment?.receiver_province ?? null,
                bill_to_postal_code: order.shipment?.receiver_postal_code ?? null,
                bill_to_country: order.shipment ? 'Indonesia' : null,
                discount_total: roundToTwo(computedDiscount),
                tax_total: 0,
                shipping_total: roundToTwo(shippingFee),
                items: itemPayload.map((item) => ({
                    ...item,
                    price: roundToTwo(item.price),
                })),
            };

            setGeneratingInvoice(order.id);
            setInvoiceFeedback(null);

            try {
                const csrfToken = getCsrfToken();
                const response = await fetch('/v1/invoices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json, application/pdf',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        ...payload,
                        preview_only: true,
                    }),
                });

                const contentType = response.headers.get('content-type') ?? '';

                if (!response.ok) {
                    let errorMessage = 'Failed to generate invoice.';

                    if (contentType.includes('application/json')) {
                        let errorPayload: { message?: string; errors?: Record<string, string[]> } | null = null;

                        try {
                            errorPayload = (await response.json()) as {
                                message?: string;
                                errors?: Record<string, string[]>;
                            } | null;
                        } catch {
                            errorPayload = null;
                        }

                        errorMessage =
                            errorPayload?.message ??
                            (errorPayload?.errors ? Object.values(errorPayload.errors).flat().find(Boolean) : null) ??
                            errorMessage;
                    } else {
                        const rawText = await response.text();
                        errorMessage = rawText || errorMessage;
                    }

                    throw new Error(errorMessage);
                }

                if (contentType.includes('application/pdf')) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const popup = window.open(blobUrl, '_blank');

                    if (!popup) {
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.target = '_blank';
                        link.rel = 'noopener';
                        link.click();
                    }

                    setInvoiceFeedback({
                        type: 'success',
                        message: `Invoice preview generated for ${order.order_number}.`,
                    });

                    setTimeout(() => {
                        URL.revokeObjectURL(blobUrl);
                    }, 60_000);

                    return;
                }

                const raw = await response.text();
                let payloadResponse: any = null;

                if (raw) {
                    try {
                        payloadResponse = JSON.parse(raw);
                    } catch (jsonError) {
                        console.warn('Unable to parse invoice response JSON.', jsonError);
                    }
                }

                const invoiceData = payloadResponse?.data ?? payloadResponse ?? {};

                setInvoiceFeedback({
                    type: 'success',
                    message: `Invoice ${invoiceData.invoice_number ?? ''} generated for ${order.order_number}.`,
                });

                if (invoiceData?.id) {
                    window.open(`/v1/invoices/${invoiceData.id}/download`, '_blank');
                }
            } catch (error) {
                console.error('Invoice generation failed:', error);
                const message = error instanceof Error ? error.message : 'Failed to generate invoice.';
                const normalizedMessage =
                    typeof message === 'string' && message.toLowerCase().includes('invoice number')
                        ? 'An invoice already exists for this order.'
                        : message;
                setInvoiceFeedback({
                    type: 'error',
                    message: normalizedMessage,
                });
            } finally {
                setGeneratingInvoice(null);
            }
        },
        [generatingInvoice],
    );

    const refreshOrders = useCallback(() => {
        router.reload({
            only: ['ordersPaginated', 'filters'],
        });
    }, []);

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

    async function parseJsonResponse(response: Response) {
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            const error = new Error('Unexpected response content type');
            (error as any).response = response;
            throw error;
        }

        return response.json();
    }

    const fetchTransaction = useCallback(
        async (orderNumber: string) => {
            if (processingOrder) return;

            setProcessingOrder(orderNumber);

            setDetailsOpen(false);

            try {
                const response = await fetch(`/v1/reopen-snap/${orderNumber}`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });

                const payload = await parseJsonResponse(response);

                if (!response.ok) {
                    throw new Error('Failed to fetch transaction');
                }

                const status = (payload as { status?: string })?.status;
                const snapToken = (payload as { snap_token?: string })?.snap_token;

                if (snapToken && ['requires_payment', 'pending'].includes(status ?? '') && window.snap?.pay) {
                    window.snap.pay(snapToken, {
                        onSuccess: () => refreshOrders(),
                        onPending: () => refreshOrders(),
                        onError: (error) => {
                            console.error('Snap payment error:', error);
                            refreshOrders();
                        },
                        onClose: () => refreshOrders(),
                    });
                } else {
                    refreshOrders();
                }
            } catch (error) {
                console.error('Generate payment failed:', error);
                refreshOrders();
            } finally {
                setProcessingOrder(null);
            }
        },
        [processingOrder, refreshOrders],
    );

    const handleConfirmOrder = useCallback(
        async (orderId: string) => {
            if (confirmingOrder) return;

            setConfirmingOrder(orderId);
            setLoading(true);
            try {
                const csrfToken = getCsrfToken();
                const response = await fetch(`/v1/confirm-order/${orderId}`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/pdf, application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                });

                const contentType = response.headers.get('content-type') ?? '';
                const normalizedContentType = contentType.toLowerCase();

                if (response.ok && normalizedContentType.includes('application/pdf')) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const pdfWindow = window.open(blobUrl, '_blank');

                    if (!pdfWindow) {
                        const tempLink = document.createElement('a');
                        tempLink.href = blobUrl;
                        tempLink.target = '_blank';
                        tempLink.rel = 'noopener';
                        tempLink.click();
                    }

                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
                    refreshOrders();
                    return;
                }

                let payload: unknown = null;

                if (normalizedContentType.includes('application/json')) {
                    try {
                        payload = await response.json();
                    } catch {
                        payload = null;
                    }
                } else {
                    const rawText = await response.text();
                    payload = rawText;
                }

                if (!response.ok) {
                    const message =
                        typeof payload === 'string'
                            ? payload || 'Failed to confirm order.'
                            : ((payload as { message?: string; error?: string })?.message ??
                              (payload as { error?: string })?.error ??
                              'Failed to confirm order.');
                    throw new Error(message);
                }

                refreshOrders();
            } catch (error) {
                console.error('Confirm order failed:', error);
            } finally {
                setConfirmingOrder(null);
                setLoading(false);
            }
        },
        [confirmingOrder, refreshOrders],
    );

    return (
        <>
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                </div>
            )}
            <div className="flex flex-col gap-4">
                {invoiceFeedback && (
                    <div
                        className={`rounded-md border px-4 py-3 text-sm ${
                            invoiceFeedback.type === 'success'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        {invoiceFeedback.message}
                    </div>
                )}
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
                                    const isPreparingOrder = (order.status ?? '').toLowerCase() === 'preparing_order';

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
                                                        {isPreparingOrder && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer gap-2"
                                                                disabled={confirmingOrder === order.id}
                                                                onClick={() => handleConfirmOrder(order.id)}
                                                            >
                                                                {confirmingOrder === order.id && (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                )}
                                                                Confirm Order
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-2"
                                                            disabled={generatingInvoice === order.id}
                                                            onClick={() => handleGenerateInvoice(order)}
                                                        >
                                                            {generatingInvoice === order.id && (
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            )}
                                                            Generate Invoice
                                                        </DropdownMenuItem>
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

            <OrderDetailsDialog
                open={detailsOpen}
                onOpenChange={handleDialogChange}
                order={selectedOrder}
                onGeneratePayment={fetchTransaction}
                isSnapReady={isSnapReady}
                processingOrder={processingOrder}
            />
        </>
    );
}

function OrderDetailsDialog({
    open,
    onOpenChange,
    order,
    onGeneratePayment,
    isSnapReady,
    processingOrder,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: IRootHistoryOrders | null;
    onGeneratePayment: (orderNumber: string) => void;
    isSnapReady: boolean;
    processingOrder: string | null;
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
                                {order.status === 'awaiting_payment' && (
                                    <>
                                        <br />
                                        <Button
                                            variant={'link'}
                                            className="m-0 p-0 text-xs"
                                            onClick={() => onGeneratePayment(order.order_number)}
                                            disabled={!isSnapReady || processingOrder === order.order_number}
                                        >
                                            Generate Payment
                                        </Button>
                                    </>
                                )}
                                {order.shipment?.shipping_label_url && (
                                    <>
                                        <br />
                                        <div className="mt-0.5">
                                            <a href={order.shipment?.shipping_label_url} target="_blank">
                                                Open Shipping Label
                                            </a>
                                        </div>
                                    </>
                                )}
                                {order.shipment?.tracking_url && (
                                    <>
                                        <div className="mt-0.5">
                                            <a href={order.shipment?.tracking_url} target="_blank">
                                                Open Tracking
                                            </a>
                                        </div>
                                    </>
                                )}
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
