import { useCart } from '@/contexts/CartContext';
import { IProducts } from '@/types';
import { Heart, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { TooltipProvider } from './ui/tooltip';

export default function ProductCard({
    product,
    checked,
    onToggleCompare,
}: {
    product: IProducts;
    checked: boolean;
    onToggleCompare: (checked: boolean) => void;
}) {
    const [hover, setHover] = useState(false);
    const { addItem } = useCart();

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

    const addToCart = () => addItem({ id: product.id, name: product.product_name, price: salePrice ?? basePrice, image: primaryImage });

    return (
        <TooltipProvider delayDuration={0}>
            <div className="group">
                {/* Image block */}
                <div
                    className="relative overflow-hidden rounded bg-background"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    {/* Top-right action icons */}
                    <div className="pointer-events-none absolute top-3 right-3 z-20 flex translate-y-[-8px] gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <button className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white text-foreground shadow-sm hover:bg-muted">
                            <Heart size={16} />
                        </button>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[3/4] w-full">
                        {secondaryImage ? (
                            <img
                                src={hover ? secondaryImage : primaryImage}
                                alt={product.product_name}
                                className="h-full w-full object-contain p-6"
                            />
                        ) : (
                            <img src={primaryImage} alt={product.product_name} className="h-full w-full object-contain p-6" />
                        )}

                        {/* Dim overlay on hover */}
                        <div className={`absolute inset-0 bg-black/0 transition-colors duration-300 ${hover ? 'bg-black/5' : ''}`} />
                    </div>

                    {/* Quick actions under image (revealed on hover) */}
                    <div className="max-h-0 space-y-3 overflow-hidden p-4 opacity-0 transition-all duration-300 ease-out group-hover:max-h-40 group-hover:opacity-100">
                        <Button onClick={addToCart} className={`w-full`}>
                            <Plus className="mr-2 h-4 w-4" /> Add to Cart
                        </Button>
                        <label className="flex items-center gap-2 text-sm text-foreground/80">
                            <Checkbox id={`cmp-${product.id}`} checked={checked} onCheckedChange={(v) => onToggleCompare(!!v)} />
                            <span>Compare</span>
                        </label>
                    </div>
                </div>

                {/* Meta */}
                <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">{product.unit.name}</div>
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{product.product_name}</h3>

                    <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted-foreground">From</span>
                        <span className="text-base font-extrabold">{formatPrice(salePrice ?? basePrice)}</span>
                        {isOnSale && <span className="text-xs text-destructive line-through">{formatPrice(basePrice)}</span>}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
