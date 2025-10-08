import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { IRatePricing } from '@/types';
import { Check, CurrencyIcon, PackageCheck, ReceiptText, ShieldCheck } from 'lucide-react';

interface CourierListModalProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    rates: IRatePricing[];
    selectedRateId?: string;
    onSelect: (rate: IRatePricing) => void;
    isLoading?: boolean;
    error?: string | null;
}

function getRateId(rate: IRatePricing) {
    return `${rate.courier_code}-${rate.courier_service_code}`;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function CourierListModal({ open, onOpenChange, rates, selectedRateId, onSelect, isLoading = false }: CourierListModalProps) {
    const hasRates = rates.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Select Delivery Courier</DialogTitle>
                    <DialogDescription>Select the delivery service available for your address.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading shipping options…</p>
                    ) : hasRates ? (
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                            {rates.map((rate) => {
                                const rateId = getRateId(rate);
                                const isSelected = rateId === selectedRateId;
                                const priceValue = Number(rate.price);
                                const displayPrice = Number.isFinite(priceValue) ? priceValue : 0;
                                const durationLabel = rate.shipment_duration_range ?? rate.duration ?? '';
                                const durationUnit = rate.shipment_duration_unit ?? '';

                                return (
                                    <button
                                        key={rateId}
                                        type="button"
                                        onClick={() => onSelect(rate)}
                                        className={cn(
                                            'w-full rounded-xl border bg-background p-4 text-left transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
                                            isSelected ? 'border-primary shadow-sm' : 'border-border/60 hover:border-primary/40',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-2 text-sm">
                                                <div className="font-semibold text-foreground">
                                                    {rate.courier_name} • {rate.courier_service_name}
                                                </div>
                                                {rate.description ? <p className="text-xs text-muted-foreground">{rate.description}</p> : null}
                                                {durationLabel ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        Estimate {durationLabel} {durationUnit}
                                                    </p>
                                                ) : null}
                                                <p className="text-xs font-semibold text-foreground">{formatCurrency(displayPrice)}</p>
                                                {rate.available_for_insurance ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Available For Insurance
                                                    </div>
                                                ) : null}
                                                {rate.available_for_cash_on_delivery ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <CurrencyIcon className="h-4 w-4" />
                                                        Available for Cash on Delivery
                                                    </div>
                                                ) : null}
                                                {rate.available_for_instant_waybill_id ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <ReceiptText className="h-4 w-4" />
                                                        Available for Instant Waybill
                                                    </div>
                                                ) : null}
                                                {rate.available_for_proof_of_delivery ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <PackageCheck className="h-4 w-4" />
                                                        Available for Proof of Delivery
                                                    </div>
                                                ) : null}
                                            </div>
                                            {isSelected ? (
                                                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="h-4 w-4" />
                                                </span>
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No shipping options available.</p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
