import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IProvince } from '@/types';
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type DeliveryAddress = {
    id: string;
    name: string;
    contact_name: string;
    contact_phone: string;
    province: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string | number;
    longitude: string | number;
    is_active: boolean;
};

interface FormData {
    id: string | null;
    name: string;
    contact_name: string;
    contact_phone: string;
    province: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    is_active: boolean;
}

type City = {
    id: string;
    name: string;
};

interface AddDeliveryAddressModalProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    provinces?: IProvince[];
    deliveryAddress?: DeliveryAddress | null;
    id?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    closeOnSuccess?: boolean;
}

export default function AddDeliveryAddressModal({
    open,
    onOpenChange,
    provinces = [],
    deliveryAddress = null,
    id,
    onSuccess,
    onCancel,
    closeOnSuccess = true,
}: AddDeliveryAddressModalProps) {
    const isEdit = Boolean(id ?? deliveryAddress?.id);

    const [provinceQuery, setProvinceQuery] = useState('');
    const [cityQuery, setCityQuery] = useState('');
    const [selectedProvinceId, setSelectedProvinceId] = useState<string>(() => {
        if (!deliveryAddress?.province) {
            return '';
        }

        const match = provinces.find((province) => province.name === deliveryAddress.province);
        return match?.id ?? '';
    });
    const [cities, setCities] = useState<City[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [cityFetchError, setCityFetchError] = useState<string | null>(null);
    const [skipCancelOnClose, setSkipCancelOnClose] = useState(false);

    const initialFormData = useMemo<FormData>(
        () => ({
            id: deliveryAddress?.id ?? id ?? null,
            name: deliveryAddress?.name ?? '',
            contact_name: deliveryAddress?.contact_name ?? '',
            contact_phone: deliveryAddress?.contact_phone ?? '',
            province: deliveryAddress?.province ?? '',
            city: deliveryAddress?.city ?? '',
            address: deliveryAddress?.address ?? '',
            postal_code: deliveryAddress?.postal_code ?? '',
            latitude: deliveryAddress?.latitude?.toString() ?? '',
            longitude: deliveryAddress?.longitude?.toString() ?? '',
            is_active: deliveryAddress?.is_active ?? true,
        }),
        [deliveryAddress, id],
    );

    const { data, setData, post, processing, errors } = useForm<FormData>(initialFormData);

    const provinceList = useMemo(() => provinces, [provinces]);
    const filteredProvinces = useMemo(() => {
        const term = provinceQuery.trim().toLowerCase();

        if (!term) {
            return provinceList;
        }

        return provinceList.filter((province) => {
            const name = province.name.toLowerCase();
            const code = province.code?.toLowerCase() ?? '';

            return name.includes(term) || (!!code && code.includes(term));
        });
    }, [provinceList, provinceQuery]);

    const filteredCities = useMemo(() => {
        const term = cityQuery.trim().toLowerCase();

        if (!term) {
            return cities;
        }

        return cities.filter((city) => city.name.toLowerCase().includes(term));
    }, [cities, cityQuery]);

    const fetchCities = useCallback(async (provinceId: string) => {
        if (!provinceId) {
            setCities([]);
            return;
        }

        setIsLoadingCities(true);
        setCityFetchError(null);

        try {
            const response = await fetch(route('cities.list', provinceId), {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cities');
            }

            const payload: { cities?: City[] } = await response.json();
            setCities(Array.isArray(payload.cities) ? payload.cities : []);
        } catch (error) {
            console.error(error);
            setCityFetchError('Failed to load cities. Please try again.');
            setCities([]);
        } finally {
            setIsLoadingCities(false);
        }
    }, []);

    useEffect(() => {
        if (!data.province) {
            setSelectedProvinceId('');
            return;
        }

        const match = provinceList.find((province) => province.name === data.province);
        setSelectedProvinceId((prev) => {
            const next = match?.id ?? '';
            return next === prev ? prev : next;
        });
    }, [data.province, provinceList]);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            return;
        }

        void fetchCities(selectedProvinceId);
    }, [selectedProvinceId, fetchCities]);

    useEffect(() => {
        setData(() => initialFormData);

        if (initialFormData.province) {
            const match = provinceList.find((province) => province.name === initialFormData.province);
            setSelectedProvinceId(match?.id ?? '');
        } else {
            setSelectedProvinceId('');
        }
    }, [initialFormData, provinceList, setData]);

    useEffect(() => {
        if (!open) {
            setProvinceQuery('');
            setCityQuery('');
            setCities([]);
            setCityFetchError(null);
            return;
        }
    }, [open]);

    const selectedLocation = useMemo(() => {
        const latString = data.latitude.trim();
        const lngString = data.longitude.trim();

        if (!latString || !lngString) {
            return undefined;
        }

        const lat = Number(latString);
        const lng = Number(lngString);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return undefined;
        }

        return { lat, lng };
    }, [data.latitude, data.longitude]);

    const handleLocationPick = (coords: { lat: number; lng: number }) => {
        setData('latitude', coords.lat.toFixed(6));
        setData('longitude', coords.lng.toFixed(6));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route(isEdit ? 'update.delivery-address' : 'create.delivery-address'), {
            onSuccess: () => {
                if (closeOnSuccess) {
                    setSkipCancelOnClose(true);
                    onOpenChange?.(false);
                }
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    if (skipCancelOnClose) {
                        setSkipCancelOnClose(false);
                    } else {
                        onCancel?.();
                    }
                }
                onOpenChange?.(next);
            }}
        >
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>{isEdit ? 'Edit Delivery Address' : 'Add Delivery Address'}</DialogTitle>
                    <DialogDescription>Provide recipient details and pin the location on the map.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex max-h-[85vh] flex-col overflow-hidden">
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                        <section className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-foreground">Recipient Information</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    We will use this information to process deliveries to this address.
                                </p>
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Address Label *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        placeholder="Home, Office, etc."
                                        aria-invalid={errors.name ? 'true' : undefined}
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_name">Recipient Name *</Label>
                                    <Input
                                        id="contact_name"
                                        value={data.contact_name}
                                        onChange={(event) => setData('contact_name', event.target.value)}
                                        placeholder="John Doe"
                                        aria-invalid={errors.contact_name ? 'true' : undefined}
                                    />
                                    {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name}</p>}
                                </div>
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Phone Number *</Label>
                                    <Input
                                        id="contact_phone"
                                        value={data.contact_phone}
                                        onChange={(event) => setData('contact_phone', event.target.value)}
                                        placeholder="081234567890"
                                        aria-invalid={errors.contact_phone ? 'true' : undefined}
                                    />
                                    {errors.contact_phone && <p className="text-sm text-destructive">{errors.contact_phone}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">Postal Code *</Label>
                                    <Input
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(event) => setData('postal_code', event.target.value)}
                                        placeholder="12920"
                                        aria-invalid={errors.postal_code ? 'true' : undefined}
                                    />
                                    {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
                                </div>
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="province">Province *</Label>
                                    <Select
                                        value={data.province || undefined}
                                        onValueChange={(value) => {
                                            setData('province', value);

                                            const province = provinceList.find((item) => item.name === value);
                                            setSelectedProvinceId(province?.id ?? '');
                                            setData('city', '');
                                            setCityQuery('');
                                            setCities([]);
                                            setCityFetchError(null);
                                        }}
                                        onOpenChange={(selectOpen) => {
                                            if (!selectOpen) {
                                                setProvinceQuery('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="province" aria-invalid={errors.province ? 'true' : undefined}>
                                            <SelectValue placeholder="Select a province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="mb-1 px-1">
                                                <Input
                                                    autoFocus
                                                    value={provinceQuery}
                                                    onChange={(event) => setProvinceQuery(event.target.value)}
                                                    onKeyDown={(event) => event.stopPropagation()}
                                                    onPointerDown={(event) => event.stopPropagation()}
                                                    placeholder="Search province..."
                                                    className="h-8"
                                                />
                                            </div>
                                            {filteredProvinces.length > 0 ? (
                                                filteredProvinces.map((province) => (
                                                    <SelectItem key={province.id} value={province.name}>
                                                        <span className="flex flex-col">
                                                            <span>{province.name}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">No province found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Select
                                        value={data.city || undefined}
                                        onValueChange={(value) => setData('city', value)}
                                        disabled={!selectedProvinceId || isLoadingCities}
                                        onOpenChange={(selectOpen) => {
                                            if (selectOpen) {
                                                if (selectedProvinceId && !isLoadingCities && cities.length === 0) {
                                                    void fetchCities(selectedProvinceId);
                                                }
                                            } else {
                                                setCityQuery('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="city" aria-invalid={errors.city ? 'true' : undefined}>
                                            <SelectValue
                                                placeholder={
                                                    selectedProvinceId
                                                        ? isLoadingCities
                                                            ? 'Loading cities...'
                                                            : 'Select a city'
                                                        : 'Select a province first'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProvinceId ? (
                                                isLoadingCities ? (
                                                    <div className="px-3 py-4 text-sm text-muted-foreground">Loading cities...</div>
                                                ) : cityFetchError ? (
                                                    <div className="px-3 py-4 text-sm text-destructive">{cityFetchError}</div>
                                                ) : filteredCities.length > 0 ? (
                                                    <>
                                                        <div className="mb-1 px-1">
                                                            <Input
                                                                autoFocus
                                                                value={cityQuery}
                                                                onChange={(event) => setCityQuery(event.target.value)}
                                                                onKeyDown={(event) => event.stopPropagation()}
                                                                onPointerDown={(event) => event.stopPropagation()}
                                                                placeholder="Search city..."
                                                                className="h-8"
                                                            />
                                                        </div>
                                                        {filteredCities.map((city) => (
                                                            <SelectItem key={city.id} value={city.name}>
                                                                {city.name}
                                                            </SelectItem>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <div className="px-3 py-4 text-sm text-muted-foreground">No city found</div>
                                                )
                                            ) : (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">Select a province to see cities</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Complete Address *</Label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(event) => setData('address', event.target.value)}
                                    rows={4}
                                    placeholder="Street, building, unit number, etc."
                                    aria-invalid={errors.address ? 'true' : undefined}
                                    className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                />
                                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                            </div>
                            <div className="mt-6 flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-4">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                                />
                                <div>
                                    <Label htmlFor="is_active" className="leading-tight text-foreground">
                                        Set as default address
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Selecting this will replace your current default delivery address.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-foreground">Pinpoint Location</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Drag the marker or search to update the coordinates. Address text will not change automatically.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <MapLocationPicker
                                    value={selectedLocation}
                                    onChange={(next) => handleLocationPick({ lat: next.lat, lng: next.lng })}
                                    className="h-[320px]"
                                />

                                <div className="grid hidden gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude *</Label>
                                        <Input
                                            id="latitude"
                                            value={data.latitude}
                                            onChange={(event) => setData('latitude', event.target.value)}
                                            placeholder="-6.200000"
                                            aria-invalid={errors.latitude ? 'true' : undefined}
                                        />
                                        {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude *</Label>
                                        <Input
                                            id="longitude"
                                            value={data.longitude}
                                            onChange={(event) => setData('longitude', event.target.value)}
                                            placeholder="106.816666"
                                            aria-invalid={errors.longitude ? 'true' : undefined}
                                        />
                                        {errors.longitude && <p className="text-sm text-destructive">{errors.longitude}</p>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange?.(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Update Address' : 'Save Address'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
