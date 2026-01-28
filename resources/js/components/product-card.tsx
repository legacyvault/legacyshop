import { IProducts } from '@/types';
import { useMemo, useState } from 'react';

export default function ProductCard({ product, onClick }: { product: IProducts; onClick: () => void }) {

    console.log(product)

    const [hover, setHover] = useState(false);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);

    // Derived fields from IProducts
    const primaryImage = useMemo(() => product.pictures?.[0]?.url || 'https://via.placeholder.com/600x800?text=No+Image', [product.pictures]);
    const secondaryImage = product.pictures?.[1]?.url;
    const basePrice = Number(product.product_price ?? 0);
    const eventDiscountPct = Number(product.event?.discount ?? 0);
    const productDiscountPct = Number(product.product_discount ?? 0);
    const appliedDiscountPct = eventDiscountPct > 0 ? eventDiscountPct : productDiscountPct;
    const salePrice = appliedDiscountPct > 0 ? Math.round(basePrice - (basePrice * appliedDiscountPct) / 100) : undefined;
    const isOnSale = appliedDiscountPct > 0;
    const hasEvent = Boolean(product.event);

    return (
        <div
            className={`group cursor-pointer rounded p-2 ${hover ? 'shadow-sm' : ''}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}
        >
            {/* Image block */}
            <div className="relative overflow-hidden rounded bg-background">
                {hasEvent && (
                    <span className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase shadow-sm">
                        {product.event?.name ?? 'Event'} { eventDiscountPct > 0 && (`· ${eventDiscountPct}% off`)}
                    </span>
                )}
                {/* Image */}
                <div className="relative aspect-[3/4] w-full">
                    {secondaryImage ? (
                        <img src={hover ? secondaryImage : primaryImage} alt={product.product_name} className="h-full w-full object-contain p-6" />
                    ) : (
                        <img src={primaryImage} alt={product.product_name} className="h-full w-full object-contain px-2" />
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="mt-4 space-y-2">
                <div className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">{product.unit?.name ?? ''}</div>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{product.product_name}</h3>

                {/* {hasEvent && (
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                            {product.event?.name ?? 'Event'} • {eventDiscountPct}% OFF
                        </span>
                    </div>
                )} */}

                <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold">{formatPrice(salePrice ?? basePrice)}</span>
                    {isOnSale && <span className="text-xs text-destructive line-through">{formatPrice(basePrice)}</span>}
                </div>
            </div>
        </div>
    );
}
