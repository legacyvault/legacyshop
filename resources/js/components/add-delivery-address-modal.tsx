import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IProvince, SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type CountryOption = {
    code: string;
    name: string;
    flag?: string;
};

interface FormData {
    id: string | null;
    name: string;
    contact_name: string;
    contact_phone: string;
    country: string;
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
    code?: string | null;
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

function normalizeCountryValue(value: unknown): string {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        const lower = trimmed.toLowerCase();
        if (lower === 'indonesia') {
            return 'ID';
        }

        const upper = trimmed.toUpperCase();
        if (upper === 'IDN') {
            return 'ID';
        }

        if (upper.length === 2) {
            return upper;
        }

        return upper;
    }

    if (typeof value === 'number') {
        return String(value).trim();
    }

    return '';
}

function isIndonesiaCountry(value: unknown): boolean {
    const normalized = normalizeCountryValue(value);
    return normalized === 'ID';
}

interface AddDeliveryAddressModalProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    deliveryAddress?: DeliveryAddress | null;
    id?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    closeOnSuccess?: boolean;
}

export default function AddDeliveryAddressModal({
    open,
    onOpenChange,
    deliveryAddress = null,
    id,
    onSuccess,
    onCancel,
    closeOnSuccess = true,
}: AddDeliveryAddressModalProps) {
    const isEdit = Boolean(id ?? deliveryAddress?.id);

    const { props } = usePage<SharedData>();
    const authCountryRaw = props.auth?.user?.country ?? '';

    const baseCountry = useMemo(() => {
        const deliveryCountry = normalizeCountryValue(deliveryAddress?.country);
        if (deliveryCountry) {
            return deliveryCountry;
        }

        const authCountry = normalizeCountryValue(authCountryRaw);
        if (authCountry) {
            return authCountry;
        }

        return 'ID';
    }, [authCountryRaw, deliveryAddress?.country]);

    const initialShouldUseIndonesianFields = useMemo(() => isIndonesiaCountry(baseCountry), [baseCountry]);

    const initialFormData = useMemo<FormData>(() => {
        const provinceValue = initialShouldUseIndonesianFields ? (deliveryAddress?.province_code ?? '') : (deliveryAddress?.province ?? '');
        const cityValue = initialShouldUseIndonesianFields ? (deliveryAddress?.city_code ?? '') : (deliveryAddress?.city ?? '');
        const districtValue = initialShouldUseIndonesianFields ? (deliveryAddress?.district_code ?? '') : (deliveryAddress?.district ?? '');
        const villageValue = initialShouldUseIndonesianFields ? (deliveryAddress?.village_code ?? '') : (deliveryAddress?.village ?? '');

        return {
            id: deliveryAddress?.id ?? id ?? null,
            name: deliveryAddress?.name ?? '',
            contact_name: deliveryAddress?.contact_name ?? '',
            contact_phone: deliveryAddress?.contact_phone ?? '',
            country: baseCountry,
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
    }, [baseCountry, deliveryAddress, id, initialShouldUseIndonesianFields]);

    const formSyncKey = useMemo(
        () =>
            JSON.stringify({
                data: initialFormData,
                usesIndonesianFields: initialShouldUseIndonesianFields,
            }),
        [initialFormData, initialShouldUseIndonesianFields],
    );

    const lastSyncedKeyRef = useRef<string | null>(null);
    const lastFetchedProvinceCountryRef = useRef<string | null>(null);
    const hasNormalizedCountryRef = useRef(false);

    const [countries, setCountries] = useState<CountryOption[]>([{ name: 'Indonesia', code: 'ID', flag: '🇮🇩' }]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [countryQuery, setCountryQuery] = useState('');

    const [provinceOptions, setProvinceOptions] = useState<IProvince[]>([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [provinceFetchError, setProvinceFetchError] = useState<string | null>(null);

    const [provinceQuery, setProvinceQuery] = useState('');
    const [cityQuery, setCityQuery] = useState('');
    const [selectedProvinceId, setSelectedProvinceId] = useState<string>(() =>
        initialShouldUseIndonesianFields ? initialFormData.province || '' : '',
    );
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<string>(() => (initialShouldUseIndonesianFields ? initialFormData.city || '' : ''));
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [cityFetchError, setCityFetchError] = useState<string | null>(null);
    const [districts, setDistricts] = useState<District[]>([]);
    const [districtQuery, setDistrictQuery] = useState('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>(() =>
        initialShouldUseIndonesianFields ? initialFormData.district || '' : '',
    );
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [districtFetchError, setDistrictFetchError] = useState<string | null>(null);
    const [villages, setVillages] = useState<Village[]>([]);
    const [villageQuery, setVillageQuery] = useState('');
    const [selectedVillageCode, setSelectedVillageCode] = useState<string>(() =>
        initialShouldUseIndonesianFields ? initialFormData.village || '' : '',
    );
    const [isLoadingVillages, setIsLoadingVillages] = useState(false);
    const [villageFetchError, setVillageFetchError] = useState<string | null>(null);
    const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
    const [postalQuery, setPostalQuery] = useState('');
    const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
    const [postalFetchError, setPostalFetchError] = useState<string | null>(null);
    const [skipCancelOnClose, setSkipCancelOnClose] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>(initialFormData);

    const selectedCountry = useMemo(() => {
        const current = normalizeCountryValue(data.country || baseCountry);
        return current || baseCountry;
    }, [baseCountry, data.country]);

    const shouldUseIndonesianFields = useMemo(() => isIndonesiaCountry(selectedCountry), [selectedCountry]);

    useEffect(() => {
        let isMounted = true;

        const loadCountries = async () => {
            setIsLoadingCountries(true);
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');

                if (!response.ok) {
                    throw new Error('Failed to fetch countries');
                }

                const payload: unknown = await response.json();
                if (!isMounted) {
                    return;
                }

                const normalized = Array.isArray(payload)
                    ? payload
                          .map((item: any): CountryOption | null => {
                              if (!item) {
                                  return null;
                              }

                              const name = item?.name?.common ?? item?.name ?? '';
                              const code = item?.cca2 ?? item?.code ?? '';
                              if (!name || !code) {
                                  return null;
                              }

                              return {
                                  name,
                                  code: String(code).toUpperCase(),
                                  flag: typeof item.flag === 'string' ? item.flag : undefined,
                              };
                          })
                          .filter((country): country is CountryOption => Boolean(country))
                          .sort((a, b) => a.name.localeCompare(b.name))
                    : [];

                if (normalized.length) {
                    setCountries(normalized);
                }
            } catch (error) {
                console.error('Error fetching countries:', error);
                if (!isMounted) {
                    return;
                }
                setCountries([
                    { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
                    { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
                    { name: 'United States', code: 'US', flag: '🇺🇸' },
                ]);
            } finally {
                if (isMounted) {
                    setIsLoadingCountries(false);
                }
            }
        };

        void loadCountries();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (hasNormalizedCountryRef.current) {
            return;
        }

        if (!countries.length) {
            return;
        }

        const current = data.country || baseCountry;
        if (!current) {
            hasNormalizedCountryRef.current = true;
            return;
        }

        const normalized = normalizeCountryValue(current);
        const hasExactCode = countries.some((country) => country.code === normalized);

        if (hasExactCode) {
            if (data.country !== normalized) {
                setData('country', normalized);
            }
            hasNormalizedCountryRef.current = true;
            return;
        }

        const matchByName = countries.find((country) => country.name.toLowerCase() === current.toLowerCase());

        if (matchByName) {
            setData('country', matchByName.code);
            hasNormalizedCountryRef.current = true;
            return;
        }

        hasNormalizedCountryRef.current = true;
    }, [countries, data.country, baseCountry, setData]);

    const filteredProvinces = useMemo(() => {
        const term = provinceQuery.trim().toLowerCase();

        if (!term) {
            return provinceOptions;
        }

        return provinceOptions.filter((province) => {
            const name = province.name.toLowerCase();
            const code = province.code?.toLowerCase() ?? '';

            return name.includes(term) || (!!code && code.includes(term));
        });
    }, [provinceOptions, provinceQuery]);

    const filteredCountries = useMemo(() => {
        const term = countryQuery.trim().toLowerCase();

        if (!term) {
            return countries;
        }

        return countries.filter((country) => {
            const name = country.name.toLowerCase();
            const code = country.code.toLowerCase();
            return name.includes(term) || code.includes(term);
        });
    }, [countries, countryQuery]);

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

    const fetchProvinces = useCallback(async (countryCode: string) => {
        if (!countryCode) {
            setProvinceOptions([]);
            return [];
        }

        setIsLoadingProvinces(true);
        setProvinceFetchError(null);

        try {
            const response = await fetch(route('public.province.list', countryCode), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch provinces');
            }

            const payload: unknown = await response.json();
            const rawProvinces = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.provinces) ? (payload as any).provinces : [];

            const normalized = rawProvinces
                .map((item: any): IProvince | null => {
                    if (!item) {
                        return null;
                    }

                    const name = typeof item.name === 'string' ? item.name : '';
                    const rawCode =
                        typeof item.code === 'string'
                            ? item.code
                            : typeof item.id === 'string'
                              ? item.id
                              : typeof item.geoname_id === 'string'
                                ? item.geoname_id
                                : typeof item.id === 'number'
                                  ? String(item.id)
                                  : typeof item.geoname_id === 'number'
                                    ? String(item.geoname_id)
                                    : '';

                    if (!name || !rawCode) {
                        return null;
                    }

                    return {
                        id: typeof item.id === 'string' && item.id.length ? item.id : typeof item.id === 'number' ? String(item.id) : rawCode,
                        name,
                        code: rawCode,
                    };
                })
                .filter((province: any): province is IProvince => Boolean(province));

            setProvinceOptions(normalized);
            return normalized;
        } catch (error) {
            console.error(error);
            setProvinceFetchError('Failed to load provinces. Please try again.');
            setProvinceOptions([]);
            return [];
        } finally {
            setIsLoadingProvinces(false);
        }
    }, []);

    const fetchCities = useCallback(async (provinceId: string, countryCode: string) => {
        if (!provinceId || !countryCode) {
            setCities([]);
            return [];
        }

        setIsLoadingCities(true);
        setCityFetchError(null);

        try {
            const response = await fetch(route('public.cities.list', [countryCode, provinceId]), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cities');
            }

            const payload: unknown = await response.json();
            const rawCities = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.cities) ? (payload as any).cities : [];

            const nextCities = rawCities
                .map((item: any): City | null => {
                    if (!item) {
                        return null;
                    }

                    const name = typeof item.name === 'string' ? item.name : '';
                    const rawId =
                        typeof item.code === 'string'
                            ? item.code
                            : typeof item.id === 'string'
                              ? item.id
                              : typeof item.geoname_id === 'string'
                                ? item.geoname_id
                                : typeof item.id === 'number'
                                  ? String(item.id)
                                  : typeof item.geoname_id === 'number'
                                    ? String(item.geoname_id)
                                    : '';

                    if (!name || !rawId) {
                        return null;
                    }

                    return {
                        id: rawId,
                        name,
                        code: rawId,
                    };
                })
                .filter((city: any): city is City => Boolean(city));

            setCities(nextCities);
            return nextCities;
        } catch (error) {
            console.error(error);
            setCityFetchError('Failed to load cities. Please try again.');
            setCities([]);
            return [];
        } finally {
            setIsLoadingCities(false);
        }
    }, []);

    const fetchDistricts = useCallback(async (cityCode: string, countryCode: string) => {
        if (!cityCode || !isIndonesiaCountry(countryCode)) {
            setDistricts([]);
            return [];
        }

        setIsLoadingDistricts(true);
        setDistrictFetchError(null);

        try {
            const response = await fetch(
                route('public.districts.list', {
                    city: cityCode,
                    country: countryCode,
                }),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch districts');
            }

            const payload: unknown = await response.json();
            const rawDistricts = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.districts) ? (payload as any).districts : [];

            const nextDistricts = rawDistricts
                .map((item: any): District | null => {
                    if (!item) {
                        return null;
                    }

                    const name = typeof item.name === 'string' ? item.name : '';
                    const code =
                        typeof item.code === 'string'
                            ? item.code
                            : typeof item.id === 'string'
                              ? item.id
                              : typeof item.geoname_id === 'string'
                                ? item.geoname_id
                                : '';

                    if (!name || !code) {
                        return null;
                    }

                    return {
                        name,
                        code,
                    };
                })
                .filter((district: any): district is District => Boolean(district));

            setDistricts(nextDistricts);
            return nextDistricts;
        } catch (error) {
            console.error(error);
            setDistrictFetchError('Failed to load districts. Please try again.');
            setDistricts([]);
            return [];
        } finally {
            setIsLoadingDistricts(false);
        }
    }, []);

    const fetchVillages = useCallback(async (districtCode: string, countryCode: string) => {
        if (!districtCode || !isIndonesiaCountry(countryCode)) {
            setVillages([]);
            return [];
        }

        setIsLoadingVillages(true);
        setVillageFetchError(null);

        try {
            const response = await fetch(
                route('public.villages.list', {
                    district: districtCode,
                    country: countryCode,
                }),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch villages');
            }

            const payload: unknown = await response.json();
            const rawVillages = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.villages) ? (payload as any).villages : [];

            const nextVillages = rawVillages
                .map((item: any): Village | null => {
                    if (!item) {
                        return null;
                    }

                    const name = typeof item.name === 'string' ? item.name : '';
                    const code =
                        typeof item.code === 'string'
                            ? item.code
                            : typeof item.id === 'string'
                              ? item.id
                              : typeof item.geoname_id === 'string'
                                ? item.geoname_id
                                : '';

                    if (!name || !code) {
                        return null;
                    }

                    return {
                        name,
                        code,
                    };
                })
                .filter((village: any): village is Village => Boolean(village));

            setVillages(nextVillages);
            return nextVillages;
        } catch (error) {
            console.error(error);
            setVillageFetchError('Failed to load villages. Please try again.');
            setVillages([]);
            return [];
        } finally {
            setIsLoadingVillages(false);
        }
    }, []);

    const fetchPostalCodes = useCallback(
        async ({ id, scope, countryCode }: { id: string; scope: 'city' | 'district' | 'village'; countryCode: string }) => {
            if (!id || !countryCode) {
                setPostalCodes([]);
                return [];
            }

            setIsLoadingPostalCodes(true);
            setPostalFetchError(null);

            try {
                const response = await fetch(
                    route('public.postal_code.list', {
                        location: id,
                        scope,
                        country: countryCode,
                    }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'include',
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch postal codes');
                }

                const payload: unknown = await response.json();
                const rawSource = Array.isArray(payload)
                    ? payload
                    : Array.isArray((payload as any)?.postal_codes)
                      ? (payload as any).postal_codes
                      : Array.isArray((payload as any)?.postal_code)
                        ? (payload as any).postal_code
                        : [];

                const normalized = rawSource
                    .map((item: any) => {
                        if (!item) {
                            return '';
                        }

                        if (typeof item === 'string') {
                            return item.trim();
                        }

                        const value = item.postalCode ?? item.postal_code ?? item.code ?? '';
                        if (typeof value === 'number') {
                            return String(value);
                        }

                        return typeof value === 'string' ? value.trim() : '';
                    })
                    .filter((code: string): code is string => Boolean(code));

                const uniqueCodes: PostalCode[] = Array.from(new Set(normalized)).map((code) => ({ code: code as string }));
                setPostalCodes(uniqueCodes);
                return uniqueCodes;
            } catch (error) {
                console.error(error);
                setPostalFetchError('Failed to load postal codes. Please try again.');
                setPostalCodes([]);
                return [];
            } finally {
                setIsLoadingPostalCodes(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (!data.province) {
            setSelectedProvinceId('');
            return;
        }

        if (shouldUseIndonesianFields) {
            setSelectedProvinceId((prev) => (prev === data.province ? prev : data.province));
            return;
        }

        const match = provinceOptions.find(
            (province) => province.name === data.province || province.code === data.province || province.id === data.province,
        );
        setSelectedProvinceId((prev) => {
            const next = match?.code ?? match?.id ?? '';
            return next === prev ? prev : next;
        });
    }, [data.province, shouldUseIndonesianFields, provinceOptions]);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            setSelectedCityId('');
            return;
        }

        if (!selectedCountry) {
            setCities([]);
            setSelectedCityId('');
            return;
        }

        void fetchCities(selectedProvinceId, selectedCountry);
    }, [selectedProvinceId, selectedCountry, fetchCities]);

    useEffect(() => {
        if (!data.city) {
            setSelectedCityId('');
            return;
        }

        if (shouldUseIndonesianFields) {
            setSelectedCityId((prev) => (prev === data.city ? prev : data.city));
            return;
        }

        const match = cities.find((city) => city.name === data.city || city.code === data.city || city.id === data.city);
        setSelectedCityId((prev) => {
            const next = match?.code ?? match?.id ?? '';
            return next === prev ? prev : next;
        });
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

            void fetchPostalCodes({
                id: selectedCityId,
                scope: 'city',
                countryCode: selectedCountry,
            });
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
        void fetchDistricts(selectedCityId, selectedCountry);
    }, [selectedCityId, shouldUseIndonesianFields, selectedCountry, fetchPostalCodes, fetchDistricts]);

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

        void fetchVillages(selectedDistrictCode, selectedCountry);
    }, [shouldUseIndonesianFields, selectedDistrictCode, selectedCountry, fetchVillages]);

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

        void fetchPostalCodes({
            id: selectedVillageCode,
            scope: 'village',
            countryCode: selectedCountry,
        });
    }, [shouldUseIndonesianFields, selectedVillageCode, selectedCountry, fetchPostalCodes]);

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
        if (!open) {
            return;
        }

        if (lastSyncedKeyRef.current === formSyncKey) {
            return;
        }

        lastSyncedKeyRef.current = formSyncKey;
        hasNormalizedCountryRef.current = false;
        setData(() => initialFormData);

        if (shouldUseIndonesianFields) {
            setSelectedProvinceId(initialFormData.province || '');
            setSelectedCityId(initialFormData.city || '');
            setSelectedDistrictCode(initialFormData.district || '');
            setSelectedVillageCode(initialFormData.village || '');
        } else {
            if (initialFormData.province) {
                const match = provinceOptions.find(
                    (province) =>
                        province.name === initialFormData.province ||
                        province.code === initialFormData.province ||
                        province.id === initialFormData.province,
                );
                setSelectedProvinceId(match?.code ?? match?.id ?? '');
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
    }, [open, formSyncKey, initialFormData, shouldUseIndonesianFields, provinceOptions, setData]);

    useEffect(() => {
        if (!open) {
            lastFetchedProvinceCountryRef.current = null;
            lastSyncedKeyRef.current = null;
            hasNormalizedCountryRef.current = false;
            setCountryQuery('');
            setProvinceFetchError(null);
            setIsLoadingProvinces(false);
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

    useEffect(() => {
        if (!open) {
            return;
        }

        const countryCode = selectedCountry;
        if (!countryCode) {
            setProvinceOptions([]);
            setProvinceFetchError(null);
            setIsLoadingProvinces(false);
            lastFetchedProvinceCountryRef.current = null;
            return;
        }

        if (lastFetchedProvinceCountryRef.current === countryCode) {
            return;
        }

        lastFetchedProvinceCountryRef.current = countryCode;
        setProvinceQuery('');
        void fetchProvinces(countryCode);
    }, [open, selectedCountry, fetchProvinces]);

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
                                    <Label htmlFor="country">Country *</Label>
                                    <Select
                                        value={selectedCountry || undefined}
                                        disabled={true}
                                        onValueChange={(value) => {
                                            const normalizedValue = normalizeCountryValue(value) || value;
                                            setData('country', normalizedValue);
                                            setSelectedProvinceId('');
                                            setSelectedCityId('');
                                            setSelectedDistrictCode('');
                                            setSelectedVillageCode('');
                                            setProvinceOptions([]);
                                            setProvinceFetchError(null);
                                            setIsLoadingProvinces(false);
                                            setCities([]);
                                            setCityFetchError(null);
                                            setIsLoadingCities(false);
                                            setDistricts([]);
                                            setDistrictFetchError(null);
                                            setIsLoadingDistricts(false);
                                            setVillages([]);
                                            setVillageFetchError(null);
                                            setIsLoadingVillages(false);
                                            setPostalCodes([]);
                                            setPostalFetchError(null);
                                            setIsLoadingPostalCodes(false);
                                            setData('province', '');
                                            setData('city', '');
                                            setData('district', '');
                                            setData('village', '');
                                            setData('postal_code', '');
                                            setProvinceQuery('');
                                            setCityQuery('');
                                            setDistrictQuery('');
                                            setVillageQuery('');
                                            setPostalQuery('');
                                            lastFetchedProvinceCountryRef.current = null;
                                        }}
                                        onOpenChange={(selectOpen) => {
                                            if (!selectOpen) {
                                                setCountryQuery('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="country" aria-invalid={errors.country ? 'true' : undefined}>
                                            <SelectValue placeholder={isLoadingCountries ? 'Loading countries...' : 'Select a country'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="mb-1 px-1">
                                                <Input
                                                    autoFocus
                                                    value={countryQuery}
                                                    onChange={(event) => setCountryQuery(event.target.value)}
                                                    onKeyDown={(event) => event.stopPropagation()}
                                                    onPointerDown={(event) => event.stopPropagation()}
                                                    placeholder="Search country..."
                                                    className="h-8"
                                                />
                                            </div>
                                            {isLoadingCountries ? (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">Loading countries...</div>
                                            ) : filteredCountries.length > 0 ? (
                                                filteredCountries.map((country) => (
                                                    <SelectItem key={country.code} value={country.code}>
                                                        <span className="flex items-center gap-2">
                                                            {country.flag ? <span>{country.flag}</span> : null}
                                                            <span>{country.name}</span>
                                                            <span className="text-xs text-muted-foreground">({country.code})</span>
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">No country found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province">Province *</Label>
                                    <Select
                                        value={shouldUseIndonesianFields ? data.province || undefined : selectedProvinceId || undefined}
                                        onValueChange={(value) => {
                                            if (shouldUseIndonesianFields) {
                                                setData('province', value);
                                                setSelectedProvinceId(value);
                                            } else {
                                                const province = provinceOptions.find(
                                                    (item) => item.code === value || item.id === value || item.name === value,
                                                );
                                                setSelectedProvinceId(value);
                                                setData('province', province?.name ?? '');
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
                                        disabled={!selectedCountry || isLoadingProvinces}
                                        onOpenChange={(selectOpen) => {
                                            if (!selectOpen) {
                                                setProvinceQuery('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="province" aria-invalid={errors.province ? 'true' : undefined}>
                                            <SelectValue
                                                placeholder={
                                                    !selectedCountry
                                                        ? 'Select a country first'
                                                        : isLoadingProvinces
                                                          ? 'Loading provinces...'
                                                          : filteredProvinces.length > 0
                                                            ? 'Select a province'
                                                            : 'No province available'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingProvinces ? (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">Loading provinces...</div>
                                            ) : provinceFetchError ? (
                                                <div className="px-3 py-4 text-sm text-destructive">{provinceFetchError}</div>
                                            ) : filteredProvinces.length > 0 ? (
                                                <>
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
                                                    {filteredProvinces.map((province) => (
                                                        <SelectItem key={province.id} value={province.code ?? province.id}>
                                                            <span className="flex flex-col">
                                                                <span>{province.name}</span>
                                                                {!shouldUseIndonesianFields && province.code ? (
                                                                    <span className="text-xs text-muted-foreground">{province.code}</span>
                                                                ) : null}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="px-3 py-4 text-sm text-muted-foreground">No province found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                                </div>
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Select
                                        value={shouldUseIndonesianFields ? data.city || undefined : selectedCityId || undefined}
                                        onValueChange={(value) => {
                                            if (shouldUseIndonesianFields) {
                                                setData('city', value);
                                                setSelectedCityId(value);
                                            } else {
                                                const cityRecord = cities.find(
                                                    (item) => item.code === value || item.id === value || item.name === value,
                                                );
                                                setSelectedCityId(value);
                                                setData('city', cityRecord?.name ?? '');
                                            }

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
                                                    void fetchCities(selectedProvinceId, selectedCountry);
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
                                                            : filteredCities.length > 0
                                                              ? 'Select a city'
                                                              : 'No city available'
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
                                                            <SelectItem key={city.id} value={city.code ?? city.id}>
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
