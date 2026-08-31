import { IProducts } from '@/types';
import { useMemo, useState } from 'react';

export default function ProductCard({ product, onClick }: { product: IProducts; onClick: () => void }) {
    const [hover, setHover] = useState(false);

    const formatPrice = (price: number, currency: string) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);

    // Derived fields from IProducts
    // Prefer the resized thumbnail (grid cards don't need the full-size original) — falls
    // back to the full-size url for pictures uploaded before thumbnails were generated.
    const primaryImage = useMemo(
        () => product.pictures?.[0]?.thumbnail_url || product.pictures?.[0]?.url || 'https://via.placeholder.com/600x800?text=No+Image',
        [product.pictures],
    );
    const secondaryImage = product.pictures?.[1]?.thumbnail_url || product.pictures?.[1]?.url;
    const currency = (product.default_currency || 'IDR').toUpperCase();
    const basePrice = Number(product.default_price ?? 0);
    const eventDiscountPct = Number(product.event?.discount ?? 0);
    const productDiscountPct = Number(product.product_discount ?? 0);
    const appliedDiscountPct = eventDiscountPct > 0 ? eventDiscountPct : productDiscountPct;
    const salePrice = appliedDiscountPct > 0 ? Math.round(basePrice - (basePrice * appliedDiscountPct) / 100) : undefined;
    const isOnSale = appliedDiscountPct > 0;
    const hasEvent = Boolean(product.event);

    return (
        <div
            className="group h-full cursor-pointer rounded border border-transparent p-1.5 transition-all duration-300 ease-out hover:rounded-xl hover:shadow-md sm:p-2"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}
        >
            {/* Image block */}
            <div className="relative overflow-hidden rounded bg-background transition-all duration-300 ease-out group-hover:rounded-lg">
                {hasEvent && eventDiscountPct > 0 && (
                    <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-primary-foreground uppercase shadow-sm sm:top-2 sm:left-2 sm:px-2.5 sm:text-[10px]">
                        {`${eventDiscountPct}%`}
                    </span>
                )}
                {/* Image */}
                <div className="relative aspect-[3/4] w-full">
                    {secondaryImage ? (
                        <>
                            <img
                                src={primaryImage}
                                alt={product.product_name}
                                className={`h-full w-full object-cover transition-opacity duration-500 ease-in-out ${hover ? 'opacity-0' : 'opacity-100'}`}
                                loading="lazy"
                                width={600}
                                height={800}
                            />
                            <img
                                src={secondaryImage}
                                alt={product.product_name}
                                aria-hidden
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${hover ? 'opacity-100' : 'opacity-0'}`}
                                loading="lazy"
                                width={600}
                                height={800}
                            />
                        </>
                    ) : (
                        <img
                            src={primaryImage}
                            alt={product.product_name}
                            className="h-full w-full object-contain px-2 transition-opacity duration-500 ease-in-out"
                            loading="lazy"
                            width={600}
                            height={800}
                        />
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="mt-2 space-y-1 sm:mt-3 sm:space-y-1.5">
                <div className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground sm:text-[10px]">{product.unit?.name ?? ''}</div>
                <h3 className="line-clamp-2 min-h-[2rem] text-[11px] font-medium text-foreground sm:min-h-[2.25rem] sm:text-xs">
                    {product.product_name}
                </h3>

                {/* {hasEvent && (
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                            {product.event?.name ?? 'Event'} • {eventDiscountPct}% OFF
                        </span>
                    </div>
                )} */}

                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-xs font-extrabold sm:text-sm">{formatPrice(salePrice ?? basePrice, currency)}</span>
                    {isOnSale && <span className="text-[10px] text-destructive line-through">{formatPrice(basePrice, currency)}</span>}
                </div>
            </div>
        </div>
    );
}
