import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import FrontLayout from '@/layouts/front/front-layout';
import { cn } from '@/lib/utils';
import { IRootHistoryOrders, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent, type ElementType, type FormEvent } from 'react';

type Filters = {
    q?: string;
    status?: string;
    product_category?: string;
    payment_status?: string;
    transaction_status?: string;
    page?: number;
    per_page?: number;
};

type IconPalette = {
    icon: ElementType;
    background: string;
    color: string;
};

export default function Purchases() {
    const { auth, locale, translations, ordersPaginated, filters } = usePage<SharedData & { filters?: Filters }>().props;

    const orders = ordersPaginated?.data ?? [];
    const [searchValue, setSearchValue] = useState<string>((filters?.q as string) ?? '');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<IRootHistoryOrders | null>(null);

    useEffect(() => {
        setSearchValue((filters?.q as string) ?? '');
    }, [filters?.q]);

    const statusFilterValue = (filters?.status as string) ?? 'all';

    const statusOptions = useMemo(() => {
        const uniqueStatuses = new Set<string>();
        orders.forEach((order) => {
            if (order.status) {
                uniqueStatuses.add(order.status);
            }
        });

        return ['all', ...Array.from(uniqueStatuses)];
    }, [orders]);

    const updateFilters = (patch: Filters) => {
        const next: Filters = { ...(filters ?? {}), ...patch };

        Object.keys(next).forEach((key) => {
            const value = next[key as keyof Filters];
            if (value === null || value === undefined || value === '' || value === 'all') {
                delete next[key as keyof Filters];
            }
        });

        router.get('/settings/purchases', next, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateFilters({ q: searchValue ?? null, page: 1 });
    };

    const handleStatusChange = (status: string) => {
        updateFilters({ status, page: 1 });
    };

    const handleSearchValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleReset = () => {
        setSearchValue('');
        updateFilters({
            q: '',
            status: '',
            product_category: '',
            payment_status: '',
            transaction_status: '',
            page: 1,
        });
    };

    const handleViewDetail = (order: IRootHistoryOrders) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    const handleDetailOpenChange = (open: boolean) => {
        setDetailOpen(open);
        if (!open) {
            setSelectedOrder(null);
        }
    };

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 lg:px-0">
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold text-foreground">Transaction List</h1>
                    <p className="text-sm text-muted-foreground">Track and revisit your latest purchases in one place.</p>
                </header>

                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <form className="relative flex-1" onSubmit={handleSearchSubmit}>
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchValue}
                                onChange={handleSearchValueChange}
                                placeholder="Search your transactions here"
                                className="h-12 w-full rounded-xl bg-muted/40 pl-10"
                            />
                            <button type="submit" className="hidden" aria-hidden="true" />
                        </form>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(status)}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm transition-colors',
                                        statusFilterValue === status
                                            ? 'border-border'
                                            : 'border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:shadow-sm',
                                    )}
                                >
                                    {status === 'all' ? 'All' : titleCase(status)}
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={handleReset} className="transition-color text-sm font-semibold">
                            Reset Filters
                        </button>
                    </div>
                </div>

                <TransactionList orders={orders} onViewDetail={handleViewDetail} />
            </section>
            <TransactionDetailDialog open={detailOpen} onOpenChange={handleDetailOpenChange} order={selectedOrder} />
        </FrontLayout>
    );
}

