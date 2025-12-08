import { VoucherFormState, VoucherProductOption } from '@/components/misc/voucher-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit3, Infinity, Package2, Percent, Tag } from 'lucide-react';

type VoucherCardProps = {
    voucher: VoucherFormState;
    products: VoucherProductOption[];
    onEdit: () => void;
};

const formatDiscount = (discount: string) => {
    const numeric = Number.parseFloat(discount);
    if (Number.isFinite(numeric)) {
        return `${numeric}% off`;
    }

    return discount || 'Set discount';
};

const formatLimit = (isLimit: boolean, limit: string) => {
    if (!isLimit) return 'Unlimited uses';

    const numeric = Number.parseInt(limit, 10);
    if (Number.isFinite(numeric)) {
        return `${numeric} total uses`;
    }

    return 'Set usage limit';
};

export default function VoucherCard({ voucher, products, onEdit }: VoucherCardProps) {
    const discountLabel = formatDiscount(voucher.discount);
    const limitLabel = formatLimit(voucher.isLimit, voucher.limit);

    const previewProducts = products.slice(0, 4);
    const remainingProducts = products.length - previewProducts.length;

    const groupNames = Array.from(
        new Set(
            products
                .map((product) => product.groupName)
                .filter((name): name is string => Boolean(name)),
        ),
    );

    return (
        <Card className="h-full border-muted/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                    <CardTitle className="text-base">{voucher.name || 'Untitled voucher'}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                        <Tag className="size-4 text-primary" />
                        <span className="font-mono uppercase tracking-wide">{voucher.code || 'No code set'}</span>
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Percent className="size-4" />
                        {discountLabel}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Infinity className="size-3.5 text-muted-foreground" />
                        {limitLabel}
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Package2 className="size-4 text-primary" />
                    {products.length ? `${products.length} products attached` : 'No products linked yet'}
                </div>

                <div className="flex flex-wrap gap-2">
                    {groupNames.length ? (
                        groupNames.map((group) => (
                            <Badge key={group} variant="secondary">
                                {group}
                            </Badge>
                        ))
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            No product groups
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {previewProducts.length ? (
                        previewProducts.map((product) => (
                            <Badge key={product.id} variant="outline" className="flex items-center gap-2">
                                <span className="text-xs font-semibold">{product.name}</span>
                                {product.sku && <span className="rounded bg-muted px-1 text-[10px] uppercase text-muted-foreground">SKU {product.sku}</span>}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">Voucher applies to all products.</span>
                    )}
                    {remainingProducts > 0 && (
                        <Badge variant="outline" className="bg-muted text-xs">
                            +{remainingProducts} more
                        </Badge>
                    )}
                </div>

                <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
                        <Edit3 className="size-4" />
                        Edit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
