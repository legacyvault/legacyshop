import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FrontLayout from '@/layouts/front/front-layout';
import type { SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

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

interface DeliveryAddressPageProps extends SharedData {
    id?: string | null;
    deliveryAddress?: DeliveryAddress | null;
}

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

export default function AddDeliveryAddress() {
    const { auth, locale, translations, id, deliveryAddress } = usePage<DeliveryAddressPageProps>().props;

    const isEdit = Boolean(id);
    const addressData = deliveryAddress ?? null;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        id: addressData?.id ?? null,
        name: addressData?.name ?? '',
        contact_name: addressData?.contact_name ?? '',
        contact_phone: addressData?.contact_phone ?? '',
        province: addressData?.province ?? '',
        city: addressData?.city ?? '',
        address: addressData?.address ?? '',
        postal_code: addressData?.postal_code ?? '',
        latitude: addressData?.latitude?.toString() ?? '',
        longitude: addressData?.longitude?.toString() ?? '',
        is_active: addressData?.is_active ?? false,
    });

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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route(isEdit ? 'update.delivery-address' : 'create.delivery-address'));
    };

    const handleLocationPick = (coords: { lat: number; lng: number }) => {
        setData('latitude', coords.lat.toFixed(6));
        setData('longitude', coords.lng.toFixed(6));
    };

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <Head title={`${isEdit ? 'Edit' : 'Add'} Delivery Address`} />

            <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                        {isEdit ? 'Edit Delivery Address' : 'Add Delivery Address'}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">Provide recipient details and pin the location on the map.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6">
                    <section className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-foreground">Recipient Information</h2>
                            <p className="mt-1 text-sm text-muted-foreground">We will use this information to process deliveries to this address.</p>
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
                                <Input
                                    id="province"
                                    value={data.province}
                                    onChange={(event) => setData('province', event.target.value)}
                                    placeholder="DKI Jakarta"
                                    aria-invalid={errors.province ? 'true' : undefined}
                                />
                                {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(event) => setData('city', event.target.value)}
                                    placeholder="South Jakarta"
                                    aria-invalid={errors.city ? 'true' : undefined}
                                />
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
                            <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', Boolean(checked))} />
                            <div>
                                <Label htmlFor="is_active" className="leading-tight text-foreground">
                                    Set as default address
                                </Label>
                                <p className="text-sm text-muted-foreground">Selecting this will replace your current default delivery address.</p>
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
                                className="h-[420px]"
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

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Update Address' : 'Save Address'}
                        </Button>
                    </div>
                </form>
            </section>
        </FrontLayout>
    );
}
