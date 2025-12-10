import { EventFormState, EventGroupOption } from '@/components/misc/event-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Image as ImageIcon, Loader2, Search, TicketPercent } from 'lucide-react';

type EventModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventFormState;
    productGroups: EventGroupOption[];
    onFieldChange: (field: keyof EventFormState, value: string | boolean | File | null) => void;
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

export default function EventModal({
    open,
    onOpenChange,
    event,
    productGroups,
    onFieldChange,
    onToggleProduct,
    onToggleGroup,
    onSave,
    saving = false,
    errorMessage,
}: EventModalProps) {
    const renderGroups = () => {
        if (!productGroups.length) {
            return (
                <div className="rounded-lg border border-dashed border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    No product groups available. Create a group first to attach products.
                </div>
            );
        }

        let hasVisible = false;

        const blocks = productGroups
            .map((group) => {
                const products = group.products ?? [];
                if (!products.length && event.search.trim()) return null;

                const filteredProducts = products.filter(
                    (product) => matchesSearch(event.search, product.name) || matchesSearch(event.search, product.sku),
                );

                if (!filteredProducts.length && event.search.trim()) return null;

                const selectedInGroup = products.filter((product) => event.productIds.includes(product.id)).length;
                const allSelected = products.length > 0 && selectedInGroup === products.length;
                const someSelected = !allSelected && selectedInGroup > 0;
                const checkedState: CheckedState = allSelected ? true : someSelected ? 'indeterminate' : false;

                hasVisible = hasVisible || filteredProducts.length > 0 || (!event.search.trim() && !products.length);

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
                                            checked={event.productIds.includes(product.id)}
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
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{event.isNew ? 'Create event' : 'Edit event'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-sm">
                        <TicketPercent className="size-4" />
                        Set discount, activation, and included products for this event.
                    </DialogDescription>
                    <div className="text-xs text-muted-foreground">{event.productIds.length} products selected.</div>
                </DialogHeader>

                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertTitle>Unable to save this event</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`event-name-${event.id}`}>Event name</Label>
                            <Input
                                id={`event-name-${event.id}`}
                                placeholder="Flash Sale"
                                value={event.name}
                                onChange={(e) => onFieldChange('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`event-discount-${event.id}`}>Discount (%)</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    %
                                </span>
                                <Input
                                    id={`event-discount-${event.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-8"
                                    placeholder="20"
                                    value={event.discount}
                                    onChange={(e) => onFieldChange('discount', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`event-description-${event.id}`}>Description</Label>
                        <textarea
                            id={`event-description-${event.id}`}
                            rows={3}
                            placeholder="Add details about this event."
                            value={event.description}
                            onChange={(e) => onFieldChange('description', e.target.value)}
                            className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-semibold">
                                <Checkbox checked={event.isActive} onCheckedChange={(value) => onFieldChange('isActive', value === true)} />
                                Set as active
                            </Label>
                            <p className="text-xs text-muted-foreground">Maximum 3 events can be active at the same time.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-semibold">
                                <ImageIcon className="size-4" />
                                Event image (optional)
                            </Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onFieldChange('imageFile', e.target.files?.[0] ?? null)}
                            />
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {event.imageFile && <Badge variant="secondary">Selected: {event.imageFile.name}</Badge>}
                                {!event.imageFile && event.imageUrl && (
                                    <a
                                        href={event.imageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline underline-offset-2"
                                    >
                                        View current image
                                    </a>
                                )}
                                {!event.imageFile && !event.imageUrl && <span>No image selected.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-muted/70 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">Choose products</div>
                                <p className="text-xs text-muted-foreground">
                                    Select individual products inside each group. At least one product is required.
                                </p>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-72">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by product or SKU"
                                        className="pl-10"
                                        value={event.search}
                                        onChange={(e) => onFieldChange('search', e.target.value)}
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
                            Save event
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
