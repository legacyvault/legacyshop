import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, IWarehouse, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface WarehousePageProps extends SharedData {
    id?: string | null;
    warehouse?: IWarehouse | null;
}

interface FormData {
    id: string | null;
    name: string;
    contact_name: string;
    contact_phone: string;
    address: string;
    country: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    is_active: boolean;
}

export default function AddWarehouse() {
    const { id, warehouse } = usePage<WarehousePageProps>().props;
    const isEdit = Boolean(id);
    const activeWarehouse = warehouse ?? null;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Warehouse`,
            href: '/warehouse',
        },
        {
            title: `${isEdit ? 'Edit' : 'Add'} Warehouse`,
            href: `/warehouse/add-warehouse${isEdit && id ? `/${id}` : ''}`,
        },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        id: activeWarehouse?.id ?? null,
        name: activeWarehouse?.name ?? '',
        contact_name: activeWarehouse?.contact_name ?? '',
        contact_phone: activeWarehouse?.contact_phone ?? '',
        address: activeWarehouse?.address ?? '',
        country: activeWarehouse?.country ?? 'ID',
        postal_code: activeWarehouse?.postal_code ?? '',
        latitude: activeWarehouse?.latitude?.toString() ?? '',
        longitude: activeWarehouse?.longitude?.toString() ?? '',
        is_active: activeWarehouse?.is_active ?? true,
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
        post(route(isEdit ? 'update.warehouse' : 'create.warehouse'));
    };

    const handleLocationPick = (coords: { lat: number; lng: number }) => {
        setData('latitude', coords.lat.toFixed(6));
        setData('longitude', coords.lng.toFixed(6));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${isEdit ? 'Edit' : 'Add'} Warehouse`} />
            <div className="p-6">
                <form onSubmit={handleSubmit} className="">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Warehouse Details</h2>
                        <p className="mt-1 text-sm text-gray-500">Fill in the warehouse information and contact person.</p>
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="name">
                            Warehouse Name *
                        </label>
                        <input
                            id="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Jakarta Hub"
                            aria-invalid={errors.name ? 'true' : undefined}
                            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                errors.name ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="contact_name">
                            Contact Name *
                        </label>
                        <input
                            id="contact_name"
                            value={data.contact_name}
                            onChange={(event) => setData('contact_name', event.target.value)}
                            placeholder="John Doe"
                            aria-invalid={errors.contact_name ? 'true' : undefined}
                            type="text"
                            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                errors.contact_name ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                        {errors.contact_name && <p className="text-sm text-red-500">{errors.contact_name}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="contact_phone">
                            Contact Phone *
                        </label>
                        <input
                            id="contact_phone"
                            value={data.contact_phone}
                            onChange={(event) => setData('contact_phone', event.target.value)}
                            placeholder="081234567890"
                            aria-invalid={errors.contact_phone ? 'true' : undefined}
                            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                errors.contact_phone ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                        {errors.contact_phone && <p className="text-sm text-red-500">{errors.contact_phone}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="postal_code">
                            Postal Code
                        </label>
                        <Input
                            id="postal_code"
                            value={data.postal_code}
                            onChange={(event) => setData('postal_code', event.target.value)}
                            placeholder="12920"
                            aria-invalid={errors.postal_code ? 'true' : undefined}
                            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                errors.postal_code ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                        {errors.postal_code && <p className="text-sm text-red-500">{errors.postal_code}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="address">
                            Address *
                        </label>
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(event) => setData('address', event.target.value)}
                            rows={4}
                            placeholder="Enter full address"
                            aria-invalid={errors.address ? 'true' : undefined}
                            className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                        />
                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                    </div>
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium" htmlFor="country">
                            Country
                        </label>
                        <input
                            id="country"
                            value={data.country}
                            onChange={(event) => setData('country', event.target.value)}
                            placeholder="ID"
                            disabled={true}
                            aria-invalid={errors.country ? 'true' : undefined}
                            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                errors.contact_name ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                        {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                    </div>

                    <div className="mb-6 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                        <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', Boolean(checked))} />
                        <div>
                            <Label htmlFor="is_active" className="leading-tight text-gray-900">
                                Set as active warehouse
                            </Label>
                            <p className="text-sm text-gray-500">Only one warehouse can be active at a time.</p>
                        </div>
                    </div>

                    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Use the map to pick coordinates. The address field stays manual, so double-check it before saving.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <MapLocationPicker
                                value={selectedLocation}
                                onChange={(next) => handleLocationPick({ lat: next.lat, lng: next.lng })}
                                className="h-[420px]"
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">Latitude *</Label>
                                    <Input
                                        id="latitude"
                                        value={data.latitude}
                                        onChange={(event) => setData('latitude', event.target.value)}
                                        placeholder="-6.200000"
                                        aria-invalid={errors.latitude ? 'true' : undefined}
                                    />
                                    {errors.latitude && <p className="text-sm text-red-500">{errors.latitude}</p>}
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
                                    {errors.longitude && <p className="text-sm text-red-500">{errors.longitude}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Update Warehouse' : 'Create Warehouse'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
