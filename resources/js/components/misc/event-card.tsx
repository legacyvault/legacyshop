import { EventFormState, EventProductOption } from '@/components/misc/event-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Edit3, Package2, Percent, XCircle } from 'lucide-react';

type EventCardProps = {
    event: EventFormState;
    products: EventProductOption[];
    onEdit: () => void;
};

const formatDiscount = (discount: string) => {
    const numeric = Number.parseFloat(discount);
    if (Number.isFinite(numeric)) {
        return `${numeric}% off`;
    }
    return discount || 'Set discount';
};

export default function EventCard({ event, products, onEdit }: EventCardProps) {
    const discountLabel = formatDiscount(event.discount);
    const previewProducts = products.slice(0, 4);
    const remainingProducts = products.length - previewProducts.length;

    return (
        <Card className="h-full border-muted/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                    <CardTitle className="text-base">{event.name || 'Untitled event'}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description || 'Add an event description.'}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Percent className="size-4" />
                        {discountLabel}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {event.isActive ? (
                            <>
                                <CheckCircle2 className="size-4 text-emerald-600" />
                                Active
                            </>
                        ) : (
                            <>
                                <XCircle className="size-4 text-muted-foreground" />
                                Inactive
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Package2 className="size-4 text-primary" />
                    {products.length ? `${products.length} products linked` : 'No products linked yet'}
                </div>

                <div className="flex flex-wrap gap-2">
                    {previewProducts.length ? (
                        previewProducts.map((product) => (
                            <Badge key={product.id} variant="outline" className="flex w-full min-w-0 items-center gap-2">
                                <span className="truncate text-xs font-semibold">{product.name}</span>
                                {product.sku && <span className="shrink-0 rounded bg-muted px-1 text-[10px] uppercase text-muted-foreground">SKU {product.sku}</span>}
                            </Badge>
                        ))
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            Applies to selected products only
                        </Badge>
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
