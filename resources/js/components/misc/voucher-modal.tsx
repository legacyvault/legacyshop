import { VoucherFormState, VoucherGroupOption } from '@/components/misc/voucher-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Loader2, Search, TicketPercent } from 'lucide-react';

type VoucherModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voucher: VoucherFormState;
    productGroups: VoucherGroupOption[];
    onFieldChange: (field: keyof VoucherFormState, value: string | boolean) => void;
    onToggleProduct: (productId: string, checked: boolean) => void;
    onToggleGroup: (groupId: string, next: CheckedState) => void;
    onSave?: () => void;
    saving?: boolean;
    errorMessage?: string | null;
};

const matchesSearch = (term: string, value?: string | null) => {
    if (!term) return true;
    const lookup = term.trim().toLowerCase();
    if (!lookup) return true;
    return typeof value === 'string' && value.toLowerCase().includes(lookup);
};

export default function VoucherModal({
    open,
    onOpenChange,
    voucher,
    productGroups,
    onFieldChange,
    onToggleProduct,
    onToggleGroup,
    onSave,
    saving = false,
    errorMessage,
}: VoucherModalProps) {
    const renderGroups = () => {
        if (!productGroups.length) {
            return (
                <div className="rounded-lg border border-dashed border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    No product groups available. Create a product group first to attach products.
                </div>
            );
        }

        let hasVisible = false;

        const blocks = productGroups
            .map((group) => {
                const products = group.products ?? [];
                if (!products.length && voucher.search.trim()) return null;

                const filteredProducts = products.filter(
                    (product) => matchesSearch(voucher.search, product.name) || matchesSearch(voucher.search, product.sku),
                );

                if (!filteredProducts.length && voucher.search.trim()) return null;

                const selectedInGroup = products.filter((product) => voucher.productIds.includes(product.id)).length;
                const allSelected = products.length > 0 && selectedInGroup === products.length;
                const someSelected = !allSelected && selectedInGroup > 0;
                const checkedState: CheckedState = allSelected ? true : someSelected ? 'indeterminate' : false;

                hasVisible = hasVisible || filteredProducts.length > 0 || (!voucher.search.trim() && !products.length);

                return (
                    <div key={group.id} className="rounded-lg border border-dashed border-muted bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-3 text-sm font-semibold">
                                <Checkbox checked={checkedState} onCheckedChange={(value) => onToggleGroup(group.id, value)} />
                                <span>{group.name}</span>
                                <Badge variant="secondary" className="bg-white text-slate-900">
                                    {group.productsCount ?? group.products.length}
                                </Badge>
                            </label>
                            <div className="text-xs text-muted-foreground">{selectedInGroup} selected in this group</div>
                        </div>
                        {products.length ? (
                            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                {filteredProducts.map((product) => (
                                    <label
                                        key={product.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-muted bg-background px-3 py-2 text-sm transition hover:border-primary/60 hover:bg-primary/5"
                                    >
                                        <Checkbox
                                            checked={voucher.productIds.includes(product.id)}
                                            onCheckedChange={(value) => onToggleProduct(product.id, value === true)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{product.name}</span>
                                            <span className="text-[11px] text-muted-foreground uppercase">
                                                {product.sku ? `SKU ${product.sku}` : 'No SKU'}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-md border border-dashed border-muted px-3 py-2 text-xs text-muted-foreground">
                                No products inside this group yet.
                            </div>
                        )}
                    </div>
                );
            })
            .filter(Boolean);

        if (!hasVisible) {
            return (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    No products match your search. Try a different name or SKU.
                </div>
            );
        }

        return <div className="space-y-3">{blocks}</div>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>{voucher.isNew ? 'Create voucher' : 'Edit voucher'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-sm">
                        <TicketPercent className="size-4" />
                        Set the code, discount, and product scope for this voucher.
                    </DialogDescription>
                    <div className="text-xs text-muted-foreground">{voucher.productIds.length} products selected.</div>
                </DialogHeader>

                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertTitle>Unable to save this voucher</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`voucher-name-${voucher.id}`}>Voucher name</Label>
                            <Input
                                id={`voucher-name-${voucher.id}`}
                                placeholder="Spring Sale"
                                value={voucher.name}
                                onChange={(event) => onFieldChange('name', event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`voucher-code-${voucher.id}`}>Voucher code</Label>
                            <Input
                                id={`voucher-code-${voucher.id}`}
                                placeholder="SPRING25"
                                value={voucher.code}
                                onChange={(event) => onFieldChange('code', event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`voucher-discount-${voucher.id}`}>Discount (%)</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    %
                                </span>
                                <Input
                                    id={`voucher-discount-${voucher.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-8"
                                    placeholder="10"
                                    value={voucher.discount}
                                    onChange={(event) => onFieldChange('discount', event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-semibold">
                                <Checkbox checked={voucher.isLimit} onCheckedChange={(value) => onFieldChange('isLimit', value === true)} />
                                Limit total uses
                            </Label>
                            <p className="text-xs text-muted-foreground">Enable if this voucher should only be redeemed a certain number of times.</p>
                            {voucher.isLimit && (
                                <Input
                                    id={`voucher-limit-${voucher.id}`}
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="100"
                                    value={voucher.limit}
                                    onChange={(event) => onFieldChange('limit', event.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-muted/70 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">Choose products</div>
                                <p className="text-xs text-muted-foreground">
                                    Select individual products inside each group. Leave empty to apply to all products.
                                </p>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-72">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by product or SKU"
                                        className="pl-10"
                                        value={voucher.search}
                                        onChange={(event) => onFieldChange('search', event.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        {renderGroups()}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    {onSave && (
                        <Button onClick={onSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Save voucher
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
