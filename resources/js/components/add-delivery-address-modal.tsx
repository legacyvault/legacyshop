import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IProvince, SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type DeliveryAddress = {
    id: string;
    name: string;
    contact_name: string;
    contact_phone: string;
    province: string;
    province_code?: string | null;
    city: string;
    city_code?: string | null;
    district?: string | null;
    district_code?: string | null;
    village?: string | null;
    village_code?: string | null;
    address: string;
    postal_code: string;
    latitude: string | number;
    longitude: string | number;
    is_active: boolean;
    country?: string | null;
};

interface FormData {
    id: string | null;
    name: string;
    contact_name: string;
    contact_phone: string;
    province: string;
    city: string;
    district: string;
    village: string;
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

type District = {
    code: string;
    name: string;
};

type Village = {
    code: string;
    name: string;
};

type PostalCode = {
    code: string;
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

    const { props } = usePage<SharedData>();
    const authCountry = props.auth?.user?.country ?? '';
    const isIndonesia = useMemo(() => {
        if (!authCountry) {
            return false;
        }

        const normalized = authCountry.toString().trim();
        if (!normalized) {
            return false;
        }

        const upper = normalized.toUpperCase();
        if (upper === 'ID' || upper === 'IDN') {
            return true;
        }

        return normalized.toLowerCase().includes('indonesia');
    }, [authCountry]);

    const shouldUseIndonesianFields = useMemo(() => {
        if (deliveryAddress?.country) {
            const normalizedCountry = deliveryAddress.country.toString().trim().toUpperCase();

            if (normalizedCountry === 'ID' || normalizedCountry === 'IDN' || normalizedCountry.includes('INDONESIA')) {
                return true;
            }
        }

        return isIndonesia;
    }, [deliveryAddress?.country, isIndonesia]);

    const initialFormData = useMemo<FormData>(() => {
        const provinceValue = shouldUseIndonesianFields ? (deliveryAddress?.province_code ?? '') : (deliveryAddress?.province ?? '');
        const cityValue = shouldUseIndonesianFields ? (deliveryAddress?.city_code ?? '') : (deliveryAddress?.city ?? '');
        const districtValue = shouldUseIndonesianFields ? (deliveryAddress?.district_code ?? '') : (deliveryAddress?.district ?? '');
        const villageValue = shouldUseIndonesianFields ? (deliveryAddress?.village_code ?? '') : (deliveryAddress?.village ?? '');

        return {
            id: deliveryAddress?.id ?? id ?? null,
            name: deliveryAddress?.name ?? '',
            contact_name: deliveryAddress?.contact_name ?? '',
            contact_phone: deliveryAddress?.contact_phone ?? '',
            province: provinceValue,
            city: cityValue,
            district: districtValue ?? '',
            village: villageValue ?? '',
            address: deliveryAddress?.address ?? '',
            postal_code: deliveryAddress?.postal_code ?? '',
            latitude: deliveryAddress?.latitude?.toString() ?? '',
            longitude: deliveryAddress?.longitude?.toString() ?? '',
            is_active: deliveryAddress?.is_active ?? true,
        };
    }, [deliveryAddress, id, shouldUseIndonesianFields]);

    const [provinceQuery, setProvinceQuery] = useState('');
    const [cityQuery, setCityQuery] = useState('');
    const [selectedProvinceId, setSelectedProvinceId] = useState<string>(() => {
        if (shouldUseIndonesianFields) {
            if (initialFormData.province) {
                return initialFormData.province;
            }

            if (deliveryAddress?.province) {
                const matchByName = provinces.find((province) => province.name === deliveryAddress.province);
                return matchByName?.id ?? '';
            }

            return '';
        }

        if (!deliveryAddress?.province) {
            return '';
        }

        const match = provinces.find((province) => province.name === deliveryAddress.province);
        return match?.id ?? '';
    });
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<string>(() => {
        if (shouldUseIndonesianFields) {
            return initialFormData.city || '';
        }

        return '';
    });
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [cityFetchError, setCityFetchError] = useState<string | null>(null);
    const [districts, setDistricts] = useState<District[]>([]);
    const [districtQuery, setDistrictQuery] = useState('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>(() => {
        if (shouldUseIndonesianFields) {
            return initialFormData.district || '';
        }

        return '';
    });
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [districtFetchError, setDistrictFetchError] = useState<string | null>(null);
    const [villages, setVillages] = useState<Village[]>([]);
    const [villageQuery, setVillageQuery] = useState('');
    const [selectedVillageCode, setSelectedVillageCode] = useState<string>(() => {
        if (shouldUseIndonesianFields) {
            return initialFormData.village || '';
        }

        return '';
    });
    const [isLoadingVillages, setIsLoadingVillages] = useState(false);
    const [villageFetchError, setVillageFetchError] = useState<string | null>(null);
    const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
    const [postalQuery, setPostalQuery] = useState('');
    const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
    const [postalFetchError, setPostalFetchError] = useState<string | null>(null);
    const [skipCancelOnClose, setSkipCancelOnClose] = useState(false);

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

