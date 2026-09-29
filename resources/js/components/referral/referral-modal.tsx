import { ReferralFormState } from '@/components/referral/referral-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users } from 'lucide-react';

type ReferralModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    referral: ReferralFormState;
    onFieldChange: (field: keyof ReferralFormState, value: string | boolean) => void;
    onSave: () => void;
    saving?: boolean;
};

export default function ReferralModal({ open, onOpenChange, referral, onFieldChange, onSave, saving = false }: ReferralModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{referral.isNew ? 'Add referral code' : 'Edit referral code'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-sm">
                        <Users className="size-4" />
                        Set the referrer name, the code customers type at checkout, and the discount they get.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`referral-name-${referral.id}`}>Name</Label>
                        <Input
                            id={`referral-name-${referral.id}`}
                            placeholder="Andi Pratama"
                            value={referral.name}
                            onChange={(event) => onFieldChange('name', event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Who owns this referral code.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`referral-code-${referral.id}`}>Referral code</Label>
                        <Input
                            id={`referral-code-${referral.id}`}
                            placeholder="ANDI10"
                            className="font-mono uppercase"
                            value={referral.code}
                            onChange={(event) => onFieldChange('code', event.target.value.toUpperCase())}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`referral-discount-${referral.id}`}>Discount (%)</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                %
                            </span>
                            <Input
                                id={`referral-discount-${referral.id}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="pl-8"
                                placeholder="10"
                                value={referral.discount}
                                onChange={(event) => onFieldChange('discount', event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-muted bg-muted/20 px-4 py-3">
                        <div>
                            <div className="text-sm font-semibold">Active</div>
                            <p className="text-xs text-muted-foreground">Inactive codes are rejected at checkout.</p>
                        </div>
                        <Switch checked={referral.isActive} onCheckedChange={(value) => onFieldChange('isActive', value)} />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save referral code'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
