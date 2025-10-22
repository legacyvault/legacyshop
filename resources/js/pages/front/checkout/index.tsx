import CourierListModal from '@/components/courier-list-modal';
import MapLocationPicker from '@/components/map-location-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SharedData, type IDeliveryAddress, type IRatePricing, type IRootCheckoutOrderMidtrans } from '@/types';
import { Link, router, usePage, useRemember } from '@inertiajs/react';
import { BadgeCheck, Check, ChevronDown, CurrencyIcon, MapPin, PackageCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CHECKOUT_ITEMS_STORAGE_KEY = 'checkout:selectedItems';
const FALLBACK_IMAGE = '/banner-example.jpg';

interface Country {
    name: string;
    code: string;
    flag: string;
}

type CheckoutItem = {
    id: string;
    store: string;
    name: string;
    variant?: string;
    attributes?: string[];
    quantity: number;
    price: number;
    image?: string | null;
    weight?: number;
    source?: 'server' | 'local';
    cartId?: string | null;
    productId?: string | null;
    protectionPrice?: number;
    protectionLabel?: string | null;
};

type GuestContact = {
    fullName: string;
    email: string;
    phone: string;
};

type GuestAddressForm = {
    label: string;
    address: string;
    city: string;
    cityCode: string;
    province: string;
    provinceCode: string;
    district: string;
    districtCode: string;
    village: string;
    villageCode: string;
    postalCode: string;
    latitude: string;
    longitude: string;
    country: string;
    notes: string;
};

type GuestDeliveryAddress = {
    id: 'guest';
    source: 'guest';
    name: string;
    contact_name: string;
    contact_phone: string;
    address: string;
    postal_code: string;
    city: string;
    city_code?: string;
    province: string;
    province_code?: string;
    district?: string;
    district_code?: string;
    village?: string;
    village_code?: string;
    latitude: number;
    longitude: number;
    country?: string;
    is_active: boolean;
};

type LocationOption = {
    value: string;
    label: string;
};

function buildPublicApiUrl(path: string, query: Record<string, string | undefined> = {}) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
    const url = new URL(`/v1/public/${path.replace(/^\/+/, '')}`, origin);
    Object.entries(query).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length) {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

type CheckoutAddress = IDeliveryAddress | GuestDeliveryAddress;

const dummyPayments = [
    { id: 'qris', name: 'Qris', accent: 'bg-[#FFE8CC] text-[#E57E25]', selected: true },
    {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        accent: 'bg-[#DAE8FF] text-[#1A56DB]',
        selected: false,
        children: [
            {
                id: 'permata',
                name: 'Permata Bank',
                selected: false,
            },
            {
                id: 'bca',
                name: 'BCA',
                selected: false,
            },
            {
                id: 'bni',
                name: 'BRI',
                selected: false,
            },
            {
                id: 'cimb',
                name: 'CIMB',
                selected: false,
            },
        ],
    },
];

function normalizeLocationOptions(items: unknown): LocationOption[] {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const record = item as Record<string, unknown>;
            const label = typeof record.name === 'string' ? record.name : '';
            const rawValue =
                typeof record.code === 'string' && record.code.length
                    ? record.code
                    : typeof record.id === 'string' && record.id.length
                      ? record.id
                      : typeof record.id === 'number'
                        ? String(record.id)
                        : typeof record.geonameId === 'number'
                          ? String(record.geonameId)
                          : '';

            if (!label || !rawValue) {
                return null;
            }

            return {
                value: rawValue,
                label,
            };
        })
        .filter((option): option is LocationOption => Boolean(option))
        .sort((a, b) => a.label.localeCompare(b.label));
}

async function parseJsonResponse(response: Response) {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        const error = new Error('Unexpected response content type');
        (error as any).response = response;
        throw error;
    }

    return response.json();
}

