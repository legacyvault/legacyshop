import { mockReferralCodes, mockReferralUsages } from '@/components/referral/referral-mock';
import ReferralModal from '@/components/referral/referral-modal';
import { ReferralCode, ReferralFormState } from '@/components/referral/referral-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Percent, Plus, Search, Ticket, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Referral',
        href: '/referral',
    },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
};

const generateId = () => `referral-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function ReferralIndex() {
    const [referrals, setReferrals] = useState<ReferralCode[]>(mockReferralCodes);
    const [draft, setDraft] = useState<ReferralFormState | null>(null);
    const [search, setSearch] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const totals = useMemo(() => {
        const usage = referrals.reduce((sum, referral) => sum + referral.totalUsage, 0);
        const discount = referrals.reduce((sum, referral) => sum + referral.totalDiscountGiven, 0);
        const active = referrals.filter((referral) => referral.isActive).length;
        return { usage, discount, active };
    }, [referrals]);

    const filteredReferrals = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return referrals;
        return referrals.filter(
            (referral) => referral.name.toLowerCase().includes(term) || referral.code.toLowerCase().includes(term),
        );
    }, [referrals, search]);

    const addReferral = () => {
        setDraft({
            id: generateId(),
            name: '',
            code: '',
            discount: '',
            isActive: true,
            isNew: true,
        });
    };

    const editReferral = (referral: ReferralCode) => {
        setDraft({
            id: referral.id,
            name: referral.name,
            code: referral.code,
            discount: String(referral.discount),
            isActive: referral.isActive,
            isNew: false,
        });
    };

    const updateDraftField = (field: keyof ReferralFormState, value: string | boolean) => {
        setDraft((prev) => (prev ? ({ ...prev, [field]: value } as ReferralFormState) : prev));
    };

    // UI-only for now: saving just updates local state, no request is sent yet.
    const handleSave = () => {
        if (!draft) return;

        const trimmedName = draft.name.trim();
        const trimmedCode = draft.code.trim().toUpperCase();
        const discountValue = Number.parseFloat(draft.discount);

        if (!trimmedName) {
            setFormError('Please provide a referrer name.');
            return;
        }

        if (!trimmedCode) {
            setFormError('Referral code is required.');
            return;
        }

        if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
            setFormError('Discount must be between 0 and 100 percent.');
            return;
        }

        const duplicate = referrals.some((referral) => referral.code.toUpperCase() === trimmedCode && referral.id !== draft.id);
        if (duplicate) {
            setFormError('That referral code already exists.');
            return;
        }

        setReferrals((prev) => {
            if (draft.isNew) {
                return [
                    ...prev,
                    {
                        id: draft.id,
                        name: trimmedName,
                        code: trimmedCode,
                        discount: discountValue,
                        isActive: draft.isActive,
                        totalUsage: 0,
                        totalDiscountGiven: 0,
                        createdAt: new Date().toISOString(),
                    },
                ];
            }

            return prev.map((referral) =>
                referral.id === draft.id
                    ? { ...referral, name: trimmedName, code: trimmedCode, discount: discountValue, isActive: draft.isActive }
                    : referral,
            );
        });

        setDraft(null);
    };

    const toggleActive = (referral: ReferralCode) => {
        setReferrals((prev) => prev.map((item) => (item.id === referral.id ? { ...item, isActive: !item.isActive } : item)));
    };

    const deleteReferral = (referral: ReferralCode) => {
        if (!confirm(`Delete referral code "${referral.code}"?`)) return;
        setReferrals((prev) => prev.filter((item) => item.id !== referral.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Referral Code" />

            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl leading-tight font-semibold">Referral code</h1>
                        <p className="text-sm text-muted-foreground">
                            Create referral codes with a percentage discount and track how often each one is used.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/referral/usage">
                            <Button variant="outline">View usage</Button>
                        </Link>
                        <Button onClick={addReferral}>
                            <Plus className="size-4" />
                            Add referral code
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <Ticket className="size-4 text-primary" />
                                Active codes
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {totals.active} / {referrals.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="size-4 text-primary" />
                                Total usage
                            </CardDescription>
                            <CardTitle className="text-2xl">{totals.usage}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription className="flex items-center gap-2">
                                <Percent className="size-4 text-primary" />
                                Discount given
                            </CardDescription>
                            <CardTitle className="text-2xl">{formatCurrency(totals.discount)}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                        {filteredReferrals.length > 0 ? `Showing ${filteredReferrals.length} referral codes` : 'No referral codes found.'}
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or code"
                            className="pl-10"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full table-fixed border-collapse text-sm">
                    <thead>
                        <tr className="bg-sidebar-accent">
                            <th className="w-12 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Name</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Code</th>
                            <th className="w-28 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount</th>
                            <th className="w-24 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Usage</th>
                            <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Discount given</th>
                            <th className="w-24 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Status</th>
                            <th className="w-32 border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Created</th>
                            <th className="w-20 border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReferrals.length > 0 ? (
                            filteredReferrals.map((referral, index) => (
                                <tr key={referral.id} className="hover:bg-muted/40">
                                    <td className="border border-popover px-4 py-3">{index + 1}</td>
                                    <td className="border border-popover px-4 py-3 break-words whitespace-normal">{referral.name}</td>
                                    <td className="border border-popover px-4 py-3 font-mono tracking-wide uppercase">{referral.code}</td>
                                    <td className="border border-popover px-4 py-3">{referral.discount}%</td>
                                    <td className="border border-popover px-4 py-3">
                                        <Link href={`/referral/usage?code=${referral.code}`} className="underline underline-offset-2">
                                            {referral.totalUsage}x
                                        </Link>
                                    </td>
                                    <td className="border border-popover px-4 py-3">{formatCurrency(referral.totalDiscountGiven)}</td>
                                    <td className="border border-popover px-4 py-3">
                                        <Badge variant={referral.isActive ? 'default' : 'outline'}>
                                            {referral.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="border border-popover px-4 py-3">{formatDate(referral.createdAt)}</td>
                                    <td className="border border-popover px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="rounded px-2 py-1 text-muted-foreground hover:bg-muted">
                                                ⋮
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1" onClick={() => editReferral(referral)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer px-3 py-1" onClick={() => toggleActive(referral)}>
                                                    {referral.isActive ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer px-3 py-1 text-red-600"
                                                    onClick={() => deleteReferral(referral)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="border border-popover px-4 py-6 text-center text-muted-foreground">
                                    No referral codes yet. Add your first one to start tracking referrals.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base">Latest usage</CardTitle>
                        <CardDescription>Most recent orders that redeemed a referral code.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {mockReferralUsages.slice(0, 3).map((usage) => (
                            <div key={usage.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-muted px-3 py-2">
                                <div className="text-sm">
                                    <span className="font-mono uppercase">{usage.referralCode}</span>
                                    <span className="text-muted-foreground"> · {usage.customerName}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {usage.orderNumber} · {formatCurrency(usage.discountAmount)} off · {formatDate(usage.usedAt)}
                                </div>
                            </div>
                        ))}
                        <Link href="/referral/usage" className="inline-block pt-1 text-sm underline underline-offset-2">
                            See all usage
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {draft && (
                <ReferralModal
                    open={Boolean(draft)}
                    onOpenChange={(open) => {
                        if (!open) setDraft(null);
                    }}
                    referral={draft}
                    onFieldChange={updateDraftField}
                    onSave={handleSave}
                />
            )}

            <Dialog
                open={Boolean(formError)}
                onOpenChange={(open) => {
                    if (!open) setFormError(null);
                }}
            >
                <DialogContent>
                    <DialogTitle>Error</DialogTitle>
                    <DialogDescription>{formError}</DialogDescription>
                    <DialogClose asChild>
                        <Button variant="outline" className="mt-2 w-full">
                            Okay
                        </Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