function TransactionList({ orders, onViewDetail }: { orders: IRootHistoryOrders[]; onViewDetail: (order: IRootHistoryOrders) => void }) {
    const transactions = useMemo(() => {
        return orders.map((order) => {
            const firstItem = order.items?.[0];
            const itemsCount = order.items?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0;
            const category = firstItem?.category_name || firstItem?.division_name || firstItem?.product_name || 'General';
            const merchant = firstItem?.product_name || 'Order';
            const additionalItems = order.items ? order.items.length - 1 : 0;
            const description = additionalItems > 0 ? `${additionalItems} more item${additionalItems > 1 ? 's' : ''}` : null;
            const picture = firstItem?.product_image;
            const reference = order.transaction_id || order.order_number;
            const statusLabel = order.transaction_status || order.status;
            const badgeStyle = getStatusBadgeStyle(statusLabel);
            const date = formatDate(order.created_at);
            const subtextParts: string[] = [];
            if (itemsCount > 0) {
                subtextParts.push(`${itemsCount} item${itemsCount > 1 ? 's' : ''} in total`);
            }

            return {
                order,
                id: order.id,
                category,
                date,
                statusLabel: badgeStyle.label,
                badgeBg: badgeStyle.background,
                badgeColor: badgeStyle.color,
                reference,
                merchant,
                description,
                subtext: subtextParts.join(' • '),
                totalValue: formatCurrency(order.grand_total),
                picture,
            };
        });
    }, [orders]);

    if (!transactions.length) {
        return (
            <Card className="gap-0 rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/10 p-10 text-center text-muted-foreground shadow-none">
                <p className="text-base font-semibold text-foreground">No transactions yet</p>
                <p className="mt-1 text-sm">Your purchases will show up here as soon as you complete a transaction.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => {
                return (
                    <Card key={transaction.id} className="gap-0 rounded-2xl border border-border bg-white shadow-sm">
                        <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:justify-between">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <img className="size-11" src={transaction.picture} />
                                    <div className="flex flex-col">
                                        <span className="text-base font-semibold text-foreground">{transaction.category}</span>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span>{transaction.date}</span>
                                            <Badge
                                                className={cn(
                                                    'border-0 px-2.5 py-1 text-xs font-semibold',
                                                    transaction.badgeBg,
                                                    transaction.badgeColor,
                                                )}
                                            >
                                                {transaction.statusLabel}
                                            </Badge>
                                            <span className="font-medium text-muted-foreground/80">{transaction.reference}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-14 space-y-1 text-sm">
                                    <p className="font-semibold text-foreground">{transaction.merchant}</p>
                                    {transaction.description ? <p className="text-foreground/80">{transaction.description}</p> : null}
                                    {transaction.subtext ? <p className="text-muted-foreground">{transaction.subtext}</p> : null}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 text-right">
                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                <span className="text-xl font-semibold text-foreground">{transaction.totalValue}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" type="button" onClick={() => onViewDetail(transaction.order)}>
                                    View Transaction Detail
                                </Button>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

const titleCase = (value?: string | null) => {
    if (!value) return '';
    return value
        .toLowerCase()
        .split(/[_\s-]+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
        .join(' ');
};

const formatCurrency = (value?: string | number | null) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
    if (!Number.isFinite(numeric)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numeric);
};

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const getStatusBadgeStyle = (status?: string | null): { background: string; color: string; label: string } => {
    const normalized = (status ?? '').toLowerCase();

    if (['completed', 'success', 'settlement', 'delivered', 'paid'].includes(normalized)) {
        return { background: 'bg-emerald-100', color: 'text-emerald-700', label: titleCase(status) || 'Completed' };
    }

    if (['processing', 'pending', 'on delivery', 'shipped'].includes(normalized)) {
        return { background: 'bg-amber-100', color: 'text-amber-700', label: titleCase(status) || 'Pending' };
    }

    if (['canceled', 'cancelled', 'failed', 'expire', 'expired', 'deny'].includes(normalized)) {
        return { background: 'bg-rose-100', color: 'text-rose-700', label: titleCase(status) || 'Failed' };
    }

    return { background: 'bg-muted/40', color: 'text-muted-foreground', label: titleCase(status) || 'Unknown' };
};

function TransactionDetailDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: IRootHistoryOrders | null;
}) {
    const items = order?.items ?? [];
    const totals = {
        subtotal: formatCurrency(order?.subtotal),
        shipping: formatCurrency(order?.shipping_fee),
        grandTotal: formatCurrency(order?.grand_total),
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                    <DialogDescription>
                        {order ? (
                            <span className="flex flex-col gap-1 text-left text-sm text-muted-foreground">
                                <span>Order #{order.order_number}</span>
                                <span>{formatDate(order.created_at)}</span>
                                <span>Status: {titleCase(order.status)}</span>
                            </span>
                        ) : (
                            'Review the items included in this transaction.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-3">
                        {items.length ? (
                            items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between rounded-lg border border-border px-4 py-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                                        {item.variant_name ? <p className="text-xs text-muted-foreground">Variant: {item.variant_name}</p> : null}
                                        {item.category_name ? <p className="text-xs text-muted-foreground">Category: {item.category_name}</p> : null}
                                        {item.product_description ? (
                                            <p className="line-clamp-2 text-xs text-muted-foreground">{item.product_description}</p>
                                        ) : null}
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                        <p className="text-muted-foreground">Price: {formatCurrency(item.price)}</p>
                                        <p className="font-semibold text-foreground">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No items available for this transaction.</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-border p-4 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{totals.subtotal}</span>
                        </div>
                        <div className="mt-1 flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>{totals.shipping}</span>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>{totals.grandTotal}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