function getRateId(rate: IRatePricing) {
    return `${rate.courier_code}-${rate.courier_service_code}`;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

function loadStoredCheckoutItems(): CheckoutItem[] {
    if (typeof window === 'undefined') router.visit('/');
    try {
        const raw = sessionStorage.getItem(CHECKOUT_ITEMS_STORAGE_KEY);
        if (!raw) {
            router.visit('/');
            return [];
        }
        const parsed = JSON.parse(raw) as CheckoutItem[];
        if (!Array.isArray(parsed)) {
            router.visit('/');
            return [];
        }
        return parsed.map((item) => ({
            ...item,
            quantity: Math.max(1, Number(item.quantity ?? 1)),
            price: Number(item.price ?? 0),
            weight: Number(item.weight ?? 0),
            protectionPrice: Number(item.protectionPrice ?? 0),
        }));
    } catch (error) {
        router.visit('/');
        return [];
    }
}

export default function Checkout() {
    const { deliveryAddresses, provinces, rates, warehouse, couriers, auth } = usePage<SharedData>().props;
    const isGuest = !auth?.user;
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>(() => loadStoredCheckoutItems());
    const [countries, setCountries] = useState<Country[]>(() => [{ name: 'Indonesia', code: 'ID', flag: '🇮🇩' }]);

    const defaultPaymentMethod = dummyPayments.find((method) => method.selected) ?? dummyPayments[0];
    const [selectedPaymentId, setSelectedPaymentId] = useState<string>(() => {
        const defaultMethod = dummyPayments.find((method) => method.selected) ?? dummyPayments[0];
        return defaultMethod?.id ?? '';
    });
    const [selectedBankPaymentId, setSelectedBankPaymentId] = useState<string | null>(() => {
        if (defaultPaymentMethod?.children?.length) {
            const defaultChild = defaultPaymentMethod.children.find((child) => child.selected) ?? defaultPaymentMethod.children[0];
            return defaultChild?.id ?? null;
        }
        return null;
    });
    const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(() => defaultPaymentMethod?.id ?? null);

    const addresses = useMemo(() => (Array.isArray(deliveryAddresses) ? deliveryAddresses : []), [deliveryAddresses]);
    const [selectedAddress, setSelectedAddress] = useState<CheckoutAddress | null>(() => {
        if (!addresses.length) return null;
        return addresses.find((address) => address.is_active) ?? addresses[0];
    });
    const [isChangeAddressOpen, setIsChangeAddressOpen] = useState(false);
    const [guestContact, setGuestContact] = useState<GuestContact>(() => ({
        fullName: '',
        email: '',
        phone: '',
    }));
    const [guestAddressForm, setGuestAddressForm] = useState<GuestAddressForm>(() => ({
        label: '',
        address: '',
        province: '',
        provinceCode: '',
        city: '',
        cityCode: '',
        district: '',
        districtCode: '',
        village: '',
        villageCode: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        country: 'ID',
        notes: '',
    }));
    const [hasAttemptedGuestRates, setHasAttemptedGuestRates] = useState(false);
    const [hasAttemptedGuestCheckout, setHasAttemptedGuestCheckout] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState<LocationOption[]>(() => normalizeLocationOptions(provinces));
    const [cityOptions, setCityOptions] = useState<LocationOption[]>([]);
    const [districtOptions, setDistrictOptions] = useState<LocationOption[]>([]);
    const [villageOptions, setVillageOptions] = useState<LocationOption[]>([]);
    const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingVillages, setIsLoadingVillages] = useState(false);
    const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
    const lastProvinceCountryRef = useRef<string | null>(provinceOptions.length ? guestAddressForm.country : null);

    useEffect(() => {
        if (!addresses.length) {
            setSelectedAddress(null);
            return;
        }

        setSelectedAddress((prev) => {
            if (prev && addresses.some((address) => address.id === prev.id)) {
                return prev;
            }

            return addresses.find((address) => address.is_active) ?? addresses[0];
        });
    }, [addresses]);

    const usingGuestAddress = isGuest || !addresses.length;
    const isIndonesiaAddress = useMemo(() => {
        const rawCountry = guestAddressForm.country?.trim() ?? '';
        if (!rawCountry.length) {
            return false;
        }

        const upper = rawCountry.toUpperCase();
        if (upper === 'ID' || upper === 'IDN') {
            return true;
        }

        return rawCountry.toLowerCase() === 'indonesia';
    }, [guestAddressForm.country]);

    const guestSelectedAddress = useMemo<GuestDeliveryAddress | null>(() => {
        if (!usingGuestAddress) {
            return null;
        }

        const fullName = guestContact.fullName.trim();
        const email = guestContact.email.trim();
        const phone = guestContact.phone.trim();
        const address = guestAddressForm.address.trim();
        const city = guestAddressForm.city.trim();
        const province = guestAddressForm.province.trim();
        const district = guestAddressForm.district.trim();
        const village = guestAddressForm.village.trim();
        const postalCode = guestAddressForm.postalCode.trim();
        const countryValue = guestAddressForm.country.trim();
        const latitude = Number(guestAddressForm.latitude);
        const longitude = Number(guestAddressForm.longitude);

        const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
        const requiresDistrict = isIndonesiaAddress;
        const requiresVillage = isIndonesiaAddress && villageOptions.length > 0;
        const hasRequiredFields = Boolean(
            fullName &&
                email &&
                phone &&
                address &&
                city &&
                province &&
                postalCode &&
                (!requiresDistrict || district) &&
                (!requiresVillage || village),
        );

        if (!hasCoords || !hasRequiredFields) {
            return null;
        }

        return {
            id: 'guest',
            source: 'guest',
            name: guestAddressForm.label.trim() || 'Guest Address',
            contact_name: fullName,
            contact_phone: phone,
            address,
            postal_code: postalCode,
            city,
            city_code: guestAddressForm.cityCode || undefined,
            province,
            province_code: guestAddressForm.provinceCode || undefined,
            district: requiresDistrict ? district || undefined : undefined,
            district_code: requiresDistrict ? guestAddressForm.districtCode || undefined : undefined,
            village: requiresVillage ? village || undefined : undefined,
            village_code: requiresVillage ? guestAddressForm.villageCode || undefined : undefined,
            latitude,
            longitude,
            country: countryValue || undefined,
            is_active: true,
        };
    }, [guestAddressForm, guestContact, isIndonesiaAddress, usingGuestAddress, villageOptions.length]);

    const selectedCheckoutAddress = useMemo<CheckoutAddress | null>(() => {
        if (usingGuestAddress) {
            return guestSelectedAddress;
        }

        return selectedAddress;
    }, [guestSelectedAddress, selectedAddress, usingGuestAddress]);

    const guestFormIncomplete = useMemo(() => {
        if (!usingGuestAddress) {
            return false;
        }

        if (!guestSelectedAddress) {
            return true;
        }

        return false;
    }, [guestSelectedAddress, usingGuestAddress]);

    const showGuestFormError = usingGuestAddress && guestFormIncomplete && (hasAttemptedGuestRates || hasAttemptedGuestCheckout);

    const guestFieldStatus = useMemo(() => {
        if (!usingGuestAddress) {
            return {
                fullNameMissing: false,
                emailMissing: false,
                phoneMissing: false,
                addressMissing: false,
                cityMissing: false,
                provinceMissing: false,
                districtMissing: false,
                villageMissing: false,
                postalCodeMissing: false,
                latitudeMissing: false,
                longitudeMissing: false,
            };
        }

        const fullName = guestContact.fullName.trim();
        const email = guestContact.email.trim();
        const phone = guestContact.phone.trim();
        const addressLine = guestAddressForm.address.trim();
        const city = guestAddressForm.city.trim();
        const province = guestAddressForm.province.trim();
        const district = guestAddressForm.district.trim();
        const village = guestAddressForm.village.trim();
        const postalCode = guestAddressForm.postalCode.trim();
        const latitude = Number(guestAddressForm.latitude);
        const longitude = Number(guestAddressForm.longitude);

        return {
            fullNameMissing: !fullName,
            emailMissing: !email,
            phoneMissing: !phone,
            addressMissing: !addressLine,
            cityMissing: !city,
            provinceMissing: !province,
            districtMissing: isIndonesiaAddress && !district,
            villageMissing: isIndonesiaAddress && villageOptions.length > 0 && !village,
            postalCodeMissing: !postalCode,
            latitudeMissing: !Number.isFinite(latitude),
            longitudeMissing: !Number.isFinite(longitude),
        };
    }, [guestAddressForm, guestContact, isIndonesiaAddress, usingGuestAddress, villageOptions.length]);

    const guestLocationValue = useMemo(() => {
        if (!usingGuestAddress) {
            return undefined;
        }

        const lat = Number(guestAddressForm.latitude);
        const lng = Number(guestAddressForm.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return undefined;
        }

        return {
            lat,
            lng,
            address: guestAddressForm.address || undefined,
        };
    }, [guestAddressForm.address, guestAddressForm.latitude, guestAddressForm.longitude, usingGuestAddress]);

    const fetchProvinces = useCallback(async (countryCode: string) => {
        if (!countryCode) {
            setProvinceOptions([]);
            return [];
        }

        setIsLoadingProvinces(true);

        try {
            const url = `/v1/public/public-province-list/${countryCode}`;
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch provinces');
            }

            const payload: any = await parseJsonResponse(response);
            const rawProvinces = Array.isArray(payload) ? payload : Array.isArray(payload?.provinces) ? payload.provinces : [];
            const options = normalizeLocationOptions(rawProvinces);
            setProvinceOptions(options);
            return options;
        } catch (error) {
            console.error('Error fetching provinces:', error);
            setProvinceOptions([]);
            return [];
        } finally {
            setIsLoadingProvinces(false);
        }
    }, []);

    const fetchCities = useCallback(async (provinceCode: string, countryCode: string) => {
        if (!provinceCode) {
            setCityOptions([]);
            return [];
        }

        setIsLoadingCities(true);

        try {
            const url = `/v1/public/public-city-list/${countryCode}/${provinceCode}`;

            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cities');
            }

            const payload: any = await parseJsonResponse(response);
            const rawCities = Array.isArray(payload) ? payload : Array.isArray(payload?.cities) ? payload.cities : [];
            const options = normalizeLocationOptions(rawCities);
            setCityOptions(options);
            return options;
        } catch (error) {
            console.error('Error fetching cities:', error);
            setCityOptions([]);
            return [];
        } finally {
            setIsLoadingCities(false);
        }
    }, []);

    const fetchDistricts = useCallback(async (cityCode: string, countryCode: string) => {
        if (!cityCode) {
            setDistrictOptions([]);
            return [];
        }

        setIsLoadingDistricts(true);

        try {
            const url = buildPublicApiUrl(`district-list/${encodeURIComponent(cityCode)}`, { country: countryCode });
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch districts');
            }

            const payload: any = await parseJsonResponse(response);
            const rawDistricts = Array.isArray(payload) ? payload : Array.isArray(payload?.districts) ? payload.districts : [];
            const options = normalizeLocationOptions(rawDistricts);
            setDistrictOptions(options);
            return options;
        } catch (error) {
            console.error('Error fetching districts:', error);
            setDistrictOptions([]);
            return [];
        } finally {
            setIsLoadingDistricts(false);
        }
    }, []);

    const fetchVillages = useCallback(async (districtCode: string, countryCode: string) => {
        if (!districtCode) {
            setVillageOptions([]);
            return [];
        }

        setIsLoadingVillages(true);

        try {
            const url = buildPublicApiUrl(`village-list/${encodeURIComponent(districtCode)}`, { country: countryCode });
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch villages');
            }

            const payload: any = await parseJsonResponse(response);
            const rawVillages = Array.isArray(payload) ? payload : Array.isArray(payload?.villages) ? payload.villages : [];
            const options = normalizeLocationOptions(rawVillages);
            setVillageOptions(options);
            return options;
        } catch (error) {
            console.error('Error fetching villages:', error);
            setVillageOptions([]);
            return [];
        } finally {
            setIsLoadingVillages(false);
        }
    }, []);

    const fetchPostalCodes = useCallback(
        async ({ id, scope, countryCode }: { id: string; scope: 'city' | 'district' | 'village'; countryCode: string }) => {
            if (!id) {
                setPostalCodeOptions([]);
                return [];
            }

            setIsLoadingPostalCodes(true);

            try {
                const url = buildPublicApiUrl(`postal-code-list/${encodeURIComponent(id)}`, { scope, country: countryCode });
                const response = await fetch(url, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch postal codes');
                }

                const payload: any = await parseJsonResponse(response);
                const rawSource = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.postal_codes)
                      ? payload.postal_codes
                      : Array.isArray(payload?.postal_code)
                        ? payload.postal_code
                        : [];

                const codes = rawSource
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

                const uniqueCodes = Array.from(new Set(codes)) as string[];
                setPostalCodeOptions(uniqueCodes);
                return uniqueCodes;
            } catch (error) {
                console.error('Error fetching postal codes:', error);
                setPostalCodeOptions([]);
                return [];
            } finally {
                setIsLoadingPostalCodes(false);
            }
        },
        [],
    );

    const handleCountryChange = useCallback(
        (value: string) => {
            setGuestAddressForm((prev) => ({
                ...prev,
                country: value,
                province: '',
                provinceCode: '',
                city: '',
                cityCode: '',
                district: '',
                districtCode: '',
                village: '',
                villageCode: '',
                postalCode: '',
            }));
            setProvinceOptions([]);
            setCityOptions([]);
            setDistrictOptions([]);
            setVillageOptions([]);
            setPostalCodeOptions([]);
            lastProvinceCountryRef.current = null;
        },
        [lastProvinceCountryRef],
    );

    const handleProvinceChange = useCallback(
        (provinceCode: string) => {
            const matchedProvince = provinceOptions.find((option) => option.value === provinceCode) ?? null;
            setGuestAddressForm((prev) => ({
                ...prev,
                provinceCode,
                province: matchedProvince?.label ?? '',
                city: '',
                cityCode: '',
                district: '',
                districtCode: '',
                village: '',
                villageCode: '',
                postalCode: '',
            }));
            setCityOptions([]);
            setDistrictOptions([]);
            setVillageOptions([]);
            setPostalCodeOptions([]);
        },
        [provinceOptions],
    );

    const handleCityChange = useCallback(
        (cityCode: string) => {
            const matchedCity = cityOptions.find((option) => option.value === cityCode) ?? null;
            setGuestAddressForm((prev) => ({
                ...prev,
                cityCode,
                city: matchedCity?.label ?? '',
                district: '',
                districtCode: '',
                village: '',
                villageCode: '',
                postalCode: '',
            }));
            setDistrictOptions([]);
            setVillageOptions([]);
            setPostalCodeOptions([]);
        },
        [cityOptions],
    );

    const handleDistrictChange = useCallback(
        (districtCode: string) => {
            const matchedDistrict = districtOptions.find((option) => option.value === districtCode) ?? null;
            setGuestAddressForm((prev) => ({
                ...prev,
                districtCode,
                district: matchedDistrict?.label ?? '',
                village: '',
                villageCode: '',
                postalCode: '',
            }));
            setVillageOptions([]);
            setPostalCodeOptions([]);
        },
        [districtOptions],
    );

    const handleVillageChange = useCallback(
        (villageCode: string) => {
            const matchedVillage = villageOptions.find((option) => option.value === villageCode) ?? null;
            setGuestAddressForm((prev) => ({
                ...prev,
                villageCode,
                village: matchedVillage?.label ?? '',
                postalCode: '',
            }));
            setPostalCodeOptions([]);
        },
        [villageOptions],
    );

    const handlePostalCodeChange = useCallback((postalCode: string) => {
        setGuestAddressForm((prev) => ({
            ...prev,
            postalCode,
        }));
    }, []);

    useEffect(() => {
        const countryCode = guestAddressForm.country?.trim();
        if (!countryCode) {
            setProvinceOptions([]);
            lastProvinceCountryRef.current = null;
            return;
        }

        if (lastProvinceCountryRef.current === countryCode) {
            return;
        }

        lastProvinceCountryRef.current = countryCode;
        void fetchProvinces(countryCode);
    }, [fetchProvinces, guestAddressForm.country]);

    useEffect(() => {
        const provinceCode = guestAddressForm.provinceCode;
        if (!provinceCode) {
            setCityOptions([]);
            setDistrictOptions([]);
            setVillageOptions([]);
            setPostalCodeOptions([]);
            return;
        }

        void fetchCities(provinceCode, guestAddressForm.country);
    }, [fetchCities, guestAddressForm.country, guestAddressForm.provinceCode]);

    useEffect(() => {
        const cityCode = guestAddressForm.cityCode;
        if (!cityCode) {
            setDistrictOptions([]);
            setVillageOptions([]);
            setPostalCodeOptions([]);
            return;
        }

        if (isIndonesiaAddress) {
            setPostalCodeOptions([]);
            void fetchDistricts(cityCode, guestAddressForm.country);
            return;
        }

        void fetchPostalCodes({ id: cityCode, scope: 'city', countryCode: guestAddressForm.country });
    }, [fetchDistricts, fetchPostalCodes, guestAddressForm.cityCode, guestAddressForm.country, isIndonesiaAddress]);

    useEffect(() => {
        if (!isIndonesiaAddress) {
            return;
        }

        const districtCode = guestAddressForm.districtCode;
        if (!districtCode) {
            setVillageOptions([]);
            setPostalCodeOptions([]);
            return;
        }

        setPostalCodeOptions([]);
        void (async () => {
            const villages = await fetchVillages(districtCode, guestAddressForm.country);
            if (villages.length === 0) {
                await fetchPostalCodes({ id: districtCode, scope: 'district', countryCode: guestAddressForm.country });
            }
        })();
    }, [fetchPostalCodes, fetchVillages, guestAddressForm.country, guestAddressForm.districtCode, isIndonesiaAddress]);

    useEffect(() => {
        if (!isIndonesiaAddress) {
            return;
        }

        const villageCode = guestAddressForm.villageCode;
        if (!villageCode) {
            setPostalCodeOptions([]);
            return;
        }

        void fetchPostalCodes({ id: villageCode, scope: 'village', countryCode: guestAddressForm.country });
    }, [fetchPostalCodes, guestAddressForm.country, guestAddressForm.villageCode, isIndonesiaAddress]);

    useEffect(() => {
        if (!guestAddressForm.postalCode) {
            return;
        }

        if (!postalCodeOptions.includes(guestAddressForm.postalCode)) {
            setGuestAddressForm((prev) => ({
                ...prev,
                postalCode: '',
            }));
        }
    }, [guestAddressForm.postalCode, postalCodeOptions]);

    // Fetch countries on component mount
    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
            const data = await response.json();

            const formattedCountries: Country[] = data
                .map((country: any) => ({
                    name: country.name.common,
                    code: country.cca2,
                    flag: country.flag,
                }))
                .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

            setCountries(formattedCountries);
        } catch (error) {
            console.error('Error fetching countries:', error);
            // Fallback to basic countries if API fails
            setCountries([
                { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
                { name: 'United States', code: 'US', flag: '🇺🇸' },
                { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
            ]);
        }
    };

    useEffect(() => {
        if (guestSelectedAddress && hasAttemptedGuestRates) {
            setHasAttemptedGuestRates(false);
        }
    }, [guestSelectedAddress, hasAttemptedGuestRates]);

    useEffect(() => {
        if (guestSelectedAddress && hasAttemptedGuestCheckout) {
            setHasAttemptedGuestCheckout(false);
        }
    }, [guestSelectedAddress, hasAttemptedGuestCheckout]);

    const addressInformation = useMemo(
        () =>
            selectedCheckoutAddress
                ? {
                      destination_latitude: selectedCheckoutAddress.latitude,
                      destination_longitude: selectedCheckoutAddress.longitude,
                  }
                : { destination_latitude: null, destination_longitude: null },
        [selectedCheckoutAddress],
    );

    const ratesPricing = useMemo(() => (rates && Array.isArray(rates.pricing) ? rates.pricing : []), [rates]);

    const [isCourierModalOpen, setIsCourierModalOpen] = useRemember(false, 'checkout:isCourierModalOpen');
    const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
    const [isRequestingRates, setIsRequestingRates] = useState(false);
    const [shouldAutoOpenCourier, setShouldAutoOpenCourier] = useRemember(false, 'checkout:shouldAutoOpenCourier');
    const [hasRequestedInitialRates, setHasRequestedInitialRates] = useState(false);
    const [lastRequestedRateKey, setLastRequestedRateKey] = useState<string | null>(null);

    useEffect(() => {
        if (!ratesPricing.length) {
            setSelectedRateId(null);
            return;
        }

        setSelectedRateId((prev) => {
            if (prev && ratesPricing.some((rate) => getRateId(rate) === prev)) {
                return prev;
            }

            return getRateId(ratesPricing[0]);
        });
    }, [ratesPricing]);

    const selectedRate = useMemo(() => {
        if (!ratesPricing.length) return null;
        if (!selectedRateId) return ratesPricing[0];
        return ratesPricing.find((rate) => getRateId(rate) === selectedRateId) ?? ratesPricing[0];
    }, [ratesPricing, selectedRateId]);
    const selectedPaymentMethod = useMemo(() => dummyPayments.find((method) => method.id === selectedPaymentId) ?? null, [selectedPaymentId]);

    const rateItemsPayload = useMemo(
        () =>
            checkoutItems.map((item) => ({
                name: item.name,
                sku: item.id,
                value: item.price,
                quantity: item.quantity,
                weight: item.weight && item.weight > 0 ? item.weight : 1,
            })),
        [checkoutItems],
    );

    const warehouseKey = useMemo(() => {
        if (!warehouse) return null;
        if (typeof warehouse.id === 'string' && warehouse.id.length) {
            return warehouse.id;
        }
        return `${warehouse.latitude ?? ''}-${warehouse.longitude ?? ''}`;
    }, [warehouse]);

    const rateKey = useMemo(() => {
        if (!warehouseKey || !selectedCheckoutAddress) {
            return null;
        }

        return `${warehouseKey}-${selectedCheckoutAddress.id}`;
    }, [selectedCheckoutAddress, warehouseKey]);

    const hasRates = ratesPricing.length > 0;
    const ratesError = rates && typeof rates.code === 'number' && rates.code >= 400 ? 'Tidak dapat memuat opsi pengiriman.' : null;

    useEffect(() => {
        const refreshItems = () => {
            setCheckoutItems(loadStoredCheckoutItems());
        };

        refreshItems();

        const handleStorage = (event: StorageEvent) => {
            if (event.key === CHECKOUT_ITEMS_STORAGE_KEY) {
                refreshItems();
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', refreshItems);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', refreshItems);
        };
    }, []);

    useEffect(() => {
        if (!rateKey) {
            if (hasRequestedInitialRates) {
                setHasRequestedInitialRates(false);
            }
            if (lastRequestedRateKey !== null) {
                setLastRequestedRateKey(null);
            }
            return;
        }

        if (lastRequestedRateKey && lastRequestedRateKey !== rateKey) {
            setHasRequestedInitialRates(false);
        }
    }, [rateKey, lastRequestedRateKey, hasRequestedInitialRates]);

    useEffect(() => {
        if (!shouldAutoOpenCourier) {
            return;
        }

        if (ratesPricing.length > 0) {
            setIsCourierModalOpen(true);
            setShouldAutoOpenCourier(false);
            setIsRequestingRates(false);
        }
    }, [ratesPricing, shouldAutoOpenCourier, setIsCourierModalOpen, setShouldAutoOpenCourier, setIsRequestingRates]);

    const requestRates = useCallback(
        (options: { openModalOnSuccess?: boolean } = {}) => {
            const { openModalOnSuccess = false } = options;
            if (!warehouse) {
                return;
            }

            if (!rateItemsPayload.length) {
                if (openModalOnSuccess) {
                    setIsCourierModalOpen(true);
                }
                return;
            }

            if (!selectedCheckoutAddress) {
                if (usingGuestAddress) {
                    setHasAttemptedGuestRates(true);
                }
                return;
            }

            setIsRequestingRates(true);

            if (openModalOnSuccess) {
                setShouldAutoOpenCourier(true);
                setIsCourierModalOpen(true);
            } else {
                setShouldAutoOpenCourier(false);
            }

            const payload = {
                origin_latitude: Number(warehouse.latitude),
                origin_longitude: Number(warehouse.longitude),
                destination_latitude: Number(selectedCheckoutAddress.latitude),
                destination_longitude: Number(selectedCheckoutAddress.longitude),
                couriers: 'gojek,jne,anteraja',
                items: rateItemsPayload,
            };

            router.post(route('delivery.rates'), payload, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsRequestingRates(false);
                },
            });
        },
        [
            rateItemsPayload,
            selectedCheckoutAddress,
            setHasAttemptedGuestRates,
            setIsCourierModalOpen,
            setShouldAutoOpenCourier,
            usingGuestAddress,
            warehouse,
        ],
    );

    useEffect(() => {
        if (!rateKey) {
            return;
        }

        if (isRequestingRates) {
            return;
        }

        if (!warehouse || !selectedCheckoutAddress || !rateItemsPayload.length) {
            return;
        }

        if (hasRates && lastRequestedRateKey === rateKey) {
            return;
        }

        if (hasRequestedInitialRates && lastRequestedRateKey === rateKey) {
            return;
        }

        setHasRequestedInitialRates(true);
        setLastRequestedRateKey(rateKey);
        requestRates();
    }, [
        rateKey,
        warehouse,
        selectedCheckoutAddress,
        rateItemsPayload,
        hasRates,
        isRequestingRates,
        hasRequestedInitialRates,
        lastRequestedRateKey,
        requestRates,
    ]);

    const handleShippingButtonClick = useCallback(() => {
        if (hasRates) {
            setShouldAutoOpenCourier(false);
            setIsCourierModalOpen(true);
            return;
        }

        if (rateKey) {
            setHasRequestedInitialRates(true);
            setLastRequestedRateKey(rateKey);
        }

        requestRates({ openModalOnSuccess: true });
    }, [hasRates, rateKey, requestRates, setIsCourierModalOpen, setShouldAutoOpenCourier, setHasRequestedInitialRates, setLastRequestedRateKey]);

    const handleSelectRate = useCallback(
        (rate: IRatePricing) => {
            setSelectedRateId(getRateId(rate));
            setIsCourierModalOpen(false);
            setShouldAutoOpenCourier(false);
        },
        [setIsCourierModalOpen, setShouldAutoOpenCourier],
    );
    const handleSelectPaymentMethod = useCallback(
        (methodId: string) => {
            setSelectedPaymentId(methodId);
            setExpandedPaymentId(methodId);

            const method = dummyPayments.find((item) => item.id === methodId);
            if (method?.children?.length) {
                setSelectedBankPaymentId((prev) => {
                    if (prev && method.children?.some((child) => child.id === prev)) {
                        return prev;
                    }
                    const fallbackChild = method.children.find((child) => child.selected) ?? method.children[0];
                    return fallbackChild?.id ?? null;
                });
            } else {
                setSelectedBankPaymentId(null);
            }
        },
        [setSelectedPaymentId, setSelectedBankPaymentId, setExpandedPaymentId],
    );
    const handleSelectBankPayment = useCallback((bankId: string) => {
        setSelectedBankPaymentId(bankId);
    }, []);

    const subtotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const protection = checkoutItems.reduce((total, item) => total + (item.protectionPrice ?? 0), 0);
    const shipping = selectedRate?.price ?? 0;
    const insurance = 0;
    const total = subtotal + protection + shipping + insurance;
    const hasCheckoutItems = checkoutItems.length > 0;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [checkoutResult, setCheckoutResult] = useState<IRootCheckoutOrderMidtrans | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const midtransClientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '';
    const midtransSnapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL ?? 'https://app.sandbox.midtrans.com/snap/snap.js';
    const [isSnapReady, setIsSnapReady] = useState<boolean>(() => typeof window !== 'undefined' && Boolean(window.snap?.pay));
    const requiresBankSelection = Boolean(selectedPaymentMethod?.children?.length);
    const canSubmit = Boolean(hasCheckoutItems && selectedRate && selectedPaymentId && (!requiresBankSelection || selectedBankPaymentId));

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!midtransClientKey) return;

        if (window.snap && typeof window.snap.pay === 'function') {
            setIsSnapReady(true);
            return;
        }

        const scriptId = 'midtrans-snap-script';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        const handleLoad = () => {
            setIsSnapReady(true);
        };

        const handleError = () => {
            setCheckoutError((prev) => prev ?? 'Failed to load payment gateway. Please refresh and try again.');
        };

        if (existingScript) {
            existingScript.addEventListener('load', handleLoad);
            existingScript.addEventListener('error', handleError);

            return () => {
                existingScript.removeEventListener('load', handleLoad);
                existingScript.removeEventListener('error', handleError);
            };
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = midtransSnapUrl;
        script.async = true;
        script.dataset.clientKey = midtransClientKey;
        script.onload = handleLoad;
        script.onerror = handleError;
        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
            script.removeEventListener('error', handleError);
        };
    }, [midtransClientKey, midtransSnapUrl, setCheckoutError]);

    const handleModalChange = useCallback(
        (nextOpen: boolean) => {
            setIsModalOpen(nextOpen);
            setIsChangeAddressOpen(false);
            if (!nextOpen) {
                route('checkout.page');
            }
        },
        [setIsModalOpen],
    );

    const [selectedId, setSelectedId] = useState('');
    const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<IDeliveryAddress | null>(null);

    const editAddressHandler = (addr: IDeliveryAddress) => {
        setSelectedId(addr.id);
        setSelectedDeliveryAddress(addr);
        setIsModalOpen(true);
    };

    const handlePayNow = useCallback(async () => {
        if (!selectedCheckoutAddress || !selectedRate || !selectedPaymentId || !checkoutItems.length) {
            if (!selectedCheckoutAddress && usingGuestAddress) {
                setHasAttemptedGuestCheckout(true);
            }
            return;
        }

        const bankPaymentValue = selectedPaymentMethod?.children?.length && selectedBankPaymentId ? selectedBankPaymentId : null;

        if (selectedPaymentMethod?.children?.length && !bankPaymentValue) {
            return;
        }

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        const itemsPayload = checkoutItems.map((item) => ({
            product_id: item.productId ?? null,
            product_name: item.name,
            product_description: item.variant ?? null,
            product_image: item.image ?? null,
            quantity: item.quantity,
            price: item.price,
        }));

        const payload = {
            payment_method: selectedPaymentId,
            bank_payment: bankPaymentValue,
            courier_code: selectedRate.courier_code,
            courier_name: selectedRate.courier_name,
            courier_service: selectedRate.courier_service_code,
            courier_service_name: selectedRate.courier_service_name,
            shipping_fee: Number(selectedRate.price ?? 0),
            shipping_duration_range: selectedRate.shipment_duration_range ?? selectedRate.duration ?? null,
            shipping_duration_unit: selectedRate.shipment_duration_unit ?? null,
            receiver_name: selectedCheckoutAddress.contact_name,
            receiver_phone: selectedCheckoutAddress.contact_phone,
            receiver_address: selectedCheckoutAddress.address,
            receiver_postal_code: selectedCheckoutAddress.postal_code,
            receiver_city: selectedCheckoutAddress.city,
            receiver_province: selectedCheckoutAddress.province,
            items: itemsPayload,
            ...(usingGuestAddress
                ? {
                      buyer_name: guestContact.fullName.trim(),
                      buyer_email: guestContact.email.trim(),
                      buyer_phone: guestContact.phone.trim(),
                      guest_address_label: guestAddressForm.label.trim() || undefined,
                      guest_notes: guestAddressForm.notes.trim() || undefined,
                      guest_checkout: true,
                  }
                : {}),
        };

        setIsSubmitting(true);
        setCheckoutError(null);
        setCheckoutResult(null);
        setIsPaymentModalOpen(false);

        try {
            const response = await fetch(route('order.checkout'), {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get('content-type') ?? '';
            const isJson = contentType.includes('application/json');

            if (!response.ok) {
                if (isJson) {
                    const errorBody = await response.json();
                    const errorMessage =
                        (typeof errorBody?.message === 'string' && errorBody.message.length ? errorBody.message : null) ??
                        'Checkout failed. Please try again.';
                    setCheckoutError(errorMessage);
                } else {
                    const errorText = await response.text();
                    setCheckoutError(errorText || 'Checkout failed. Please try again.');
                }
                return;
            }

            if (isJson) {
                const data = (await response.json()) as IRootCheckoutOrderMidtrans;
                setCheckoutResult(data);

                const snapToken = data?.token;
                const redirectUrl = data?.redirect_url;
                const clearCheckoutStorage = () => sessionStorage.removeItem(CHECKOUT_ITEMS_STORAGE_KEY);

                if (snapToken && typeof window !== 'undefined' && window.snap?.pay) {
                    window.snap.pay(snapToken, {
                        onSuccess: () => {
                            clearCheckoutStorage();
                        },
                        onPending: () => {
                            clearCheckoutStorage();
                        },
                        onError: (result) => {
                            console.error('Midtrans Snap error', result);
                            setCheckoutError('Payment failed. Please try again or choose another method.');
                        },
                        onClose: () => {
                            setCheckoutError('Payment popup was closed before the transaction was completed.');
                        },
                    });
                } else if (redirectUrl) {
                    clearCheckoutStorage();
                    window.location.href = redirectUrl;
                } else if (!midtransClientKey) {
                    setCheckoutError('Midtrans client key is missing. Please contact support.');
                } else if (!isSnapReady) {
                    setCheckoutError('Payment gateway is still loading. Please wait a moment and try again.');
                } else {
                    setCheckoutError('Unable to start the payment process. Please refresh and try again.');
                }

                return;
            } else {
                await response.text();
                sessionStorage.removeItem(CHECKOUT_ITEMS_STORAGE_KEY);
            }
        } catch (error) {
            const fallbackError = error instanceof Error ? error.message : 'Unexpected error';
            setCheckoutError(`Checkout failed. ${fallbackError}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        checkoutItems,
        selectedCheckoutAddress,
        selectedPaymentId,
        selectedRate,
        selectedBankPaymentId,
        selectedPaymentMethod,
        isSnapReady,
        midtransClientKey,
        usingGuestAddress,
        guestContact,
        guestAddressForm,
        setHasAttemptedGuestCheckout,
    ]);

    return (
        <>
            <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
                </div>
                <div className="mb-2">
                    <Link href={auth.user ? `/view-cart/${auth.user.id}` : `/view-cart`}>
                        <span className="cursor-pointer underline">Back to Cart</span>
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <Card
                            className="gap-4 border border-border/60 bg-background shadow-sm"
                            data-destination-latitude={addressInformation.destination_latitude ?? ''}
                            data-destination-longitude={addressInformation.destination_longitude ?? ''}
                        >
                            <CardHeader className="flex flex-col gap-4 py-0 pt-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Delivery Address</div>
                                        <p className="text-sm text-muted-foreground">
                                            {usingGuestAddress
                                                ? 'Enter your contact and delivery details to continue without signing in.'
                                                : 'Review your saved addresses or switch to a different one before checkout.'}
                                        </p>
                                    </div>
                                    {!usingGuestAddress ? (
                                        <Dialog open={isChangeAddressOpen} onOpenChange={setIsChangeAddressOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={!addresses.length}>
                                                    Change
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-xl">
                                                <DialogHeader className="space-y-1">
                                                    <DialogTitle>Pick Delivery Address</DialogTitle>
                                                    <DialogDescription>Select one of the saved addresses to use for this order.</DialogDescription>
                                                </DialogHeader>
                                                <Button onClick={() => setIsModalOpen(true)} className="mb-4">
                                                    Add Delivery Address
                                                </Button>
                                                <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
                                                    {addresses.length ? (
                                                        addresses.map((address) => {
                                                            const isSelected = address.id === selectedAddress?.id;

                                                            return (
                                                                <div
                                                                    key={address.id}
                                                                    role="button"
                                                                    onClick={() => {
                                                                        setSelectedAddress(address);
                                                                        setIsChangeAddressOpen(false);
                                                                    }}
                                                                    className={`w-full rounded-lg border bg-background p-4 text-left transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5'
                                                                            : 'border-border/60 hover:border-primary/40'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex flex-1 items-start gap-3">
                                                                            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                                                <MapPin className="h-4 w-4" />
                                                                            </span>
                                                                            <div className="space-y-1 text-sm">
                                                                                <div className="font-semibold text-foreground capitalize">
                                                                                    {address.name} • {address.contact_name}
                                                                                </div>
                                                                                <p className="text-sm leading-relaxed text-muted-foreground">
                                                                                    {address.address}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {address.contact_phone}
                                                                                </p>
                                                                                <Button
                                                                                    onClick={() => editAddressHandler(address)}
                                                                                    className="mt-4 pl-0"
                                                                                    variant="link"
                                                                                >
                                                                                    Edit Address
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                                                <Check className="h-4 w-4" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            You don't have any shipping addresses saved yet.
                                                        </p>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-6">
                                {usingGuestAddress ? (
                                    <div className="space-y-8">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <MapPin className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        We will use these details for shipping updates and delivery coordination.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-full-name">Full Name *</Label>
                                                    <Input
                                                        id="guest-full-name"
                                                        value={guestContact.fullName}
                                                        onChange={(event) => setGuestContact((prev) => ({ ...prev, fullName: event.target.value }))}
                                                        placeholder="Jane Doe"
                                                        aria-invalid={showGuestFormError && guestFieldStatus.fullNameMissing ? 'true' : undefined}
                                                    />
                                                    {showGuestFormError && guestFieldStatus.fullNameMissing ? (
                                                        <p className="text-xs text-destructive">Enter the recipient name.</p>
                                                    ) : null}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-email">Email *</Label>
                                                    <Input
                                                        id="guest-email"
                                                        type="email"
                                                        value={guestContact.email}
                                                        onChange={(event) => setGuestContact((prev) => ({ ...prev, email: event.target.value }))}
                                                        placeholder="jane@example.com"
                                                        aria-invalid={showGuestFormError && guestFieldStatus.emailMissing ? 'true' : undefined}
                                                    />
                                                    {showGuestFormError && guestFieldStatus.emailMissing ? (
                                                        <p className="text-xs text-destructive">
                                                            Provide an email so we can send the order confirmation.
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-phone">Phone Number *</Label>
                                                    <Input
                                                        id="guest-phone"
                                                        value={guestContact.phone}
                                                        onChange={(event) => setGuestContact((prev) => ({ ...prev, phone: event.target.value }))}
                                                        placeholder="+62 812 3456 7890"
                                                        aria-invalid={showGuestFormError && guestFieldStatus.phoneMissing ? 'true' : undefined}
                                                    />
                                                    {showGuestFormError && guestFieldStatus.phoneMissing ? (
                                                        <p className="text-xs text-destructive">Add an active phone number for the courier.</p>
                                                    ) : null}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-address-label">Address Label</Label>
                                                    <Input
                                                        id="guest-address-label"
                                                        value={guestAddressForm.label}
                                                        onChange={(event) => setGuestAddressForm((prev) => ({ ...prev, label: event.target.value }))}
                                                        placeholder="Home, Office, etc."
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-base font-semibold text-foreground">Shipping Address</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="guest-address-line">Street Address *</Label>
                                                <textarea
                                                    id="guest-address-line"
                                                    value={guestAddressForm.address}
                                                    onChange={(event) => setGuestAddressForm((prev) => ({ ...prev, address: event.target.value }))}
                                                    placeholder="Street name, house number, building, unit, etc."
                                                    aria-invalid={showGuestFormError && guestFieldStatus.addressMissing ? 'true' : undefined}
                                                    className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                                {showGuestFormError && guestFieldStatus.addressMissing ? (
                                                    <p className="text-xs text-destructive">Enter the full delivery address.</p>
                                                ) : null}
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-country">Country</Label>
                                                    <select
                                                        id="guest-country"
                                                        value={guestAddressForm.country}
                                                        onChange={(event) => handleCountryChange(event.target.value)}
                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">Select Country</option>
                                                        {countries.map((country) => (
                                                            <option key={country.code} value={country.code}>
                                                                {country.flag} {country.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-province">Province / State *</Label>
                                                    <select
                                                        id="guest-province"
                                                        value={guestAddressForm.provinceCode}
                                                        onChange={(event) => handleProvinceChange(event.target.value)}
                                                        aria-invalid={showGuestFormError && guestFieldStatus.provinceMissing ? 'true' : undefined}
                                                        disabled={isLoadingProvinces}
                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">Select Province</option>
                                                        {provinceOptions.map((province) => (
                                                            <option key={province.value} value={province.value}>
                                                                {province.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {isLoadingProvinces ? (
                                                        <p className="text-xs text-muted-foreground">Loading provinces...</p>
                                                    ) : guestAddressForm.country && !provinceOptions.length ? (
                                                        <p className="text-xs text-muted-foreground">No province available for this country.</p>
                                                    ) : null}
                                                    {showGuestFormError && guestFieldStatus.provinceMissing ? (
                                                        <p className="text-xs text-destructive">Select the province or state.</p>
                                                    ) : null}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-city">City *</Label>
                                                    <select
                                                        id="guest-city"
                                                        value={guestAddressForm.cityCode}
                                                        onChange={(event) => handleCityChange(event.target.value)}
                                                        aria-invalid={showGuestFormError && guestFieldStatus.cityMissing ? 'true' : undefined}
                                                        disabled={isLoadingCities || !guestAddressForm.provinceCode}
                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">
                                                            {guestAddressForm.provinceCode ? 'Select City' : 'Select a province first'}
                                                        </option>
                                                        {cityOptions.map((city) => (
                                                            <option key={city.value} value={city.value}>
                                                                {city.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {isLoadingCities ? (
                                                        <p className="text-xs text-muted-foreground">Loading cities...</p>
                                                    ) : guestAddressForm.provinceCode && !cityOptions.length ? (
                                                        <p className="text-xs text-muted-foreground">No city found for this province.</p>
                                                    ) : null}
                                                    {showGuestFormError && guestFieldStatus.cityMissing ? (
                                                        <p className="text-xs text-destructive">Select the destination city.</p>
                                                    ) : null}
                                                </div>
                                                {isIndonesiaAddress ? (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="guest-district">District *</Label>
                                                        <select
                                                            id="guest-district"
                                                            value={guestAddressForm.districtCode}
                                                            onChange={(event) => handleDistrictChange(event.target.value)}
                                                            aria-invalid={showGuestFormError && guestFieldStatus.districtMissing ? 'true' : undefined}
                                                            disabled={isLoadingDistricts || !guestAddressForm.cityCode}
                                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="">
                                                                {guestAddressForm.cityCode ? 'Select District' : 'Select a city first'}
                                                            </option>
                                                            {districtOptions.map((district) => (
                                                                <option key={district.value} value={district.value}>
                                                                    {district.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isLoadingDistricts ? (
                                                            <p className="text-xs text-muted-foreground">Loading districts...</p>
                                                        ) : guestAddressForm.cityCode && !districtOptions.length ? (
                                                            <p className="text-xs text-muted-foreground">No district found for this city.</p>
                                                        ) : null}
                                                        {showGuestFormError && guestFieldStatus.districtMissing ? (
                                                            <p className="text-xs text-destructive">Select the district.</p>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                                {isIndonesiaAddress ? (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="guest-village">Village *</Label>
                                                        <select
                                                            id="guest-village"
                                                            value={guestAddressForm.villageCode}
                                                            onChange={(event) => handleVillageChange(event.target.value)}
                                                            aria-invalid={showGuestFormError && guestFieldStatus.villageMissing ? 'true' : undefined}
                                                            disabled={isLoadingVillages || !guestAddressForm.districtCode}
                                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="">
                                                                {guestAddressForm.districtCode ? 'Select Village' : 'Select a district first'}
                                                            </option>
                                                            {villageOptions.map((village) => (
                                                                <option key={village.value} value={village.value}>
                                                                    {village.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isLoadingVillages ? (
                                                            <p className="text-xs text-muted-foreground">Loading villages...</p>
                                                        ) : guestAddressForm.districtCode && !villageOptions.length ? (
                                                            <p className="text-xs text-muted-foreground">No village found for this district.</p>
                                                        ) : null}
                                                        {showGuestFormError && guestFieldStatus.villageMissing ? (
                                                            <p className="text-xs text-destructive">Select the village.</p>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                                <div className="space-y-2">
                                                    <Label htmlFor="guest-postal-code">Postal Code *</Label>
                                                    <select
                                                        id="guest-postal-code"
                                                        value={guestAddressForm.postalCode}
                                                        onChange={(event) => handlePostalCodeChange(event.target.value)}
                                                        aria-invalid={showGuestFormError && guestFieldStatus.postalCodeMissing ? 'true' : undefined}
                                                        disabled={isLoadingPostalCodes || (!postalCodeOptions.length && !guestAddressForm.postalCode)}
                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">
                                                            {isIndonesiaAddress
                                                                ? guestAddressForm.villageCode || guestAddressForm.districtCode
                                                                    ? 'Select Postal Code'
                                                                    : 'Select a village first'
                                                                : guestAddressForm.cityCode
                                                                  ? 'Select Postal Code'
                                                                  : 'Select a city first'}
                                                        </option>
                                                        {postalCodeOptions.map((code) => (
                                                            <option key={code} value={code}>
                                                                {code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {isLoadingPostalCodes ? (
                                                        <p className="text-xs text-muted-foreground">Loading postal codes...</p>
                                                    ) : postalCodeOptions.length === 0 &&
                                                      (isIndonesiaAddress
                                                          ? Boolean(guestAddressForm.villageCode || guestAddressForm.districtCode)
                                                          : Boolean(guestAddressForm.cityCode)) ? (
                                                        <p className="text-xs text-muted-foreground">No postal code found for the selected area.</p>
                                                    ) : null}
                                                    {showGuestFormError && guestFieldStatus.postalCodeMissing ? (
                                                        <p className="text-xs text-destructive">Select the postal code.</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="guest-notes">Delivery Notes (optional)</Label>
                                                <textarea
                                                    id="guest-notes"
                                                    value={guestAddressForm.notes}
                                                    onChange={(event) => setGuestAddressForm((prev) => ({ ...prev, notes: event.target.value }))}
                                                    placeholder="Gate code, preferred delivery time, etc."
                                                    className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-base font-semibold text-foreground">Pin Delivery Location</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Drag the marker or search for an address to set accurate coordinates for your delivery.
                                            </p>
                                            <div className="space-y-4">
                                                <div className="h-[320px] w-full overflow-hidden rounded-lg border border-border/60">
                                                    <MapLocationPicker
                                                        value={guestLocationValue}
                                                        onChange={(value) =>
                                                            setGuestAddressForm((prev) => {
                                                                const shouldReplaceAddress = prev.address.trim().length === 0 && value.address;
                                                                return {
                                                                    ...prev,
                                                                    latitude: value.lat.toFixed(6),
                                                                    longitude: value.lng.toFixed(6),
                                                                    address: shouldReplaceAddress ? (value.address ?? prev.address) : prev.address,
                                                                };
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="hidden gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="guest-latitude">Latitude *</Label>
                                                        <Input
                                                            id="guest-latitude"
                                                            value={guestAddressForm.latitude}
                                                            onChange={(event) =>
                                                                setGuestAddressForm((prev) => ({ ...prev, latitude: event.target.value }))
                                                            }
                                                            placeholder="-6.200000"
                                                            aria-invalid={showGuestFormError && guestFieldStatus.latitudeMissing ? 'true' : undefined}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="guest-longitude">Longitude *</Label>
                                                        <Input
                                                            id="guest-longitude"
                                                            value={guestAddressForm.longitude}
                                                            onChange={(event) =>
                                                                setGuestAddressForm((prev) => ({ ...prev, longitude: event.target.value }))
                                                            }
                                                            placeholder="106.816666"
                                                            aria-invalid={
                                                                showGuestFormError && guestFieldStatus.longitudeMissing ? 'true' : undefined
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                {showGuestFormError && (guestFieldStatus.latitudeMissing || guestFieldStatus.longitudeMissing) ? (
                                                    <p className="text-xs text-destructive">
                                                        Set the delivery pin on the map so we can calculate shipping rates.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </section>

                                        {showGuestFormError ? (
                                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                                Complete the required fields above before requesting shipping rates or paying for the order.
                                            </div>
                                        ) : null}

                                        {!isGuest && addresses.length === 0 ? (
                                            <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
                                                Want to save this address for future orders?{' '}
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="px-0 font-semibold"
                                                    onClick={() => setIsModalOpen(true)}
                                                >
                                                    Add Delivery Address
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="flex gap-3 text-sm">
                                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </span>
                                        <div>
                                            {selectedCheckoutAddress ? (
                                                <>
                                                    <div className="font-semibold text-foreground capitalize">
                                                        {selectedCheckoutAddress.name} • {selectedCheckoutAddress.contact_name}
                                                    </div>
                                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                        {selectedCheckoutAddress.address}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">{selectedCheckoutAddress.contact_phone}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">There is no delivery address yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="gap-4 border border-border/60 bg-background shadow-sm">
                            <CardHeader className="flex-row items-start justify-between gap-4 py-0 pt-6">
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Shipping Method</div>
                                    {selectedRate ? (
                                        <div className="space-y-1 text-sm">
                                            <div className="font-semibold text-foreground">
                                                {selectedRate.courier_name} • {selectedRate.courier_service_name}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedRate.description ?? 'Layanan pengiriman tersedia untuk alamat kamu.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-sm">
                                            <p className="text-muted-foreground">Select the delivery service available for your address.</p>
                                            {ratesError ? <p className="text-xs text-destructive">{ratesError}</p> : null}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShippingButtonClick}
                                    disabled={isRequestingRates || !warehouse || !hasCheckoutItems}
                                >
                                    {isRequestingRates ? 'Loading...' : hasRates ? 'Change' : 'Load Rates'}
                                </Button>
                            </CardHeader>
                            {selectedRate ? (
                                <CardContent className="space-y-3 pt-0 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedRate.service_type ? (
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase">
                                                {selectedRate.service_type}
                                            </span>
                                        ) : null}
                                        {selectedRate.shipping_type ? (
                                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                                {selectedRate.shipping_type}
                                            </span>
                                        ) : null}
                                    </div>
                                    {selectedRate.shipment_duration_range || selectedRate.duration ? (
                                        <p className="text-xs text-muted-foreground">
                                            Estimasi {selectedRate.shipment_duration_range ?? selectedRate.duration}{' '}
                                            {selectedRate.shipment_duration_unit ?? ''}
                                        </p>
                                    ) : null}
                                    <p className="text-base font-semibold text-foreground">{formatCurrency(selectedRate.price)}</p>
                                    {selectedRate.available_for_insurance ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <ShieldCheck className="h-4 w-4" />
                                            Available for Insurance
                                        </div>
                                    ) : null}
                                    {selectedRate.available_for_cash_on_delivery ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CurrencyIcon className="h-4 w-4" />
                                            Available for Cash on Delivery
                                        </div>
                                    ) : null}
                                    {selectedRate.available_for_instant_waybill_id ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <ReceiptText className="h-4 w-4" />
                                            Available for Instant Waybill
                                        </div>
                                    ) : null}
                                    {selectedRate.available_for_proof_of_delivery ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <PackageCheck className="h-4 w-4" />
                                            Available for Proof of Delivery
                                        </div>
                                    ) : null}
                                </CardContent>
                            ) : null}
                        </Card>

                        {!hasCheckoutItems ? (
                            <Card className="border border-border/60 bg-background shadow-sm">
                                <CardContent className="flex flex-col items-center gap-4 py-10 text-center text-sm text-muted-foreground">
                                    <p>No items selected for checkout.</p>
                                    <Button variant="outline" onClick={() => window.history.back()}>
                                        Back to Cart
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}

                        {checkoutItems.map((item) => (
                            <Card key={item.id} className="gap-6 border border-border/60 bg-background shadow-sm">
                                <CardHeader className="flex-col gap-3 pb-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                                            <BadgeCheck className="h-4 w-4" />
                                            {item.store}
                                        </div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {item.quantity} x {formatCurrency(item.price)}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                                            <img src={item.image ?? FALLBACK_IMAGE} alt={item.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h2 className="text-base font-semibold text-foreground sm:text-lg">{item.name}</h2>
                                                {item.variant ? <p className="text-sm text-muted-foreground">{item.variant}</p> : null}
                                            </div>
                                            {item.protectionLabel ? (
                                                <button className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    {item.protectionLabel}
                                                    <span className="font-normal text-muted-foreground">
                                                        ({formatCurrency(item.protectionPrice ?? 0)})
                                                    </span>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-28">
                        <Card className="gap-0 border border-border/60 bg-background shadow-sm">
                            <CardHeader className="flex-row items-center justify-between gap-3 py-6">
                                <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-3">
                                    {dummyPayments.map((method) => {
                                        const hasChildren = Array.isArray(method.children) && method.children.length > 0;
                                        const isSelected = method.id === selectedPaymentId;
                                        const isExpanded = hasChildren && expandedPaymentId === method.id;

                                        return (
                                            <div
                                                key={method.id}
                                                className={`rounded-xl border border-border/70 bg-muted/20 transition hover:border-primary/50 hover:bg-background ${
                                                    isSelected ? 'border-primary bg-background shadow-sm' : ''
                                                } ${isExpanded ? 'ring-1 ring-primary/40' : ''}`}
                                            >
                                                <label
                                                    htmlFor={`payment-${method.id}`}
                                                    className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3"
                                                >
                                                    <input
                                                        type="radio"
                                                        id={`payment-${method.id}`}
                                                        name="payment-method"
                                                        className="hidden"
                                                        value={method.id}
                                                        checked={isSelected}
                                                        onChange={() => handleSelectPaymentMethod(method.id)}
                                                    />
                                                    <span className="flex items-center gap-3">
                                                        <span
                                                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${method.accent}`}
                                                        >
                                                            {method.name.slice(0, 2).toUpperCase()}
                                                        </span>
                                                        <span className="text-sm font-medium text-foreground">{method.name}</span>
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        {hasChildren ? (
                                                            <ChevronDown
                                                                aria-hidden="true"
                                                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                                                    isExpanded ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        ) : null}
                                                        <span
                                                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                                                isSelected ? 'border-primary' : 'border-border'
                                                            }`}
                                                        >
                                                            {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                        </span>
                                                    </span>
                                                </label>
                                                {hasChildren ? (
                                                    <div
                                                        className={`${isExpanded ? 'block' : 'hidden'} border-t border-border/60 bg-muted/10 px-4 py-3`}
                                                    >
                                                        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Select Bank</p>
                                                        <div className="space-y-2">
                                                            {method.children?.map((child) => {
                                                                const isChildSelected = isSelected && selectedBankPaymentId === child.id;

                                                                return (
                                                                    <label
                                                                        key={child.id}
                                                                        htmlFor={`payment-${method.id}-${child.id}`}
                                                                        className={`flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition hover:bg-background ${
                                                                            isChildSelected
                                                                                ? 'border-primary bg-background text-foreground'
                                                                                : 'text-muted-foreground'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            id={`payment-${method.id}-${child.id}`}
                                                                            name={`payment-${method.id}-bank`}
                                                                            className="hidden"
                                                                            value={child.id}
                                                                            checked={isChildSelected}
                                                                            onChange={() => {
                                                                                handleSelectPaymentMethod(method.id);
                                                                                handleSelectBankPayment(child.id);
                                                                            }}
                                                                        />
                                                                        <span>{child.name}</span>
                                                                        <span
                                                                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                                                                isChildSelected ? 'border-primary bg-primary/10' : 'border-border'
                                                                            }`}
                                                                        >
                                                                            {isChildSelected && (
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                            )}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="gap-4 border border-primary/40 bg-background shadow-md">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-lg font-semibold text-foreground">Transaction Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Shipping Rates</span>
                                    <span className="font-medium text-foreground">{selectedRate ? formatCurrency(shipping) : '—'}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-6">
                                <div className="flex w-full items-center justify-between text-base font-semibold text-foreground">
                                    <span>Total Transaction</span>
                                    <span className="text-xl">{formatCurrency(total)}</span>
                                </div>
                                <Button
                                    size="lg"
                                    className="h-12 w-full text-base font-semibold"
                                    disabled={!canSubmit || isSubmitting}
                                    onClick={handlePayNow}
                                >
                                    {isSubmitting ? 'Processing...' : 'Pay Now'}
                                </Button>
                                {checkoutError ? <p className="text-center text-sm text-destructive">{checkoutError}</p> : null}
                                {checkoutResult && !checkoutError ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        <p className="font-semibold">Checkout successful.</p>
                                        {/* <p className="mt-1">
                                            {paymentExpiry
                                                ? `Please scan the QR code and complete your payment before ${paymentExpiry}.`
                                                : 'Follow the payment instructions to complete your order.'}{' '}
                                            You can refresh this page after payment is confirmed.
                                        </p> */}
                                    </div>
                                ) : null}
                                {/* <p className="text-center text-xs leading-relaxed text-muted-foreground">
                                    Dengan melanjutkan pembayaran, kamu menyetujui S&amp;K Asuransi Pengiriman &amp; Proteksi.
                                </p> */}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
            <CourierListModal
                open={isCourierModalOpen}
                onOpenChange={(open) => {
                    setIsCourierModalOpen(open);
                    if (!open) {
                        setShouldAutoOpenCourier(false);
                    }
                }}
                rates={ratesPricing}
                selectedRateId={selectedRateId ?? undefined}
                onSelect={handleSelectRate}
                isLoading={isRequestingRates && !hasRates}
            />
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-semibold">Scan &amp; Pay</DialogTitle>
                        <DialogDescription className="text-center">
                            Use your favourite payment app to scan this QR code and finish the transaction.
                        </DialogDescription>
                    </DialogHeader>
                    {/* {qrCodeUrl ? (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4">
                                    <img src={qrCodeUrl} alt="Midtrans QR Code" className="h-64 w-64 max-w-full rounded-md object-contain" />
                                </div>
                                <div className="text-center text-sm text-muted-foreground">
                                    {paymentExpiry ? `QR code expires at ${paymentExpiry}.` : 'Complete the payment before the QR code expires.'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            We could not load the QR code from Midtrans. Please review your order status from your account page.
                        </div>
                    )} */}
                </DialogContent>
            </Dialog>
        </>
    );
}
