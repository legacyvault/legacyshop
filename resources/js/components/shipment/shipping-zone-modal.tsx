import { Country, ShippingZone } from '@/components/shipment/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Loader2, Search } from 'lucide-react';

type ShippingZoneModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    zone: ShippingZone;
    countriesByContinent: Record<string, Country[]>;
    orderedContinents: string[];
    loadingCountries: boolean;
    countryError: string | null;
    onFieldChange: (field: keyof ShippingZone, value: string) => void;
    onToggleCountry: (code: string, checked: boolean) => void;
    onToggleContinent: (continent: string, next: CheckedState) => void;
};

export default function ShippingZoneModal({
    open,
    onOpenChange,
    zone,
    countriesByContinent,
    orderedContinents,
    loadingCountries,
    countryError,
    onFieldChange,
    onToggleCountry,
    onToggleContinent,
}: ShippingZoneModalProps) {
    const matchesSearch = (country: Country, term: string) => {
        if (!term) return true;
        const lookup = term.trim().toLowerCase();
        return country.name.toLowerCase().includes(lookup) || country.code.toLowerCase().includes(lookup);
    };

    const renderCountries = () => {
        if (loadingCountries) {
            return (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="h-20 rounded-lg border border-dashed border-muted bg-muted/40" />
                    ))}
                </div>
            );
        }

        if (countryError) {
            return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{countryError}</div>;
        }

        let hasVisibleCountry = false;

        const continentBlocks = orderedContinents
            .map((continent) => {
                const continentCountries = countriesByContinent[continent] ?? [];
                if (!continentCountries.length) return null;

                const filteredCountries = continentCountries.filter((country) => matchesSearch(country, zone.search));

                if (!filteredCountries.length && zone.search.trim()) return null;

                const selectedInContinent = continentCountries.filter((country) => zone.selectedCountries.includes(country.code)).length;
                const allSelected =
                    continentCountries.length > 0 && continentCountries.every((country) => zone.selectedCountries.includes(country.code));
                const someSelected = !allSelected && selectedInContinent > 0;
                const checkedState: CheckedState = allSelected ? true : someSelected ? 'indeterminate' : false;

                hasVisibleCountry = hasVisibleCountry || filteredCountries.length > 0;

                return (
                    <div key={continent} className="rounded-lg border border-dashed border-muted bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-3 text-sm font-semibold">
                                <Checkbox checked={checkedState} onCheckedChange={(value) => onToggleContinent(continent, value)} />
                                <span>{continent}</span>
                                <Badge variant="secondary" className="bg-white text-slate-900">
                                    {continentCountries.length}
                                </Badge>
                            </label>
                            <div className="text-xs text-muted-foreground">{selectedInContinent} selected in this continent</div>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCountries.map((country) => (
                                <label
                                    key={country.code}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-muted bg-background px-3 py-2 text-sm transition hover:border-primary/60 hover:bg-primary/5"
                                >
                                    <Checkbox
                                        checked={zone.selectedCountries.includes(country.code)}
                                        onCheckedChange={(value) => onToggleCountry(country.code, value === true)}
                                    />
                                    <span className="text-lg">{country.flag}</span>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{country.name}</span>
                                        <span className="text-[11px] text-muted-foreground uppercase">{country.code}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })
            .filter(Boolean);

        if (!hasVisibleCountry) {
            return (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    No countries match your search. Try a different name or code.
                </div>
            );
        }

        return <div className="space-y-3">{continentBlocks}</div>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Edit shipping zone</DialogTitle>
                    <DialogDescription>Update details, pricing, and destinations for this zone.</DialogDescription>
                    <div className="text-xs text-muted-foreground">{zone.selectedCountries.length} destinations selected in this zone.</div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`zone-name-${zone.id}`}>Zone name</Label>
                            <Input
                                id={`zone-name-${zone.id}`}
                                placeholder="e.g. Asia Priority"
                                value={zone.name}
                                onChange={(event) => onFieldChange('name', event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`zone-price-${zone.id}`}>USD price</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    USD
                                </span>
                                <Input
                                    id={`zone-price-${zone.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-12"
                                    placeholder="45.00"
                                    value={zone.price}
                                    onChange={(event) => onFieldChange('price', event.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`zone-description-${zone.id}`}>Description</Label>
                        <textarea
                            id={`zone-description-${zone.id}`}
                            rows={3}
                            placeholder="Add internal notes or customer-facing details for this shipping zone."
                            value={zone.description}
                            onChange={(event) => onFieldChange('description', event.target.value)}
                            className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    </div>

                    <div className="space-y-3 rounded-xl border border-muted/70 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">Choose countries</div>
                                <p className="text-xs text-muted-foreground">Select individual countries or toggle an entire continent.</p>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-72">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by country or code"
                                        className="pl-10"
                                        value={zone.search}
                                        onChange={(event) => onFieldChange('search', event.target.value)}
                                    />
                                </div>
                                {loadingCountries && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Loading countries...
                                    </div>
                                )}
                            </div>
                        </div>
                        {renderCountries()}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
