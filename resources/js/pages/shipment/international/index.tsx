import ShippingZoneCard from '@/components/shipment/shipping-zone-card';
import ShippingZoneModal from '@/components/shipment/shipping-zone-modal';
import { Country, ShippingZone } from '@/components/shipment/types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const CONTINENT_ORDER = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania', 'Antarctica', 'Other'];

type ShipmentRecord = {
    id?: string;
    name?: string;
    description?: string | null;
    usd_price?: number | string | null;
    zones?: Array<{ country_code?: string | null } | null>;
};

type PageProps = SharedData & {
    international_shipment?: ShipmentRecord[] | null;
};

export default function InternationalShipment() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Shipment - International',
            href: '/shipment/international',
        },
    ];

    const { international_shipment } = usePage<PageProps>().props;

    const [countries, setCountries] = useState<Country[]>([]);
    const [zones, setZones] = useState<Array<ShippingZone & { isNew?: boolean }>>([]);
    const [draftZone, setDraftZone] = useState<(ShippingZone & { isNew: boolean }) | null>(null);
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [countryError, setCountryError] = useState<string | null>(null);
    const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
    const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

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

                        type RawCountry = {
                            name?: { common?: unknown; official?: unknown };
                            cca2?: unknown;
                            flag?: unknown;
                            continents?: unknown;
                        };

                        const record = item as RawCountry;
                        const nameData = record.name;
                        const name =
                            (nameData && typeof nameData === 'object' && typeof (nameData as { common?: unknown }).common === 'string'
                                ? (nameData as { common?: string }).common
                                : undefined) ??
                            (nameData && typeof nameData === 'object' && typeof (nameData as { official?: unknown }).official === 'string'
                                ? (nameData as { official?: string }).official
                                : undefined) ??
                            '';
                        const code = typeof record.cca2 === 'string' ? record.cca2 : '';
                        const flag = typeof record.flag === 'string' ? record.flag : '[flag]';
                        const continents = Array.isArray(record.continents)
                            ? record.continents.filter((value): value is string => typeof value === 'string')
                            : [];
                        const continent = continents[0] ?? 'Other';

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

    const serverZones = useMemo<Array<ShippingZone & { isNew?: boolean }>>(() => {
        if (!Array.isArray(international_shipment)) return [];

        return international_shipment
            .map((item) => {
                if (!item || typeof item !== 'object') return null;

                const id = typeof item.id === 'string' ? item.id : '';
                if (!id) return null;

                const name = typeof item.name === 'string' ? item.name : '';
                const description = typeof item.description === 'string' ? item.description : '';
                const priceRaw = item.usd_price;
                const price = typeof priceRaw === 'number' || typeof priceRaw === 'string' ? String(priceRaw) : '';
                const zoneList = Array.isArray(item.zones) ? item.zones : [];
                const selectedCountries = zoneList
                    .map((zone) => {
                        if (!zone || typeof zone !== 'object') return null;
                        const code = zone?.country_code;
                        return typeof code === 'string' ? code : null;
                    })
                    .filter((code): code is string => Boolean(code));

                return {
                    id,
                    name,
                    description,
                    price,
                    search: '',
                    selectedCountries,
                };
            })
            .filter((zone): zone is ShippingZone => Boolean(zone));
    }, [international_shipment]);

    useEffect(() => {
        setZones(serverZones);
    }, [serverZones]);

    useEffect(() => {
        setFormError(null);
    }, [activeZoneId]);

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
        if (draftZone?.id === zoneId) {
            setDraftZone({ ...draftZone, [field]: value });
            return;
        }

        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== zoneId) return zone;
                return { ...zone, [field]: value };
            }),
        );
    };

    const toggleCountry = (zoneId: string, countryCode: string, checked: boolean) => {
        if (draftZone?.id === zoneId) {
            const selected = new Set(draftZone.selectedCountries);
            if (checked) {
                selected.add(countryCode);
            } else {
                selected.delete(countryCode);
            }
            setDraftZone({ ...draftZone, selectedCountries: Array.from(selected) });
            return;
        }

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

        if (draftZone?.id === zoneId) {
            const selected = new Set(draftZone.selectedCountries);
            continentCountries.forEach((country) => {
                if (shouldSelect) {
                    selected.add(country.code);
                } else {
                    selected.delete(country.code);
                }
            });
            setDraftZone({ ...draftZone, selectedCountries: Array.from(selected) });
            return;
        }

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

    const generateZoneId = () => {
        const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
        const cryptoWithRandom = cryptoObj as (Crypto & { randomUUID?: () => string }) | undefined;

        if (cryptoWithRandom?.randomUUID) return cryptoWithRandom.randomUUID();

        return `zone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const addZone = () => {
        const newId = generateZoneId();
        const newZone: ShippingZone & { isNew: boolean } = {
            id: newId,
            name: '',
            description: '',
            price: '',
            search: '',
            selectedCountries: [],
            isNew: true,
        };

        setDraftZone(newZone);
        setActiveZoneId(newId);
        setFormError(null);
    };

    const removeZone = (zoneId: string) => {
        const target = zones.find((zone) => zone.id === zoneId);
        if (!target) return;

        if (target.isNew) {
            setZones((prev) => prev.filter((zone) => zone.id !== zoneId));
            if (activeZoneId === zoneId) setActiveZoneId(null);
            return;
        }

        if (!confirm('Remove this shipping zone?')) return;

        setDeletingZoneId(zoneId);
        setFormError(null);

        router.delete(route('delete.international-shipment', zoneId), {
            preserveScroll: true,
            onSuccess: () => {
                setActiveZoneId(null);
                router.reload({ only: ['international_shipment'] });
            },
            onError: () => alert('Failed to delete the shipping zone. Please try again.'),
            onFinish: () => setDeletingZoneId(null),
        });
    };

    const handleSaveZone = (zoneId: string) => {
        const zone = draftZone?.id === zoneId ? draftZone : zones.find((item) => item.id === zoneId);
        if (!zone) return;

        const trimmedName = zone.name.trim();
        const trimmedDescription = zone.description.trim();
        const priceValue = Number.parseFloat(zone.price);

        if (!trimmedName) {
            setFormError('Please provide a zone name.');
            return;
        }

        if (!Number.isFinite(priceValue)) {
            setFormError('Please enter a valid USD price.');
            return;
        }

        if (!zone.selectedCountries.length) {
            setFormError('Select at least one country for this zone.');
            return;
        }

        setFormError(null);
        setSavingZoneId(zoneId);

        const payload = {
            name: trimmedName,
            description: trimmedDescription || null,
            usd_price: priceValue,
            zone_code: zone.selectedCountries,
        };

        const onFinish = () => setSavingZoneId(null);
        const onSuccess = () => {
            setActiveZoneId(null);
            router.reload({ only: ['international_shipment'] });
        };

        if (zone.isNew) {
            router.post(route('create.international-shipment'), payload, {
                preserveScroll: true,
                onError: () => setFormError('Unable to save the new shipping zone. Please review the fields.'),
                onSuccess,
                onFinish: () => {
                    onFinish();
                    setDraftZone(null);
                },
            });
        } else {
            router.post(
                route('update.international-shipment'),
                {
                    ...payload,
                    id: zone.id,
                },
                {
                    preserveScroll: true,
                    onError: () => setFormError('Unable to update the shipping zone. Please review the fields.'),
                    onSuccess,
                    onFinish,
                },
            );
        }
    };

    const activeZone = useMemo(() => {
        if (draftZone && draftZone.id === activeZoneId) return draftZone;
        return zones.find((zone) => zone.id === activeZoneId) ?? null;
    }, [zones, activeZoneId, draftZone]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shipment - International" />
            <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl leading-tight font-semibold">International shipping zones</h1>
                        <p className="text-sm text-muted-foreground">Group countries by continent and set a flat USD price for each delivery zone.</p>
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
                    {zones.map((zone) => {
                        const isSinglePersistedZone = zones.length === 1 && !zone.isNew;
                        const disableDelete = isSinglePersistedZone || deletingZoneId === zone.id || savingZoneId === zone.id;

                        return (
                            <ShippingZoneCard
                                key={zone.id}
                                zone={zone}
                                countries={countries}
                                loadingCountries={loadingCountries}
                                disableDelete={disableDelete}
                                onEdit={() => setActiveZoneId(zone.id)}
                                onDelete={() => removeZone(zone.id)}
                            />
                        );
                    })}
                </div>

                {!zones.length && !loadingCountries && (
                    <div className="rounded-lg border border-dashed border-muted bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                        No shipping zones yet. Click &ldquo;Add shipping zone&rdquo; to create one.
                    </div>
                )}

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
                        if (!open) {
                            setFormError(null);
                            setActiveZoneId(null);
                            if (draftZone) setDraftZone(null);
                        }
                    }}
                    zone={activeZone}
                    countriesByContinent={countriesByContinent}
                    orderedContinents={orderedContinents}
                    loadingCountries={loadingCountries}
                    countryError={countryError}
                    onFieldChange={(field, value) => updateZoneField(activeZone.id, field, value)}
                    onToggleCountry={(code, checked) => toggleCountry(activeZone.id, code, checked)}
                    onToggleContinent={(continent, next) => toggleContinent(activeZone.id, continent, next)}
                    onSave={() => handleSaveZone(activeZone.id)}
                    saving={savingZoneId === activeZone.id}
                    errorMessage={formError}
                    disableSave={Boolean(deletingZoneId === activeZone.id)}
                />
            )}
        </AppLayout>
    );
}