    const filteredDistricts = useMemo(() => {
        const term = districtQuery.trim().toLowerCase();

        if (!term) {
            return districts;
        }

        return districts.filter((district) => district.name.toLowerCase().includes(term));
    }, [districts, districtQuery]);

    const filteredVillages = useMemo(() => {
        const term = villageQuery.trim().toLowerCase();

        if (!term) {
            return villages;
        }

        return villages.filter((village) => village.name.toLowerCase().includes(term));
    }, [villages, villageQuery]);

    const filteredPostalCodes = useMemo(() => {
        const term = postalQuery.trim().toLowerCase();

        if (!term) {
            return postalCodes;
        }

        return postalCodes.filter((item) => item.code.toLowerCase().includes(term));
    }, [postalCodes, postalQuery]);

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

    const fetchDistricts = useCallback(async (cityCode: string) => {
        if (!cityCode) {
            setDistricts([]);
            return;
        }

        setIsLoadingDistricts(true);
        setDistrictFetchError(null);

        try {
            const response = await fetch(route('districts.list', cityCode), {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch districts');
            }

            const payload: { districts?: District[] } = await response.json();
            setDistricts(Array.isArray(payload.districts) ? payload.districts : []);
        } catch (error) {
            console.error(error);
            setDistrictFetchError('Failed to load districts. Please try again.');
            setDistricts([]);
        } finally {
            setIsLoadingDistricts(false);
        }
    }, []);

    const fetchVillages = useCallback(async (districtCode: string) => {
        if (!districtCode) {
            setVillages([]);
            return;
        }

        setIsLoadingVillages(true);
        setVillageFetchError(null);

        try {
            const response = await fetch(route('villages.list', districtCode), {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch villages');
            }

            const payload: { villages?: Village[] } = await response.json();
            setVillages(Array.isArray(payload.villages) ? payload.villages : []);
        } catch (error) {
            console.error(error);
            setVillageFetchError('Failed to load villages. Please try again.');
            setVillages([]);
        } finally {
            setIsLoadingVillages(false);
        }
    }, []);

    const fetchPostalCodes = useCallback(async (locationId: string, scope: 'city' | 'village') => {
        if (!locationId) {
            setPostalCodes([]);
            return;
        }

        setIsLoadingPostalCodes(true);
        setPostalFetchError(null);

        try {
            const response = await fetch(
                scope === 'village'
                    ? route('postal_code.list', {
                          cityName: locationId,
                          scope: 'village',
                      })
                    : route('postal_code.list', locationId),
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch postal codes');
            }

            const payload: {
                postal_codes?: Array<Record<string, string>> | string[];
                postal_code?: Array<Record<string, string>> | string[];
            } = await response.json();

            const rawSource = payload.postal_codes ?? payload.postal_code ?? [];
            const rawCodes = Array.isArray(rawSource) ? rawSource : [];
            const normalized = rawCodes
                .map((item) => {
                    if (!item) {
                        return '';
                    }

                    if (typeof item === 'string') {
                        return item;
                    }

                    return item.postalCode ?? item.postal_code ?? item.code ?? '';
                })
                .filter((code): code is string => Boolean(code));

            const uniqueCodes = Array.from(new Set(normalized)).map((code) => ({ code }));
            setPostalCodes(uniqueCodes);
        } catch (error) {
            console.error(error);
            setPostalFetchError('Failed to load postal codes. Please try again.');
            setPostalCodes([]);
        } finally {
            setIsLoadingPostalCodes(false);
        }
    }, []);

    useEffect(() => {
        if (!data.province) {
            setSelectedProvinceId('');
            return;
        }

        if (shouldUseIndonesianFields) {
            setSelectedProvinceId((prev) => (prev === data.province ? prev : data.province));
            return;
        }

        const match = provinceList.find((province) => province.name === data.province);
        setSelectedProvinceId((prev) => {
            const next = match?.id ?? '';
            return next === prev ? prev : next;
        });
    }, [data.province, shouldUseIndonesianFields, provinceList]);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            setSelectedCityId('');
            return;
        }

        void fetchCities(selectedProvinceId);
    }, [selectedProvinceId, fetchCities]);

    useEffect(() => {
        if (!data.city) {
            setSelectedCityId('');
            return;
        }

        if (shouldUseIndonesianFields) {
            setSelectedCityId((prev) => (prev === data.city ? prev : data.city));
            return;
        }

        setSelectedCityId((prev) => (prev === data.city ? prev : data.city));
    }, [cities, data.city, shouldUseIndonesianFields]);

    useEffect(() => {
        if (!shouldUseIndonesianFields) {
            if (!selectedCityId) {
                setPostalCodes([]);
                setPostalQuery('');
                setPostalFetchError(null);
                setIsLoadingPostalCodes(false);
                return;
            }

            void fetchPostalCodes(selectedCityId, 'city');
            return;
        }

        if (!selectedCityId) {
            setDistricts([]);
            setSelectedDistrictCode('');
            setDistrictQuery('');
            setDistrictFetchError(null);
            setVillages([]);
            setSelectedVillageCode('');
            setVillageQuery('');
            setVillageFetchError(null);
            setPostalCodes([]);
            setPostalQuery('');
            setPostalFetchError(null);
            setIsLoadingPostalCodes(false);
            return;
        }

        setPostalCodes([]);
        setPostalQuery('');
        setPostalFetchError(null);
        setIsLoadingPostalCodes(false);
        void fetchDistricts(selectedCityId);
    }, [selectedCityId, shouldUseIndonesianFields, fetchPostalCodes, fetchDistricts]);

    useEffect(() => {
        if (!shouldUseIndonesianFields) {
            return;
        }

        if (!data.district) {
            setSelectedDistrictCode('');
            return;
        }

        const matchedDistrict = districts.find((district) => district.code === data.district || district.name === data.district);
        const nextCode = matchedDistrict?.code ?? (data.district || '');
        setSelectedDistrictCode((prev) => (prev === nextCode ? prev : nextCode));
    }, [shouldUseIndonesianFields, districts, data.district]);

    useEffect(() => {
        if (!shouldUseIndonesianFields) {
            return;
        }

        if (!selectedDistrictCode) {
            setVillages([]);
            setSelectedVillageCode('');
            setVillageQuery('');
            setVillageFetchError(null);
            setPostalCodes([]);
            setPostalQuery('');
            setPostalFetchError(null);
            setIsLoadingPostalCodes(false);
            return;
        }

        void fetchVillages(selectedDistrictCode);
    }, [shouldUseIndonesianFields, selectedDistrictCode, fetchVillages]);

    useEffect(() => {
        if (!shouldUseIndonesianFields) {
            return;
        }

        if (!data.village) {
            setSelectedVillageCode('');
            return;
        }

        const matchedVillage = villages.find((village) => village.code === data.village || village.name === data.village);
        const nextCode = matchedVillage?.code ?? (data.village || '');
        setSelectedVillageCode((prev) => (prev === nextCode ? prev : nextCode));
    }, [shouldUseIndonesianFields, villages, data.village]);

    useEffect(() => {
        if (!shouldUseIndonesianFields) {
            return;
        }

        if (!selectedVillageCode) {
            setPostalCodes([]);
            setPostalQuery('');
            setPostalFetchError(null);
            setIsLoadingPostalCodes(false);
            return;
        }

        void fetchPostalCodes(selectedVillageCode, 'village');
    }, [shouldUseIndonesianFields, selectedVillageCode, fetchPostalCodes]);

    useEffect(() => {
        if (shouldUseIndonesianFields) {
            return;
        }

        setDistricts([]);
        setVillages([]);
        setSelectedDistrictCode('');
        setSelectedVillageCode('');
        setDistrictQuery('');
        setVillageQuery('');
        setDistrictFetchError(null);
        setVillageFetchError(null);
        if (data.district) {
            setData('district', '');
        }
        if (data.village) {
            setData('village', '');
        }
    }, [shouldUseIndonesianFields, setData, data.district, data.village]);

    useEffect(() => {
        setData(() => initialFormData);

        if (shouldUseIndonesianFields) {
            setSelectedProvinceId(initialFormData.province || '');
            setSelectedCityId(initialFormData.city || '');
            setSelectedDistrictCode(initialFormData.district || '');
            setSelectedVillageCode(initialFormData.village || '');
        } else {
            if (initialFormData.province) {
                const match = provinceList.find((province) => province.name === initialFormData.province);
                setSelectedProvinceId(match?.id ?? '');
            } else {
                setSelectedProvinceId('');
            }

            setSelectedCityId('');
            setSelectedDistrictCode('');
            setSelectedVillageCode('');
        }

        setDistricts([]);
        setVillages([]);
        setDistrictQuery('');
        setVillageQuery('');
        setDistrictFetchError(null);
        setVillageFetchError(null);
        setIsLoadingDistricts(false);
        setIsLoadingVillages(false);
    }, [initialFormData, shouldUseIndonesianFields, provinceList, setData]);

    useEffect(() => {
        if (!open) {
            setProvinceQuery('');
            setCityQuery('');
            setCities([]);
            setSelectedCityId('');
            setCityFetchError(null);
            setDistrictQuery('');
            setDistricts([]);
            setSelectedDistrictCode('');
            setDistrictFetchError(null);
            setIsLoadingDistricts(false);
            setVillageQuery('');
            setVillages([]);
            setSelectedVillageCode('');
            setVillageFetchError(null);
            setIsLoadingVillages(false);
            setPostalQuery('');
            setPostalCodes([]);
            setPostalFetchError(null);
            setIsLoadingPostalCodes(false);
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
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="province">Province *</Label>
                                    <Select
                                        value={data.province || undefined}
                                        onValueChange={(value) => {
                                            setData('province', value);

                                            if (shouldUseIndonesianFields) {
                                                setSelectedProvinceId(value);
                                            } else {
                                                const province = provinceList.find((item) => item.name === value);
                                                setSelectedProvinceId(province?.id ?? '');
                                            }

                                            setData('city', '');
                                            setSelectedCityId('');
                                            setData('district', '');
                                            setSelectedDistrictCode('');
                                            setDistricts([]);
                                            setDistrictQuery('');
                                            setDistrictFetchError(null);
                                            setIsLoadingDistricts(false);
                                            setData('village', '');
                                            setSelectedVillageCode('');
                                            setVillages([]);
                                            setVillageQuery('');
                                            setVillageFetchError(null);
                                            setIsLoadingVillages(false);

                                            setData('postal_code', '');
                                            setCityQuery('');
                                            setCities([]);
                                            setCityFetchError(null);
                                            setPostalQuery('');
                                            setPostalCodes([]);
                                            setPostalFetchError(null);
                                            setIsLoadingPostalCodes(false);
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
                                                    <SelectItem key={province.id} value={shouldUseIndonesianFields ? province.id : province.name}>
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
                                        onValueChange={(value) => {
                                            let nextCityId = '';

                                            if (shouldUseIndonesianFields) {
                                                setData('city', value);
                                                nextCityId = value;
                                            } else {
                                                const cityRecord = cities.find((item) => item.name === value);
                                                setData('city', cityRecord?.name ?? value);
                                                nextCityId = cityRecord?.name ?? '';
                                            }

                                            setSelectedCityId(nextCityId);
                                            setData('district', '');
                                            setSelectedDistrictCode('');
                                            setDistricts([]);
                                            setDistrictQuery('');
                                            setDistrictFetchError(null);
                                            setIsLoadingDistricts(false);
                                            setData('village', '');
                                            setSelectedVillageCode('');
                                            setVillages([]);
                                            setVillageQuery('');
                                            setVillageFetchError(null);
                                            setIsLoadingVillages(false);
                                            setData('postal_code', '');
                                            setPostalQuery('');
                                            setPostalCodes([]);
                                            setPostalFetchError(null);
                                            setIsLoadingPostalCodes(false);
                                        }}
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
                                                            <SelectItem key={city.id} value={shouldUseIndonesianFields ? city.id : city.name}>
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

                            {shouldUseIndonesianFields && (
                                <div className="mb-4 grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="district">Kecamatan *</Label>
                                        <Select
                                            value={selectedDistrictCode || undefined}
                                            onValueChange={(value) => {
                                                setSelectedDistrictCode(value);
                                                setData('district', value);
                                                setData('village', '');
                                                setSelectedVillageCode('');
                                                setVillages([]);
                                                setVillageQuery('');
                                                setVillageFetchError(null);
                                                setIsLoadingVillages(false);
                                                setData('postal_code', '');
                                                setPostalQuery('');
                                                setPostalCodes([]);
                                                setPostalFetchError(null);
                                                setIsLoadingPostalCodes(false);
                                            }}
                                            disabled={!selectedCityId || isLoadingDistricts}
                                            onOpenChange={(selectOpen) => {
                                                if (!selectOpen) {
                                                    setDistrictQuery('');
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="district" aria-invalid={errors.district ? 'true' : undefined}>
                                                <SelectValue
                                                    placeholder={
                                                        selectedCityId
                                                            ? isLoadingDistricts
                                                                ? 'Loading districts...'
                                                                : 'Select a district'
                                                            : 'Select a city first'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedCityId ? (
                                                    isLoadingDistricts ? (
                                                        <div className="px-3 py-4 text-sm text-muted-foreground">Loading districts...</div>
                                                    ) : districtFetchError ? (
                                                        <div className="px-3 py-4 text-sm text-destructive">{districtFetchError}</div>
                                                    ) : filteredDistricts.length > 0 ? (
                                                        <>
                                                            <div className="mb-1 px-1">
                                                                <Input
                                                                    autoFocus
                                                                    value={districtQuery}
                                                                    onChange={(event) => setDistrictQuery(event.target.value)}
                                                                    onKeyDown={(event) => event.stopPropagation()}
                                                                    onPointerDown={(event) => event.stopPropagation()}
                                                                    placeholder="Search district..."
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            {filteredDistricts.map((district) => (
                                                                <SelectItem key={district.code} value={district.code}>
                                                                    {district.name}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="px-3 py-4 text-sm text-muted-foreground">No district found</div>
                                                    )
                                                ) : (
                                                    <div className="px-3 py-4 text-sm text-muted-foreground">Select a city to see districts</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.district && <p className="text-sm text-destructive">{errors.district}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="village">Kelurahan/Desa *</Label>
                                        <Select
                                            value={selectedVillageCode || undefined}
                                            onValueChange={(value) => {
                                                setSelectedVillageCode(value);
                                                setData('village', value);
                                                setData('postal_code', '');
                                                setPostalQuery('');
                                                setPostalCodes([]);
                                                setPostalFetchError(null);
                                                setIsLoadingPostalCodes(false);
                                            }}
                                            disabled={!selectedDistrictCode || isLoadingVillages}
                                            onOpenChange={(selectOpen) => {
                                                if (!selectOpen) {
                                                    setVillageQuery('');
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="village" aria-invalid={errors.village ? 'true' : undefined}>
                                                <SelectValue
                                                    placeholder={
                                                        selectedDistrictCode
                                                            ? isLoadingVillages
                                                                ? 'Loading villages...'
                                                                : 'Select a village'
                                                            : 'Select a district first'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedDistrictCode ? (
                                                    isLoadingVillages ? (
                                                        <div className="px-3 py-4 text-sm text-muted-foreground">Loading villages...</div>
                                                    ) : villageFetchError ? (
                                                        <div className="px-3 py-4 text-sm text-destructive">{villageFetchError}</div>
                                                    ) : filteredVillages.length > 0 ? (
                                                        <>
                                                            <div className="mb-1 px-1">
                                                                <Input
                                                                    autoFocus
                                                                    value={villageQuery}
                                                                    onChange={(event) => setVillageQuery(event.target.value)}
                                                                    onKeyDown={(event) => event.stopPropagation()}
                                                                    onPointerDown={(event) => event.stopPropagation()}
                                                                    placeholder="Search village..."
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            {filteredVillages.map((village) => (
                                                                <SelectItem key={village.code} value={village.code}>
                                                                    {village.name}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="px-3 py-4 text-sm text-muted-foreground">No village found</div>
                                                    )
                                                ) : (
                                                    <div className="px-3 py-4 text-sm text-muted-foreground">Select a district to see villages</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.village && <p className="text-sm text-destructive">{errors.village}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="mb-4 space-y-2">
                                <Label htmlFor="postal_code">Postal Code *</Label>
                                <Select
                                    value={data.postal_code || undefined}
                                    onValueChange={(value) => setData('postal_code', value)}
                                    disabled={
                                        shouldUseIndonesianFields
                                            ? !selectedVillageCode || isLoadingPostalCodes
                                            : !selectedCityId || isLoadingPostalCodes
                                    }
                                    onOpenChange={(selectOpen) => {
                                        if (!selectOpen) {
                                            setPostalQuery('');
                                        }
                                    }}
                                >
                                    <SelectTrigger id="postal_code" aria-invalid={errors.postal_code ? 'true' : undefined}>
                                        <SelectValue
                                            placeholder={
                                                (shouldUseIndonesianFields ? selectedVillageCode : selectedCityId)
                                                    ? isLoadingPostalCodes
                                                        ? 'Loading postal codes...'
                                                        : 'Select a postal code'
                                                    : shouldUseIndonesianFields
                                                      ? 'Select a village first'
                                                      : 'Select a city first'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(shouldUseIndonesianFields ? selectedVillageCode : selectedCityId) ? (
                                            isLoadingPostalCodes ? (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">Loading postal codes...</div>
                                            ) : postalFetchError ? (
                                                <div className="px-3 py-4 text-sm text-destructive">{postalFetchError}</div>
                                            ) : filteredPostalCodes.length > 0 ? (
                                                <>
                                                    <div className="mb-1 px-1">
                                                        <Input
                                                            autoFocus
                                                            value={postalQuery}
                                                            onChange={(event) => setPostalQuery(event.target.value)}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            placeholder="Search postal code..."
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    {filteredPostalCodes.map((postal) => (
                                                        <SelectItem key={postal.code} value={postal.code}>
                                                            {postal.code}
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">No postal code found</div>
                                            )
                                        ) : (
                                            <div className="px-3 py-4 text-sm text-muted-foreground">
                                                {shouldUseIndonesianFields
                                                    ? 'Select a village to see postal codes'
                                                    : 'Select a city to see postal codes'}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
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
