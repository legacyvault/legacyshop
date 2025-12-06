import { IProducts } from '@/types';
import { useMemo, useState } from 'react';

export default function ProductCard({ product, onClick }: { product: IProducts; onClick: () => void }) {
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
    const discountPct = Number(product.product_discount ?? 0);
    const salePrice = discountPct > 0 ? Math.round(basePrice - (basePrice * discountPct) / 100) : undefined;
    const isOnSale = discountPct > 0;

    return (
        <div
            className={`group cursor-pointer rounded p-2 ${hover ? 'shadow-sm' : ''}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}
        >
            {/* Image block */}
            <div className="relative overflow-hidden rounded bg-background">
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
                <div className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                    {product.unit?.name ?? ''}
                </div>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{product.product_name}</h3>

                <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold">{formatPrice(salePrice ?? basePrice)}</span>
                    {isOnSale && <span className="text-xs text-destructive line-through">{formatPrice(basePrice)}</span>}
                </div>
            </div>
        </div>
    );
}
