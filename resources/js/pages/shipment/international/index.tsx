import ShippingZoneCard from '@/components/shipment/shipping-zone-card';
import ShippingZoneModal from '@/components/shipment/shipping-zone-modal';
import { Country, ShippingZone } from '@/components/shipment/types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const CONTINENT_ORDER = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania', 'Antarctica', 'Other'];

const buildZone = (): ShippingZone => ({
    id: `zone-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    description: '',
    price: '',
    search: '',
    selectedCountries: [],
});

export default function InternationalShipment() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Shipment - International',
            href: '/shipment/international',
        },
    ];

    const [countries, setCountries] = useState<Country[]>([]);
    const [zones, setZones] = useState<ShippingZone[]>(() => [buildZone()]);
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [countryError, setCountryError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadCountries = async () => {
            try {
                setLoadingCountries(true);
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag,continents');
                if (!response.ok) {
                    throw new Error('Unable to fetch countries');
                }
                const data = (await response.json()) as unknown[];
                if (!isMounted) return;

                const normalized = data
                    .map((item) => {
                        if (!item || typeof item !== 'object') return null;
                        const record = item as Record<string, any>;
                        const name = record?.name?.common ?? record?.name?.official ?? '';
                        const code = typeof record?.cca2 === 'string' ? record.cca2 : '';
                        const flag = typeof record?.flag === 'string' ? record.flag : '[flag]';
                        const continents = Array.isArray(record?.continents) ? record.continents : [];
                        const continent = typeof continents[0] === 'string' ? continents[0] : 'Other';

                        if (!name || !code) return null;
                        return {
                            name,
                            code,
                            flag,
                            continent,
                        } satisfies Country;
                    })
                    .filter((country): country is Country => Boolean(country))
                    .sort((a, b) => a.name.localeCompare(b.name));

                setCountries(normalized);
                setCountryError(null);
            } catch (error) {
                console.error(error);
                if (isMounted) setCountryError('We could not load countries right now. Please try again.');
            } finally {
                if (isMounted) setLoadingCountries(false);
            }
        };

        loadCountries();
        return () => {
            isMounted = false;
        };
    }, []);

    const countriesByContinent = useMemo(() => {
        const grouped: Record<string, Country[]> = {};
        countries.forEach((country) => {
            const bucket = country.continent || 'Other';
            if (!grouped[bucket]) grouped[bucket] = [];
            grouped[bucket].push(country);
        });
        Object.values(grouped).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
        return grouped;
    }, [countries]);

    const orderedContinents = useMemo(() => {
        const available = Object.keys(countriesByContinent);
        const known = CONTINENT_ORDER.filter((item) => available.includes(item));
        const extras = available.filter((item) => !CONTINENT_ORDER.includes(item));
        return [...known, ...extras];
    }, [countriesByContinent]);

    const updateZoneField = (zoneId: string, field: keyof ShippingZone, value: string) => {
        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== zoneId) return zone;
                return { ...zone, [field]: value };
            }),
        );
    };

    const toggleCountry = (zoneId: string, countryCode: string, checked: boolean) => {
        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== zoneId) return zone;
                const selected = new Set(zone.selectedCountries);
                if (checked) {
                    selected.add(countryCode);
                } else {
                    selected.delete(countryCode);
                }
                return { ...zone, selectedCountries: Array.from(selected) };
            }),
        );
    };

    const toggleContinent = (zoneId: string, continent: string, next: CheckedState) => {
        const shouldSelect = next === true;
        const continentCountries = countriesByContinent[continent] ?? [];
        if (!continentCountries.length) return;

        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== zoneId) return zone;
                const selected = new Set(zone.selectedCountries);
                continentCountries.forEach((country) => {
                    if (shouldSelect) {
                        selected.add(country.code);
                    } else {
                        selected.delete(country.code);
                    }
                });
                return { ...zone, selectedCountries: Array.from(selected) };
            }),
        );
    };

    const addZone = () => {
        const nextZone = buildZone();
        setZones((prev) => [...prev, nextZone]);
        setActiveZoneId(nextZone.id);
    };

    const removeZone = (zoneId: string) => {
        setZones((prev) => {
            if (prev.length === 1) return prev;
            const filtered = prev.filter((zone) => zone.id !== zoneId);
            setActiveZoneId((current) => {
                if (current !== zoneId) return current;
                return filtered[filtered.length - 1]?.id ?? null;
            });
            return filtered;
        });
    };

    const activeZone = useMemo(() => zones.find((zone) => zone.id === activeZoneId) ?? null, [zones, activeZoneId]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shipment - International" />
            <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold leading-tight">International shipping zones</h1>
                        <p className="text-sm text-muted-foreground">
                            Group countries by continent and set a flat USD price for each delivery zone.
                        </p>
                    </div>
                    <Button onClick={addZone}>
                        <Plus className="size-4" />
                        Add shipping zone
                    </Button>
                </div>

                {countryError && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive">Country data unavailable</CardTitle>
                            <CardDescription className="text-destructive">{countryError}</CardDescription>
                        </CardHeader>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {zones.map((zone) => (
                        <ShippingZoneCard
                            key={zone.id}
                            zone={zone}
                            countries={countries}
                            loadingCountries={loadingCountries}
                            disableDelete={zones.length === 1}
                            onEdit={() => setActiveZoneId(zone.id)}
                            onDelete={() => removeZone(zone.id)}
                        />
                    ))}
                </div>

                {loadingCountries && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Fetching countries from API...
                    </div>
                )}
            </div>

            {activeZone && (
                <ShippingZoneModal
                    open={Boolean(activeZone)}
                    onOpenChange={(open) => {
                        if (!open) setActiveZoneId(null);
                    }}
                    zone={activeZone}
                    countriesByContinent={countriesByContinent}
                    orderedContinents={orderedContinents}
                    loadingCountries={loadingCountries}
                    countryError={countryError}
                    onFieldChange={(field, value) => updateZoneField(activeZone.id, field, value)}
                    onToggleCountry={(code, checked) => toggleCountry(activeZone.id, code, checked)}
                    onToggleContinent={(continent, next) => toggleContinent(activeZone.id, continent, next)}
                />
            )}
        </AppLayout>
    );
}
