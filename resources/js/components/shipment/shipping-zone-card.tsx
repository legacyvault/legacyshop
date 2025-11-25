import { Country, ShippingZone } from '@/components/shipment/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CircleDollarSign, Edit3, Globe2 } from 'lucide-react';
import { useMemo } from 'react';

type ShippingZoneCardProps = {
    zone: ShippingZone;
    countries: Country[];
    loadingCountries: boolean;
    disableDelete?: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export default function ShippingZoneCard({ zone, countries, loadingCountries, disableDelete, onEdit, onDelete }: ShippingZoneCardProps) {
    const lookup = useMemo(() => {
        const map: Record<string, Country> = {};
        countries.forEach((country) => {
            map[country.code] = country;
        });
        return map;
    }, [countries]);

    const selectedCountries = zone.selectedCountries.map((code) => lookup[code]).filter((country): country is Country => Boolean(country));

    const continents = useMemo(() => {
        const set = new Set<string>();
        selectedCountries.forEach((country) => set.add(country.continent || 'Other'));
        return Array.from(set);
    }, [selectedCountries]);

    const priceValue = Number(zone.price);
    const priceLabel = zone.price
        ? Number.isFinite(priceValue)
            ? priceValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : `USD ${zone.price}`
        : 'Set price';

    const displayCountries = selectedCountries.slice(0, 4);
    const remainingCount = selectedCountries.length - displayCountries.length;

    return (
        <Card className="h-full border-muted/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                    <CardTitle className="text-base">{zone.name || 'Untitled zone'}</CardTitle>
                    <CardDescription className="line-clamp-2">{zone.description || 'Add a short description.'}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <CircleDollarSign className="size-4" />
                        {priceLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">Flat rate</div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Globe2 className="size-4 text-primary" />
                    {loadingCountries ? 'Loading countries...' : `${selectedCountries.length} of ${countries.length || '...'} countries selected`}
                </div>

                <div className="flex flex-wrap gap-2">
                    {continents.length > 0 ? (
                        continents.map((continent) => (
                            <Badge key={continent} variant="secondary">
                                {continent}
                            </Badge>
                        ))
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            No continents selected
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {displayCountries.length > 0 ? (
                        displayCountries.map((country) => (
                            <Badge key={country.code} variant="outline" className="flex items-center gap-1">
                                <span className="text-base leading-none">{country.flag || '?'}</span>
                                <span className="text-xs font-medium">{country.name}</span>
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">No countries selected yet.</span>
                    )}
                    {remainingCount > 0 && (
                        <Badge variant="outline" className="bg-muted text-xs">
                            +{remainingCount} more
                        </Badge>
                    )}
                </div>

                <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
                        <Edit3 className="size-4" />
                        Edit
                    </Button>
                    {/* <Button variant="ghost" size="sm" className="w-full" onClick={onDelete} disabled={disableDelete}>
                        <Trash2 className="size-4" />
                        Remove
                    </Button> */}
                </div>
            </CardContent>
        </Card>
    );
}
