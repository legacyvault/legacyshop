import { ReferralResponse, ReferralUsageResponse, toReferralCode, toReferralUsage } from '@/components/referral/referral-types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Percent, Search, ShoppingBag, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Referral',
        href: '/referral',
    },
    {
        title: 'Usage',
        href: '/referral/usage',
    },
];

const ALL_CODES = 'all';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

type PageProps = SharedData & {
    referrals?: ReferralResponse[];
    usages?: ReferralUsageResponse[];
};

export default function ReferralUsage() {
    const { referrals: referralData, usages: usageData } = usePage<PageProps>().props;
    const referralCodes = useMemo(() => (Array.isArray(referralData) ? referralData.map(toReferralCode) : []), [referralData]);
    const allUsages = useMemo(() => (Array.isArray(usageData) ? usageData.map(toReferralUsage) : []), [usageData]);

    const initialCode = useMemo(() => {
        if (typeof window === 'undefined') return ALL_CODES;
        const param = new URLSearchParams(window.location.search).get('code');
        if (!param) return ALL_CODES;
        const match = referralCodes.find((referral) => referral.code.toUpperCase() === param.toUpperCase());
        return match ? match.code : ALL_CODES;
    }, [referralCodes]);

    const [codeFilter, setCodeFilter] = useState<string>(initialCode);
    const [search, setSearch] = useState('');

    const usages = useMemo(() => {
        const term = search.trim().toLowerCase();

        return allUsages.filter((usage) => {
            const matchesCode = codeFilter === ALL_CODES || usage.referralCode === codeFilter;
            const matchesTerm =
                !term ||
                usage.customerName.toLowerCase().includes(term) ||
                usage.customerEmail.toLowerCase().includes(term) ||
                usage.orderNumber.toLowerCase().includes(term);

            return matchesCode && matchesTerm;
        });
    }, [allUsages, codeFilter, search]);

    const totals = useMemo(() => {
        const discount = usages.reduce((sum, usage) => sum + usage.discountAmount, 0);
        const revenue = usages.reduce((sum, usage) => sum + usage.orderTotal, 0);
        const customers = new Set(usages.map((usage) => usage.customerEmail)).size;
        return { discount, revenue, customers };
    }, [usages]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Referral Usage" />

            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl leading-tight font-semibold">Referral usage</h1>
                        <p className="text-sm text-muted-foreground">Every paid order that redeemed a referral code.</p>
                    </div>
                    <Link href="/referral">
                        <Button variant="outline">Back to referral codes</Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <ShoppingBag className="size-4 text-primary" />
                                Orders
                            </CardDescription>
                            <CardTitle className="text-2xl">{usages.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="size-4 text-primary" />
                                Customers
                            </CardDescription>
                            <CardTitle className="text-2xl">{totals.customers}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <Percent className="size-4 text-primary" />
                                Discount given
                            </CardDescription>
                            <CardTitle className="text-2xl">{formatCurrency(totals.discount)}</CardTitle>
                            <p className="text-xs text-muted-foreground">On {formatCurrency(totals.revenue)} of orders</p>
                        </CardHeader>
                    </Card>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="w-full sm:w-60">
                        <Select value={codeFilter} onValueChange={setCodeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by referral code" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CODES}>All referral codes</SelectItem>
                                {referralCodes.map((referral) => (
                                    <SelectItem key={referral.id} value={referral.code}>
                                        {referral.code} — {referral.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search customer or order"
                            className="pl-10"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div>
                        Total usage: <span className="font-semibold text-foreground">{usages.length}</span>
                        {usages.length !== allUsages.length && <span> of {allUsages.length} records</span>}
                        {codeFilter !== ALL_CODES && <span> · code {codeFilter}</span>}
                    </div>
                    <div>
                        Total discount: <span className="font-semibold text-foreground">{formatCurrency(totals.discount)}</span> · Total order:{' '}
                        <span className="font-semibold text-foreground">{formatCurrency(totals.revenue)}</span>
                    </div>
                </div>

                <table className="w-full table-fixed border-collapse text-sm">
                    <thead>
                        <tr className="bg-sidebar-accent">
                            <th className="w-12 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Code</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Referrer</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Customer</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Order</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Order total</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                            <th className="w-44 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Used at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usages.length > 0 ? (
                            usages.map((usage, index) => (
                                <tr key={usage.id} className="hover:bg-muted/40">
                                    <td className="border border-popover px-4 py-3">{index + 1}</td>
                                    <td className="border border-popover px-4 py-3 font-mono tracking-wide uppercase">{usage.referralCode}</td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">{usage.referralName}</td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">
                                        <div className="font-medium">{usage.customerName}</div>
                                        <div className="text-xs text-muted-foreground">{usage.customerEmail}</div>
                                    </td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">{usage.orderNumber}</td>
                                    <td className="border border-popover px-4 py-3">{formatCurrency(usage.orderTotal)}</td>
                                    <td className="border border-popover px-4 py-3">{formatCurrency(usage.discountAmount)}</td>
                                    <td className="border border-popover px-4 py-3">{formatDateTime(usage.usedAt)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="border border-popover px-4 py-6 text-center text-muted-foreground">
                                    No referral usage recorded for this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
