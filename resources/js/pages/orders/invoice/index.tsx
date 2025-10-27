import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type IInvoice,
    type IInvoiceItem,
    type IInvoicesPaginated,
    type IProductOption,
    type IProducts,
    type SharedData,
} from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Download, Loader2, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoice',
        href: '/orders/invoice',
    },
];

const perPageOptions = [10, 15, 25, 50];

const statusFilterOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'issued', label: 'Issued' },
    { value: 'draft', label: 'Draft' },
    { value: 'void', label: 'Void' },
];

type InvoiceFilters = {
    q?: string;
    status?: string;
    per_page?: number | string;
    page?: number | string;
    sort_by?: string;
    sort_dir?: string;
    issued_from?: string;
    issued_to?: string;
};

type InvoiceItemDraft = {
    key: string;
    product_id: string;
    quantity: number;
    price: number | '';
    category_id?: string;
    sub_category_id?: string;
    division_id?: string;
    variant_id?: string;
};

type InvoiceFormData = {
    invoice_number: string;
    status: 'draft' | 'issued';
    issued_at: string;
    due_at: string;
    bill_to_name: string;
    bill_to_email: string;
    bill_to_phone: string;
    bill_to_address: string;
    bill_to_city: string;
    bill_to_province: string;
    bill_to_postal_code: string;
    bill_to_country: string;
    bill_to_country_code: string;
    bill_to_province_code: string;
    bill_to_city_code: string;
    bill_to_district: string;
    bill_to_district_code: string;
    bill_to_village: string;
    bill_to_village_code: string;
    discount_total: number;
    tax_total: number;
    shipping_total: number;
    payment_method: string;
    courier_code: string;
    courier_name: string;
    courier_service: string;
    courier_service_name: string;
    shipping_duration_range: string;
    shipping_duration_unit: string;
    latitude: string;
    longitude: string;
    biteship_destination_id: string;
    items: InvoiceItemDraft[];
};

type LocationOption = {
    value: string;
    label: string;
};

type CountryOption = {
    code: string;
    name: string;
    flag?: string;
};

function formatCurrency(value?: number | string | null) {
    const numeric = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numeric);
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function statusVariant(status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch ((status ?? '').toLowerCase()) {
        case 'issued':
            return 'default';
        case 'draft':
            return 'secondary';
        case 'void':
            return 'destructive';
        default:
            return 'outline';
    }
}

function statusLabel(status?: string | null) {
    switch ((status ?? '').toLowerCase()) {
        case 'issued':
            return 'Issued';
        case 'draft':
            return 'Draft';
        case 'void':
            return 'Void';
        default:
            return 'Unknown';
    }
}

function formatInputDateTime(date: Date) {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function generateDraftKey() {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10);
}

function createDraftItem(): InvoiceItemDraft {
    return {
        key: generateDraftKey(),
        product_id: '',
        quantity: 1,
        price: '',
        category_id: '',
        sub_category_id: '',
        division_id: '',
        variant_id: '',
    };
}

function createInitialFormData(): InvoiceFormData {
    return {
        invoice_number: '',
        status: 'issued',
        issued_at: formatInputDateTime(new Date()),
        due_at: '',
        bill_to_name: '',
        bill_to_email: '',
        bill_to_phone: '',
        bill_to_address: '',
        bill_to_city: '',
        bill_to_province: '',
        bill_to_district: '',
        bill_to_village: '',
        bill_to_postal_code: '',
        bill_to_country: 'Indonesia',
        bill_to_country_code: 'ID',
        bill_to_province_code: '',
        bill_to_city_code: '',
        bill_to_district_code: '',
        bill_to_village_code: '',
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        payment_method: 'manual_invoice',
        courier_code: 'manual',
        courier_name: 'Manual Delivery',
        courier_service: 'manual',
        courier_service_name: 'Manual Delivery',
        shipping_duration_range: '',
        shipping_duration_unit: '',
        latitude: '',
        longitude: '',
        biteship_destination_id: '',
        items: [createDraftItem()],
    };
}

function normalizeLocationOptions(data: unknown): LocationOption[] {
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null;
            }
            const record = entry as Record<string, unknown>;
            const label = typeof record.name === 'string' ? record.name : '';
            const value =
                (typeof record.code === 'string' && record.code) ||
                (typeof record.id === 'string' && record.id) ||
                (typeof record.geoname_id === 'string' && record.geoname_id) ||
                '';

            if (!label || !value) {
                return null;
            }

            return { value, label };
        })
        .filter((option): option is LocationOption => Boolean(option))
        .sort((a, b) => a.label.localeCompare(b.label));
}

function formatCountryLabel(country: CountryOption) {
    return [country.flag, country.name].filter(Boolean).join(' ').trim() || country.name;
}

function applyPercentageDiscount(amount: number, percentage?: number | null): number {
    const normalizedAmount = Number.isFinite(amount) ? amount : 0;
    const normalizedPercentage = typeof percentage === 'number' ? percentage : 0;

    if (normalizedAmount <= 0 || normalizedPercentage <= 0) {
        return Math.round(normalizedAmount);
    }

    return Math.round(normalizedAmount - (normalizedAmount * normalizedPercentage) / 100);
}

function calculateProductPrice(
    product: IProducts,
    options: {
        subCategoryId?: string | null;
        divisionId?: string | null;
        variantId?: string | null;
    },
): number {
    const basePrice = Number(product.product_price ?? 0);
    const productDiscount = Number(product.product_discount ?? 0);

    const subCategory = options.subCategoryId ? product.subcategories.find((item) => item.id === options.subCategoryId) : undefined;
    const division = options.divisionId ? product.divisions.find((item) => item.id === options.divisionId) : undefined;
    const variant = options.variantId ? product.variants.find((item) => item.id === options.variantId) : undefined;

    const extraSubcategoryPrice = Number(subCategory?.price ?? 0);
    const extraDivisionPrice = Number(division?.price ?? 0);
    const extraVariantPrice = Number(variant?.price ?? 0);

    const extraSubcategoryDiscount =
        subCategory?.pivot?.use_subcategory_discount === 1 ? Number(subCategory?.discount ?? 0) : Number(subCategory?.pivot?.manual_discount ?? 0);
    const extraDivisionDiscount =
        division?.pivot?.use_division_discount === 1 ? Number(division?.discount ?? 0) : Number(division?.pivot?.manual_discount ?? 0);
    const extraVariantDiscount =
        variant?.pivot?.use_variant_discount === 1 ? Number(variant?.discount ?? 0) : Number(variant?.pivot?.manual_discount ?? 0);

    if (productDiscount > 0) {
        const discountedBase = applyPercentageDiscount(basePrice, productDiscount);
        const extraSubcategory = applyPercentageDiscount(extraSubcategoryPrice, extraSubcategoryDiscount);
        const extraDivision = applyPercentageDiscount(extraDivisionPrice, extraDivisionDiscount);
        const extraVariant = applyPercentageDiscount(extraVariantPrice, extraVariantDiscount);

        return Math.max(0, discountedBase + extraSubcategory + extraDivision + extraVariant);
    }

    return Math.max(0, Math.round(basePrice + extraSubcategoryPrice + extraDivisionPrice + extraVariantPrice));
}

export default function InvoicePage() {
    const { invoicesPaginated, filters } = usePage<SharedData & { filters?: InvoiceFilters }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoice" />
            <div className="p-4">
                <InvoiceTable invoicesPaginated={invoicesPaginated} filters={filters ?? {}} />
            </div>
        </AppLayout>
    );
}

function InvoiceTable({ invoicesPaginated, filters = {} }: { invoicesPaginated?: IInvoicesPaginated; filters?: InvoiceFilters }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [productOptions, setProductOptions] = useState<IProductOption[]>([]);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productQuery, setProductQuery] = useState('');
    const [productDetailCache, setProductDetailCache] = useState<Record<string, IProducts>>({});
    const [productDetailLoading, setProductDetailLoading] = useState<Record<string, boolean>>({});

    const [countries, setCountries] = useState<CountryOption[]>([{ code: 'ID', name: 'Indonesia', flag: '🇮🇩' }]);
    const [countryCode, setCountryCode] = useState<string>('ID');
    const [provinceCode, setProvinceCode] = useState<string>('');
    const [cityCode, setCityCode] = useState<string>('');
    const [districtCode, setDistrictCode] = useState<string>('');
    const [villageCode, setVillageCode] = useState<string>('');
    const [provinces, setProvinces] = useState<LocationOption[]>([]);
    const [cities, setCities] = useState<LocationOption[]>([]);
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [villages, setVillages] = useState<LocationOption[]>([]);
    const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingVillages, setIsLoadingVillages] = useState(false);
    const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);

    const form = useForm<InvoiceFormData>(createInitialFormData());

    const invoices = invoicesPaginated?.data ?? [];
    const currentPage = invoicesPaginated?.current_page ?? Number(filters.page ?? 1);
    const perPage = invoicesPaginated?.per_page ?? Number(filters.per_page ?? 15);
    const lastPage = invoicesPaginated?.last_page ?? 1;
    const from = invoicesPaginated?.from ?? (invoices.length ? (currentPage - 1) * perPage + 1 : 0);
    const to = invoicesPaginated?.to ?? (invoices.length ? (currentPage - 1) * perPage + invoices.length : 0);
    const total = invoicesPaginated?.total ?? invoices.length;

    const subtotal = useMemo(
        () =>
            form.data.items.reduce((acc, item) => {
                const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
                return acc + item.quantity * (Number.isFinite(price) ? price : 0);
            }, 0),
        [form.data.items],
    );

    const grandTotal = useMemo(() => subtotal, [subtotal]);

    const filteredProductOptions = useMemo(() => {
        if (!productQuery.trim()) {
            return productOptions;
        }

        const query = productQuery.trim().toLowerCase();
        return productOptions.filter((option) => {
            const name = option.name.toLowerCase();
            const sku = option.sku ? option.sku.toLowerCase() : '';
            return name.includes(query) || sku.includes(query);
        });
    }, [productOptions, productQuery]);

    const isIndonesiaAddress = useMemo(() => countryCode.toUpperCase() === 'ID', [countryCode]);

    const updateFilters = useCallback(
        (patch: Partial<InvoiceFilters>) => {
            const next: InvoiceFilters = { ...filters, ...patch };

            Object.keys(next).forEach((key) => {
                const value = next[key as keyof InvoiceFilters];
                if (value === '' || value === null || typeof value === 'undefined') {
                    delete next[key as keyof InvoiceFilters];
                }
            });

            if (next.status === 'all') {
                delete next.status;
            }

            router.get('/orders/invoice', next, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        },
        [filters],
    );

    const goToPage = useCallback(
        (page: number) => {
            if (page < 1 || page > lastPage) return;
            updateFilters({ page });
        },
        [lastPage, updateFilters],
    );

    const loadProducts = useCallback(async (search?: string) => {
        setProductsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', '200');
            if (search && search.trim()) {
                params.set('q', search.trim());
            }

            const response = await fetch(`/v1/products/options?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load products. (${response.status})`);
            }

            const payload = await response.json();
            const items = Array.isArray(payload?.data) ? (payload.data as IProductOption[]) : [];
            setProductOptions(items);
            setProductsLoaded(true);
        } catch (error) {
            console.error('Failed to fetch product options', error);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const fetchProductDetail = useCallback(
        async (productId: string): Promise<IProducts | null> => {
            if (!productId) {
                return null;
            }

            if (productDetailCache[productId]) {
                return productDetailCache[productId];
            }

            if (productDetailLoading[productId]) {
                return null;
            }

            setProductDetailLoading((prev) => ({ ...prev, [productId]: true }));
            try {
                const response = await fetch(`/v1/product/${productId}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Failed to load product detail. (${response.status})`);
                }

                const data = (await response.json()) as IProducts;
                setProductDetailCache((prev) => ({ ...prev, [productId]: data }));
                return data;
            } catch (error) {
                console.error('Failed to fetch product detail', error);
                return null;
            } finally {
                setProductDetailLoading((prev) => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            }
        },
        [productDetailCache, productDetailLoading],
    );

    const fetchCountries = useCallback(async () => {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
            if (!response.ok) {
                throw new Error(`Failed to fetch countries (${response.status})`);
            }
            const data = await response.json();
            const formatted: CountryOption[] = Array.isArray(data)
                ? data
                      .map((item: any) => ({
                          code: typeof item?.cca2 === 'string' ? item.cca2 : '',
                          name: typeof item?.name?.common === 'string' ? item.name.common : '',
                          flag: typeof item?.flag === 'string' ? item.flag : undefined,
                      }))
                      .filter((item: CountryOption) => item.code && item.name)
                      .sort((a: CountryOption, b: CountryOption) => a.name.localeCompare(b.name))
                : [];

            if (!formatted.some((country) => country.code === 'ID')) {
                formatted.unshift({ code: 'ID', name: 'Indonesia', flag: '🇮🇩' });
            }

            setCountries(formatted);
        } catch (error) {
            console.error('Failed to fetch countries', error);
            setCountries([
                { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
                { code: 'US', name: 'United States', flag: '🇺🇸' },
                { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
            ]);
        }
    }, []);

    const loadProvinces = useCallback(async (country: string) => {
        if (!country) {
            setProvinces([]);
            setCities([]);
            setDistricts([]);
            setVillages([]);
            setPostalCodeOptions([]);
            return;
        }

        setIsLoadingProvinces(true);
        try {
            const response = await fetch(`/v1/public/public-province-list/${country}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load provinces. (${response.status})`);
            }

            const data = await response.json();
            setProvinces(normalizeLocationOptions(data));
        } catch (error) {
            console.error('Failed to fetch provinces', error);
            setProvinces([]);
        } finally {
            setIsLoadingProvinces(false);
        }
    }, []);

    const loadCities = useCallback(async (country: string, province: string) => {
        if (!country || !province) {
            setCities([]);
            setDistricts([]);
            setVillages([]);
            setPostalCodeOptions([]);
            return;
        }

        setIsLoadingCities(true);
        try {
            const response = await fetch(`/v1/public/public-city-list/${country}/${encodeURIComponent(province)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load cities. (${response.status})`);
            }

            const data = await response.json();
            setCities(normalizeLocationOptions(data?.cities ?? data));
        } catch (error) {
            console.error('Failed to fetch cities', error);
            setCities([]);
        } finally {
            setIsLoadingCities(false);
        }
    }, []);

    const loadDistricts = useCallback(async (country: string, city: string) => {
        if (!country || !city || country.toUpperCase() !== 'ID') {
            setDistricts([]);
            setVillages([]);
            setPostalCodeOptions([]);
            return;
        }

        setIsLoadingDistricts(true);
        try {
            const url = `/v1/public/district-list/${encodeURIComponent(city)}?country=${encodeURIComponent(country)}`;
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load districts. (${response.status})`);
            }

            const payload = await response.json();
            setDistricts(normalizeLocationOptions(payload?.districts ?? payload));
        } catch (error) {
            console.error('Failed to fetch districts', error);
            setDistricts([]);
        } finally {
            setIsLoadingDistricts(false);
        }
    }, []);

    const loadVillages = useCallback(async (country: string, district: string) => {
        if (!country || !district || country.toUpperCase() !== 'ID') {
            setVillages([]);
            return;
        }

        setIsLoadingVillages(true);
        try {
            const url = `/v1/public/village-list/${encodeURIComponent(district)}?country=${encodeURIComponent(country)}`;
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load villages. (${response.status})`);
            }

            const payload = await response.json();
            setVillages(normalizeLocationOptions(payload?.villages ?? payload));
        } catch (error) {
            console.error('Failed to fetch villages', error);
            setVillages([]);
        } finally {
            setIsLoadingVillages(false);
        }
    }, []);

    const loadPostalCodes = useCallback(
        async ({ country, scope, location }: { country: string; scope: 'city' | 'district' | 'village'; location: string }) => {
            if (!country || !location || country.toUpperCase() !== 'ID') {
                setPostalCodeOptions([]);
                return;
            }

            setIsLoadingPostalCodes(true);
            try {
                const url = `/v1/public/postal-code-list/${encodeURIComponent(location)}?country=${encodeURIComponent(country)}&scope=${scope}`;
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Failed to load postal codes. (${response.status})`);
                }

                const payload = await response.json();
                const codes = Array.isArray(payload?.postal_codes)
                    ? payload.postal_codes
                          .map((entry: any) => {
                              if (typeof entry === 'string') return entry;
                              if (entry && typeof entry === 'object' && typeof entry.postalCode === 'string') return entry.postalCode;
                              if (entry && typeof entry === 'object' && typeof entry.postal_code === 'string') return entry.postal_code;
                              if (entry && typeof entry === 'object' && typeof entry.code === 'string') return entry.code;
                              return null;
                          })
                          .filter((value: string | null): value is string => Boolean(value))
                    : [];
                setPostalCodeOptions(codes);
            } catch (error) {
                console.error('Failed to fetch postal codes', error);
                setPostalCodeOptions([]);
            } finally {
                setIsLoadingPostalCodes(false);
            }
        },
        [],
    );

    const handleOpenForm = useCallback(() => {
        const next = createInitialFormData();
        form.setDefaults(next);
        form.setData(next);
        form.clearErrors();

        setCountryCode('ID');
        setProvinceCode('');
        setCityCode('');
        setDistrictCode('');
        setVillageCode('');
        setProvinces([]);
        setCities([]);
        setDistricts([]);
        setVillages([]);
        setPostalCodeOptions([]);
        setProductDetailCache({});
        setProductDetailLoading({});
        setProductQuery('');

        setIsFormOpen(true);
    }, [form]);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
    }, []);

    const handleProductRefresh = useCallback(() => {
        loadProducts(productQuery);
    }, [loadProducts, productQuery]);

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            form.transform((data) => {
                const normalizeId = (value?: string | null) => {
                    if (!value) return null;
                    const trimmed = value.trim();
                    return trimmed.length ? trimmed : null;
                };

                const normalizedItems = data.items.map((item) => {
                    const priceNumeric = typeof item.price === 'number' ? item.price : Number(item.price ?? 0);
                    return {
                        product_id: item.product_id,
                        category_id: normalizeId(item.category_id),
                        sub_category_id: normalizeId(item.sub_category_id),
                        division_id: normalizeId(item.division_id),
                        variant_id: normalizeId(item.variant_id),
                        quantity: Math.max(1, Number(item.quantity ?? 1)),
                        price: Number.isFinite(priceNumeric) && priceNumeric > 0 ? priceNumeric : 0,
                    };
                });

                const shippingFee = 0;

                const orderItems = normalizedItems.map((item) => {
                    const product = item.product_id ? productDetailCache[item.product_id] : null;
                    const fallbackOption = productOptions.find((candidate) => candidate.id === item.product_id);

                    const category = item.category_id ? product?.categories.find((candidate) => candidate.id === item.category_id) : null;
                    const subCategory = item.sub_category_id
                        ? product?.subcategories.find((candidate) => candidate.id === item.sub_category_id)
                        : null;
                    const division = item.division_id ? product?.divisions.find((candidate) => candidate.id === item.division_id) : null;
                    const variant = item.variant_id ? product?.variants.find((candidate) => candidate.id === item.variant_id) : null;
                    const primaryPicture = product?.pictures?.[0] as { [key: string]: unknown } | undefined;
                    const productImage =
                        primaryPicture && typeof primaryPicture === 'object'
                            ? typeof primaryPicture.url === 'string'
                                ? primaryPicture.url
                                : typeof primaryPicture.picture_url === 'string'
                                  ? (primaryPicture.picture_url as string)
                                  : null
                            : null;

                    return {
                        product_id: item.product_id,
                        product_name: product?.product_name ?? fallbackOption?.name ?? '',
                        product_description: product?.description ?? null,
                        product_image: productImage,
                        category_id: category?.id ?? null,
                        category_name: category?.name ?? null,
                        category_description: category?.description ?? null,
                        sub_category_id: subCategory?.id ?? null,
                        sub_category_name: subCategory?.name ?? null,
                        sub_category_description: subCategory?.description ?? null,
                        division_id: division?.id ?? null,
                        division_name: division?.name ?? null,
                        division_description: division?.description ?? null,
                        variant_id: variant?.id ?? null,
                        variant_name: variant?.name ?? null,
                        variant_description: variant?.description ?? null,
                        quantity: item.quantity,
                        price: item.price,
                    };
                });

                return {
                    ...data,
                    discount_total: 0,
                    tax_total: 0,
                    shipping_total: shippingFee,
                    issued_at: data.issued_at || null,
                    due_at: data.due_at || null,
                    items: normalizedItems,
                    order_checkout: {
                        customer_type: 'guest',
                        payment_method: data.payment_method || 'manual_invoice',
                        bank_payment: null,
                        courier_code: data.courier_code || 'manual',
                        courier_name: data.courier_name || data.courier_code || 'Manual Delivery',
                        courier_service: data.courier_service || 'manual',
                        courier_service_name: data.courier_service_name || data.courier_service || data.courier_name || 'Manual Delivery',
                        shipping_fee: shippingFee,
                        shipping_duration_range: data.shipping_duration_range || null,
                        shipping_duration_unit: data.shipping_duration_unit || null,
                        receiver_name: data.bill_to_name,
                        receiver_phone: data.bill_to_phone,
                        receiver_address: data.bill_to_address,
                        receiver_postal_code: data.bill_to_postal_code,
                        receiver_city: data.bill_to_city,
                        receiver_province: data.bill_to_province,
                        receiver_country: data.bill_to_country,
                        receiver_district: data.bill_to_district || null,
                        receiver_village: data.bill_to_village || null,
                        receiver_country_code: data.bill_to_country_code || null,
                        receiver_province_code: data.bill_to_province_code || null,
                        receiver_city_code: data.bill_to_city_code || null,
                        receiver_district_code: data.bill_to_district_code || null,
                        receiver_village_code: data.bill_to_village_code || null,
                        biteship_destination_id: data.biteship_destination_id || null,
                        email: data.bill_to_email,
                        contact_name: data.bill_to_name,
                        contact_phone: data.bill_to_phone,
                        country: data.bill_to_country,
                        country_code: data.bill_to_country_code || null,
                        province: data.bill_to_province,
                        province_code: data.bill_to_province_code || null,
                        city: data.bill_to_city,
                        city_code: data.bill_to_city_code || null,
                        district: data.bill_to_district || null,
                        district_code: data.bill_to_district_code || null,
                        village: data.bill_to_village || null,
                        village_code: data.bill_to_village_code || null,
                        address: data.bill_to_address,
                        postal_code: data.bill_to_postal_code,
                        latitude: data.latitude === '' ? 0 : Number(data.latitude),
                        longitude: data.longitude === '' ? 0 : Number(data.longitude),
                        items: orderItems,
                        is_manual_invoice: true,
                    },
                };
            });
            form.post('/v1/invoices', {
                preserveScroll: true,
                onSuccess: () => {
                    const next = createInitialFormData();
                    form.setDefaults(next);
                    form.setData(next);
                    form.clearErrors();
                    setProvinceCode('');
                    setCityCode('');
                    setProvinces([]);
                    setCities([]);
                    setIsFormOpen(false);
                },
            });
        },
        [form, productDetailCache, productOptions],
    );

    const addItem = useCallback(() => {
        form.setData('items', [...form.data.items, createDraftItem()]);
    }, [form]);

    const updateItem = useCallback(
        (index: number, patch: Partial<InvoiceItemDraft>) => {
            form.setData(
                'items',
                form.data.items.map((item, itemIndex) => {
                    if (itemIndex !== index) {
                        return item;
                    }

                    const nextItem = { ...item, ...patch };
                    const product = productDetailCache[nextItem.product_id];

                    if (product) {
                        const nextPrice = calculateProductPrice(product, {
                            subCategoryId: nextItem.sub_category_id,
                            divisionId: nextItem.division_id,
                            variantId: nextItem.variant_id,
                        });
                        nextItem.price = nextPrice;
                    } else if (!nextItem.product_id) {
                        nextItem.price = '';
                    }

                    return nextItem;
                }),
            );
        },
        [form, productDetailCache],
    );

    const removeItem = useCallback(
        (index: number) => {
            if (form.data.items.length <= 1) return;
            form.setData(
                'items',
                form.data.items.filter((_, itemIndex) => itemIndex !== index),
            );
        },
        [form],
    );

    const handleViewDetails = useCallback(async (invoice: IInvoice) => {
        setDetailsOpen(true);
        setSelectedInvoice(null);
        setIsLoadingDetails(true);

        try {
            const response = await fetch(`/v1/invoices/${invoice.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load invoice detail. (${response.status})`);
            }

            const data = (await response.json()) as IInvoice;
            setSelectedInvoice(data);
        } catch (error) {
            console.error('Failed to fetch invoice detail', error);
            setSelectedInvoice(invoice);
        } finally {
            setIsLoadingDetails(false);
        }
    }, []);

    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!productsLoaded && !productsLoading) {
            loadProducts();
        }
    }, [isFormOpen, loadProducts, productsLoaded, productsLoading]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!countryCode) {
            setProvinces([]);
            setCities([]);
            setDistricts([]);
            setVillages([]);
            setPostalCodeOptions([]);
            return;
        }

        loadProvinces(countryCode);
    }, [countryCode, isFormOpen, loadProvinces]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!countryCode || !provinceCode) {
            setCities([]);
            setDistricts([]);
            setVillages([]);
            setPostalCodeOptions([]);
            return;
        }

        loadCities(countryCode, provinceCode);
    }, [countryCode, provinceCode, isFormOpen, loadCities]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!countryCode || !cityCode) {
            setDistricts([]);
            setVillages([]);
            if (countryCode.toUpperCase() !== 'ID') {
                setPostalCodeOptions([]);
            }
            return;
        }

        loadDistricts(countryCode, cityCode);
        loadPostalCodes({ country: countryCode, scope: 'city', location: cityCode });
    }, [cityCode, countryCode, isFormOpen, loadDistricts, loadPostalCodes]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!countryCode || !districtCode) {
            setVillages([]);
            if (countryCode.toUpperCase() === 'ID' && cityCode) {
                loadPostalCodes({ country: countryCode, scope: 'city', location: cityCode });
            } else {
                setPostalCodeOptions([]);
            }
            return;
        }

        loadVillages(countryCode, districtCode);
        loadPostalCodes({ country: countryCode, scope: 'district', location: districtCode });
    }, [cityCode, countryCode, districtCode, isFormOpen, loadPostalCodes, loadVillages]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (!countryCode || !districtCode || !villageCode) {
            if (countryCode && districtCode) {
                loadPostalCodes({ country: countryCode, scope: 'district', location: districtCode });
            }
            return;
        }

        loadPostalCodes({ country: countryCode, scope: 'village', location: villageCode });
    }, [countryCode, districtCode, isFormOpen, loadPostalCodes, villageCode]);

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        if (form.data.bill_to_postal_code && postalCodeOptions.length > 0) {
            if (!postalCodeOptions.includes(form.data.bill_to_postal_code)) {
                form.setData('bill_to_postal_code', '');
            }
        }
    }, [form, isFormOpen, postalCodeOptions]);

    useEffect(() => {
        if (!isDetailsOpen) {
            setSelectedInvoice(null);
            setIsLoadingDetails(false);
        }
    }, [isDetailsOpen]);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateFilters({ q: event.target.value || undefined, page: 1 });
    };

    const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ status: event.target.value || undefined, page: 1 });
    };

    const handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ per_page: Number(event.target.value), page: 1 });
    };

    const handleIssuedFromChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateFilters({ issued_from: event.target.value || undefined, page: 1 });
    };

    const handleIssuedToChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateFilters({ issued_to: event.target.value || undefined, page: 1 });
    };

    return (
        <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search invoice or customer..."
                            defaultValue={filters.q ?? ''}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        value={filters.status ?? 'all'}
                        onChange={handleStatusChange}
                    >
                        {statusFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <Input type="date" value={filters.issued_from ?? ''} onChange={handleIssuedFromChange} className="w-auto" />
                    <Input type="date" value={filters.issued_to ?? ''} onChange={handleIssuedToChange} className="w-auto" />

                    <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        value={perPage}
                        onChange={handlePerPageChange}
                    >
                        {perPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option} / page
                            </option>
                        ))}
                    </select>
                </div>

                <Button onClick={handleOpenForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                                <th className="px-4 py-3 text-left font-semibold">Issued</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">Total</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={6}>
                                        No invoices found. Create your first invoice to get started.
                                    </td>
                                </tr>
                            )}
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="border-t border-muted/40">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{invoice.invoice_number}</div>
                                        <div className="text-xs text-muted-foreground">{invoice.items_count ?? invoice.items?.length ?? 0} items</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-foreground">{invoice.bill_to_name ?? '-'}</div>
                                        <div className="text-xs text-muted-foreground">{invoice.bill_to_email ?? ''}</div>
                                    </td>
                                    <td className="px-4 py-3 text-foreground">{formatDateTime(invoice.issued_at)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={statusVariant(invoice.status)}>{statusLabel(invoice.status)}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(invoice.grand_total)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(invoice)}>
                                                <Search className="mr-2 h-4 w-4" />
                                                View
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => window.open(`/v1/invoices/${invoice.id}/download`, '_blank')}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                PDF
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted/40 px-4 py-3 text-xs text-muted-foreground">
                    <div>
                        Showing <span className="font-medium text-foreground">{from}</span> to{' '}
                        <span className="font-medium text-foreground">{to}</span> of <span className="font-medium text-foreground">{total}</span>{' '}
                        results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                            Previous
                        </Button>
                        <div>
                            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
                            <span className="font-medium text-foreground">{lastPage}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= lastPage}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={(open) => (!open ? handleCloseForm() : undefined)}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="invoice-number">Invoice Number (optional)</Label>
                                <Input
                                    id="invoice-number"
                                    value={form.data.invoice_number}
                                    onChange={(event) => form.setData('invoice_number', event.target.value)}
                                />
                                {form.errors.invoice_number && <p className="text-xs text-destructive">{form.errors.invoice_number}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice-status">Status</Label>
                                <select
                                    id="invoice-status"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value as InvoiceFormData['status'])}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="issued">Issued</option>
                                    <option value="draft">Draft</option>
                                </select>
                                {form.errors.status && <p className="text-xs text-destructive">{form.errors.status}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="issued-at">Issued At</Label>
                                <Input
                                    id="issued-at"
                                    type="datetime-local"
                                    value={form.data.issued_at}
                                    onChange={(event) => form.setData('issued_at', event.target.value)}
                                />
                                {form.errors.issued_at && <p className="text-xs text-destructive">{form.errors.issued_at}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="due-at">Due At</Label>
                                <Input
                                    id="due-at"
                                    type="datetime-local"
                                    value={form.data.due_at}
                                    onChange={(event) => form.setData('due_at', event.target.value)}
                                />
                                {form.errors.due_at && <p className="text-xs text-destructive">{form.errors.due_at}</p>}
                            </div>
                        </div>

                        <div className="rounded-md border border-dashed border-muted-foreground/40 p-4">
                            <h3 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Order Fulfillment</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Provide shipping details so the checkout flow can create a matching order automatically.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="payment-method">Payment Method</Label>
                                    <Input
                                        id="payment-method"
                                        value={form.data.payment_method}
                                        onChange={(event) => form.setData('payment_method', event.target.value)}
                                    />
                                    {form.errors.payment_method && <p className="text-xs text-destructive">{form.errors.payment_method}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="courier-code">Courier Code</Label>
                                    <Input
                                        id="courier-code"
                                        value={form.data.courier_code}
                                        onChange={(event) => form.setData('courier_code', event.target.value)}
                                    />
                                    {form.errors.courier_code && <p className="text-xs text-destructive">{form.errors.courier_code}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="courier-name">Courier Name</Label>
                                    <Input
                                        id="courier-name"
                                        value={form.data.courier_name}
                                        onChange={(event) => form.setData('courier_name', event.target.value)}
                                    />
                                    {form.errors.courier_name && <p className="text-xs text-destructive">{form.errors.courier_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="courier-service">Courier Service Code</Label>
                                    <Input
                                        id="courier-service"
                                        value={form.data.courier_service}
                                        onChange={(event) => form.setData('courier_service', event.target.value)}
                                    />
                                    {form.errors.courier_service && <p className="text-xs text-destructive">{form.errors.courier_service}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="courier-service-name">Courier Service Name</Label>
                                    <Input
                                        id="courier-service-name"
                                        value={form.data.courier_service_name}
                                        onChange={(event) => form.setData('courier_service_name', event.target.value)}
                                    />
                                    {form.errors.courier_service_name && (
                                        <p className="text-xs text-destructive">{form.errors.courier_service_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shipping-duration-range">Shipping Duration Range</Label>
                                    <Input
                                        id="shipping-duration-range"
                                        placeholder="e.g. 2-3"
                                        value={form.data.shipping_duration_range}
                                        onChange={(event) => form.setData('shipping_duration_range', event.target.value)}
                                    />
                                    {form.errors.shipping_duration_range && (
                                        <p className="text-xs text-destructive">{form.errors.shipping_duration_range}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shipping-duration-unit">Shipping Duration Unit</Label>
                                    <Input
                                        id="shipping-duration-unit"
                                        placeholder="e.g. days"
                                        value={form.data.shipping_duration_unit}
                                        onChange={(event) => form.setData('shipping_duration_unit', event.target.value)}
                                    />
                                    {form.errors.shipping_duration_unit && (
                                        <p className="text-xs text-destructive">{form.errors.shipping_duration_unit}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="biteship-destination-id">Biteship Destination ID (optional)</Label>
                                    <Input
                                        id="biteship-destination-id"
                                        value={form.data.biteship_destination_id}
                                        onChange={(event) => form.setData('biteship_destination_id', event.target.value)}
                                    />
                                    {form.errors.biteship_destination_id && (
                                        <p className="text-xs text-destructive">{form.errors.biteship_destination_id}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="0.000001"
                                        value={form.data.latitude}
                                        onChange={(event) => form.setData('latitude', event.target.value)}
                                    />
                                    {form.errors.latitude && <p className="text-xs text-destructive">{form.errors.latitude}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="0.000001"
                                        value={form.data.longitude}
                                        onChange={(event) => form.setData('longitude', event.target.value)}
                                    />
                                    {form.errors.longitude && <p className="text-xs text-destructive">{form.errors.longitude}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-dashed border-muted-foreground/40 p-4">
                            <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Billing Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-name">Customer Name</Label>
                                    <Input
                                        id="bill-to-name"
                                        value={form.data.bill_to_name}
                                        onChange={(event) => form.setData('bill_to_name', event.target.value)}
                                    />
                                    {form.errors.bill_to_name && <p className="text-xs text-destructive">{form.errors.bill_to_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-email">Customer Email</Label>
                                    <Input
                                        id="bill-to-email"
                                        type="email"
                                        value={form.data.bill_to_email}
                                        onChange={(event) => form.setData('bill_to_email', event.target.value)}
                                    />
                                    {form.errors.bill_to_email && <p className="text-xs text-destructive">{form.errors.bill_to_email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-phone">Customer Phone</Label>
                                    <Input
                                        id="bill-to-phone"
                                        value={form.data.bill_to_phone}
                                        onChange={(event) => form.setData('bill_to_phone', event.target.value)}
                                    />
                                    {form.errors.bill_to_phone && <p className="text-xs text-destructive">{form.errors.bill_to_phone}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <select
                                        value={countryCode}
                                        onChange={(event) => {
                                            const code = event.target.value;
                                            const selectedCountry = countries.find((item) => item.code === code);
                                            setCountryCode(code);
                                            setProvinceCode('');
                                            setCityCode('');
                                            setDistrictCode('');
                                            setVillageCode('');
                                            setProvinces([]);
                                            setCities([]);
                                            setDistricts([]);
                                            setVillages([]);
                                            setPostalCodeOptions([]);
                                            form.setData((current) => ({
                                                ...current,
                                                bill_to_country_code: code,
                                                bill_to_country: selectedCountry?.name ?? '',
                                                bill_to_province: '',
                                                bill_to_province_code: '',
                                                bill_to_city: '',
                                                bill_to_city_code: '',
                                                bill_to_district: '',
                                                bill_to_district_code: '',
                                                bill_to_village: '',
                                                bill_to_village_code: '',
                                                bill_to_postal_code: '',
                                            }));
                                        }}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">Select country</option>
                                        {countries.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {formatCountryLabel(option)}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.bill_to_country_code && (
                                        <p className="text-xs text-destructive">{form.errors.bill_to_country_code}</p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bill-to-country">Country Name</Label>
                                    <Input
                                        id="bill-to-country"
                                        value={form.data.bill_to_country}
                                        onChange={(event) => form.setData('bill_to_country', event.target.value)}
                                    />
                                    {form.errors.bill_to_country && <p className="text-xs text-destructive">{form.errors.bill_to_country}</p>}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bill-to-address">Address</Label>
                                    <textarea
                                        id="bill-to-address"
                                        value={form.data.bill_to_address}
                                        onChange={(event) => form.setData('bill_to_address', event.target.value)}
                                        className="h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                    {form.errors.bill_to_address && <p className="text-xs text-destructive">{form.errors.bill_to_address}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-province">Province</Label>
                                    <select
                                        id="bill-to-province"
                                        value={provinceCode}
                                        onChange={(event) => {
                                            const code = event.target.value;
                                            setProvinceCode(code);
                                            setCityCode('');
                                            setDistrictCode('');
                                            setVillageCode('');
                                            setCities([]);
                                            setDistricts([]);
                                            setVillages([]);
                                            setPostalCodeOptions([]);
                                            const option = provinces.find((item) => item.value === code);
                                            form.setData((current) => ({
                                                ...current,
                                                bill_to_province_code: code,
                                                bill_to_province: option?.label ?? '',
                                                bill_to_city: '',
                                                bill_to_city_code: '',
                                                bill_to_district: '',
                                                bill_to_district_code: '',
                                                bill_to_village: '',
                                                bill_to_village_code: '',
                                                bill_to_postal_code: '',
                                            }));
                                        }}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">{isLoadingProvinces ? 'Loading provinces...' : 'Select province'}</option>
                                        {provinces.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.bill_to_province && <p className="text-xs text-destructive">{form.errors.bill_to_province}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-city">City</Label>
                                    <select
                                        id="bill-to-city"
                                        value={cityCode}
                                        onChange={(event) => {
                                            const code = event.target.value;
                                            setCityCode(code);
                                            setDistrictCode('');
                                            setVillageCode('');
                                            setDistricts([]);
                                            setVillages([]);
                                            setPostalCodeOptions([]);
                                            const option = cities.find((item) => item.value === code);
                                            form.setData((current) => ({
                                                ...current,
                                                bill_to_city_code: code,
                                                bill_to_city: option?.label ?? '',
                                                bill_to_district: '',
                                                bill_to_district_code: '',
                                                bill_to_village: '',
                                                bill_to_village_code: '',
                                                bill_to_postal_code: '',
                                            }));
                                        }}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">{isLoadingCities ? 'Loading cities...' : 'Select city'}</option>
                                        {cities.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.bill_to_city && <p className="text-xs text-destructive">{form.errors.bill_to_city}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-district">District</Label>
                                    {isIndonesiaAddress ? (
                                        <select
                                            id="bill-to-district"
                                            value={districtCode}
                                            onChange={(event) => {
                                                const code = event.target.value;
                                                setDistrictCode(code);
                                                setVillageCode('');
                                                setVillages([]);
                                                const option = districts.find((item) => item.value === code);
                                                form.setData((current) => ({
                                                    ...current,
                                                    bill_to_district_code: code,
                                                    bill_to_district: option?.label ?? '',
                                                    bill_to_village: '',
                                                    bill_to_village_code: '',
                                                    bill_to_postal_code: '',
                                                }));
                                            }}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="">
                                                {isLoadingDistricts ? 'Loading districts...' : cityCode ? 'Select district' : 'Select a city first'}
                                            </option>
                                            {districts.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            id="bill-to-district"
                                            value={form.data.bill_to_district}
                                            onChange={(event) =>
                                                form.setData((current) => ({
                                                    ...current,
                                                    bill_to_district: event.target.value,
                                                    bill_to_district_code: '',
                                                }))
                                            }
                                        />
                                    )}
                                    {form.errors.bill_to_district && <p className="text-xs text-destructive">{form.errors.bill_to_district}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-village">Village</Label>
                                    {isIndonesiaAddress ? (
                                        <select
                                            id="bill-to-village"
                                            value={villageCode}
                                            onChange={(event) => {
                                                const code = event.target.value;
                                                setVillageCode(code);
                                                const option = villages.find((item) => item.value === code);
                                                form.setData((current) => ({
                                                    ...current,
                                                    bill_to_village_code: code,
                                                    bill_to_village: option?.label ?? '',
                                                }));
                                            }}
                                            disabled={!districtCode || isLoadingVillages}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-60"
                                        >
                                            <option value="">
                                                {isLoadingVillages
                                                    ? 'Loading villages...'
                                                    : districtCode
                                                      ? 'Select village'
                                                      : 'Select a district first'}
                                            </option>
                                            {villages.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            id="bill-to-village"
                                            value={form.data.bill_to_village}
                                            onChange={(event) =>
                                                form.setData((current) => ({
                                                    ...current,
                                                    bill_to_village: event.target.value,
                                                    bill_to_village_code: '',
                                                }))
                                            }
                                        />
                                    )}
                                    {form.errors.bill_to_village && <p className="text-xs text-destructive">{form.errors.bill_to_village}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bill-to-postal-code">Postal Code</Label>
                                    {isIndonesiaAddress && postalCodeOptions.length > 0 ? (
                                        <select
                                            id="bill-to-postal-code"
                                            value={form.data.bill_to_postal_code}
                                            onChange={(event) => form.setData('bill_to_postal_code', event.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="">{isLoadingPostalCodes ? 'Loading postal codes...' : 'Select postal code'}</option>
                                            {postalCodeOptions.map((code) => (
                                                <option key={code} value={code}>
                                                    {code}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            id="bill-to-postal-code"
                                            value={form.data.bill_to_postal_code}
                                            onChange={(event) => form.setData('bill_to_postal_code', event.target.value)}
                                        />
                                    )}
                                    {form.errors.bill_to_postal_code && <p className="text-xs text-destructive">{form.errors.bill_to_postal_code}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-dashed border-muted-foreground/40 p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Invoice Items</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            className="w-48 pl-9"
                                            placeholder="Filter products"
                                            value={productQuery}
                                            onChange={(event) => setProductQuery(event.target.value)}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleProductRefresh} disabled={productsLoading}>
                                        {productsLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading
                                            </>
                                        ) : (
                                            'Refresh'
                                        )}
                                    </Button>
                                    <Button type="button" size="sm" onClick={addItem}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse text-sm">
                                    <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold">Product</th>
                                            <th className="px-3 py-2 text-left font-semibold">Quantity</th>
                                            <th className="px-3 py-2 text-left font-semibold">Unit Price</th>
                                            <th className="px-3 py-2 text-left font-semibold">Line Total</th>
                                            <th className="px-3 py-2 text-center font-semibold">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.items.map((item, index) => {
                                            const productDetail = item.product_id ? productDetailCache[item.product_id] : undefined;
                                            const isProductLoading = item.product_id ? Boolean(productDetailLoading[item.product_id]) : false;

                                            const availableCategories = productDetail?.categories ?? [];
                                            const availableSubcategories = productDetail
                                                ? productDetail.subcategories.filter((sub) => {
                                                      if (!item.category_id) {
                                                          return true;
                                                      }
                                                      return sub.category_id === item.category_id;
                                                  })
                                                : [];
                                            const availableDivisions = productDetail
                                                ? productDetail.divisions.filter((division) => {
                                                      if (!item.sub_category_id) {
                                                          return true;
                                                      }
                                                      return division.sub_category_id === item.sub_category_id;
                                                  })
                                                : [];
                                            const availableVariants = productDetail
                                                ? productDetail.variants.filter((variant) => {
                                                      if (!item.division_id) {
                                                          return true;
                                                      }
                                                      return variant.division_id === item.division_id;
                                                  })
                                                : [];

                                            const unitPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0') || 0;
                                            const lineTotal = item.quantity * unitPrice;

                                            return (
                                                <tr key={item.key} className="border-t border-muted/40 align-top">
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="space-y-2">
                                                            <select
                                                                value={item.product_id}
                                                                onChange={async (event) => {
                                                                    const productId = event.target.value;
                                                                    if (!productId) {
                                                                        updateItem(index, {
                                                                            product_id: '',
                                                                            category_id: '',
                                                                            sub_category_id: '',
                                                                            division_id: '',
                                                                            variant_id: '',
                                                                            price: '',
                                                                        });
                                                                        return;
                                                                    }
                                                                    await fetchProductDetail(productId);
                                                                    updateItem(index, {
                                                                        product_id: productId,
                                                                        category_id: '',
                                                                        sub_category_id: '',
                                                                        division_id: '',
                                                                        variant_id: '',
                                                                    });
                                                                }}
                                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                            >
                                                                <option value="">{productsLoading ? 'Loading products...' : 'Select product'}</option>
                                                                {filteredProductOptions.map((option) => (
                                                                    <option key={option.id} value={option.id}>
                                                                        {option.name}
                                                                        {option.sku ? ` (${option.sku})` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {form.errors[`items.${index}.product_id`] && (
                                                                <p className="text-xs text-destructive">{form.errors[`items.${index}.product_id`]}</p>
                                                            )}

                                                            {item.product_id ? (
                                                                <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 p-2">
                                                                    {isProductLoading && (
                                                                        <p className="text-xs text-muted-foreground">Loading product details…</p>
                                                                    )}

                                                                    {productDetail && (
                                                                        <>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs font-medium text-muted-foreground">
                                                                                    Category
                                                                                </Label>
                                                                                <select
                                                                                    value={item.category_id ?? ''}
                                                                                    onChange={(event) => {
                                                                                        const categoryId = event.target.value;
                                                                                        updateItem(index, {
                                                                                            category_id: categoryId,
                                                                                            sub_category_id: '',
                                                                                            division_id: '',
                                                                                            variant_id: '',
                                                                                        });
                                                                                    }}
                                                                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                                                                >
                                                                                    <option value="">No category</option>
                                                                                    {availableCategories.map((category) => (
                                                                                        <option key={category.id} value={category.id}>
                                                                                            {category.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {form.errors[`items.${index}.category_id`] && (
                                                                                    <p className="text-xs text-destructive">
                                                                                        {form.errors[`items.${index}.category_id`]}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs font-medium text-muted-foreground">
                                                                                    Sub Category
                                                                                </Label>
                                                                                <select
                                                                                    value={item.sub_category_id ?? ''}
                                                                                    onChange={(event) => {
                                                                                        const subCategoryId = event.target.value;
                                                                                        updateItem(index, {
                                                                                            sub_category_id: subCategoryId,
                                                                                            division_id: '',
                                                                                            variant_id: '',
                                                                                        });
                                                                                    }}
                                                                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                                                                >
                                                                                    <option value="">No sub category</option>
                                                                                    {availableSubcategories.map((sub) => (
                                                                                        <option key={sub.id} value={sub.id}>
                                                                                            {sub.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {form.errors[`items.${index}.sub_category_id`] && (
                                                                                    <p className="text-xs text-destructive">
                                                                                        {form.errors[`items.${index}.sub_category_id`]}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs font-medium text-muted-foreground">
                                                                                    Division
                                                                                </Label>
                                                                                <select
                                                                                    value={item.division_id ?? ''}
                                                                                    onChange={(event) => {
                                                                                        const divisionId = event.target.value;
                                                                                        updateItem(index, {
                                                                                            division_id: divisionId,
                                                                                            variant_id: '',
                                                                                        });
                                                                                    }}
                                                                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                                                                >
                                                                                    <option value="">No division</option>
                                                                                    {availableDivisions.map((division) => (
                                                                                        <option key={division.id} value={division.id}>
                                                                                            {division.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {form.errors[`items.${index}.division_id`] && (
                                                                                    <p className="text-xs text-destructive">
                                                                                        {form.errors[`items.${index}.division_id`]}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs font-medium text-muted-foreground">
                                                                                    Variant
                                                                                </Label>
                                                                                <select
                                                                                    value={item.variant_id ?? ''}
                                                                                    onChange={(event) => {
                                                                                        const variantId = event.target.value;
                                                                                        updateItem(index, {
                                                                                            variant_id: variantId,
                                                                                        });
                                                                                    }}
                                                                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                                                                >
                                                                                    <option value="">No variant</option>
                                                                                    {availableVariants.map((variant) => (
                                                                                        <option key={variant.id} value={variant.id}>
                                                                                            {variant.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {form.errors[`items.${index}.variant_id`] && (
                                                                                    <p className="text-xs text-destructive">
                                                                                        {form.errors[`items.${index}.variant_id`]}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={(event) =>
                                                                updateItem(index, {
                                                                    quantity: Math.max(1, Number(event.target.value) || 1),
                                                                })
                                                            }
                                                        />
                                                        {form.errors[`items.${index}.quantity`] && (
                                                            <p className="mt-1 text-xs text-destructive">{form.errors[`items.${index}.quantity`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="text-sm font-medium text-foreground">{formatCurrency(unitPrice)}</div>
                                                        <p className="text-xs text-muted-foreground">Auto-calculated</p>
                                                        {form.errors[`items.${index}.price`] && (
                                                            <p className="mt-1 text-xs text-destructive">{form.errors[`items.${index}.price`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-left text-foreground">{formatCurrency(lineTotal)}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(index)}
                                                            disabled={form.data.items.length <= 1}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {form.errors.items && <p className="mt-2 text-xs text-destructive">{form.errors.items}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Grand Total</span>
                                    <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Button type="button" variant="outline" onClick={handleCloseForm}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Invoice
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Invoice Detail</DialogTitle>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedInvoice ? (
                        <InvoiceDetailContent invoice={selectedInvoice} />
                    ) : (
                        <div className="text-sm text-muted-foreground">Select an invoice to view details.</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function InvoiceDetailContent({ invoice }: { invoice: IInvoice }) {
    const items: IInvoiceItem[] = invoice.items ?? [];

    const addressParts = [
        invoice.bill_to_address,
        invoice.bill_to_city,
        invoice.bill_to_province,
        invoice.bill_to_postal_code,
        invoice.bill_to_country,
    ].filter((part) => typeof part === 'string' && part.trim().length);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-muted/40 p-4">
                    <div className="text-xs tracking-wide text-muted-foreground uppercase">Invoice</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">{invoice.invoice_number}</div>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant={statusVariant(invoice.status)}>{statusLabel(invoice.status)}</Badge>
                        <span className="text-xs text-muted-foreground">Issued {formatDateTime(invoice.issued_at)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Due {formatDateTime(invoice.due_at)}</div>
                </div>

                <div className="rounded-md border border-muted/40 p-4">
                    <div className="text-xs tracking-wide text-muted-foreground uppercase">Bill To</div>
                    <div className="mt-1 font-medium text-foreground">{invoice.bill_to_name ?? '-'}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {invoice.bill_to_email ?? ''}
                        {invoice.bill_to_email && invoice.bill_to_phone ? ' • ' : ''}
                        {invoice.bill_to_phone ?? ''}
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{addressParts.length ? addressParts.join(', ') : '-'}</div>
                </div>
            </div>

            <div className="rounded-md border border-muted/40 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-medium text-destructive text-foreground">-{formatCurrency(invoice.discount_total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="font-medium text-foreground">{formatCurrency(invoice.tax_total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="font-medium text-foreground">{formatCurrency(invoice.shipping_total)}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground">
                        <span>Grand Total</span>
                        <span>{formatCurrency(invoice.grand_total)}</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Items</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Product</th>
                                <th className="px-3 py-2 text-left font-semibold">Quantity</th>
                                <th className="px-3 py-2 text-left font-semibold">Price</th>
                                <th className="px-3 py-2 text-left font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-center text-muted-foreground" colSpan={4}>
                                        No items recorded.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="border-t border-muted/40">
                                        <td className="px-3 py-2">
                                            <div className="font-medium text-foreground">{item.product_name}</div>
                                            {item.product_description && (
                                                <div className="text-xs text-muted-foreground">{item.product_description}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-foreground">{item.quantity}</td>
                                        <td className="px-3 py-2 text-foreground">{formatCurrency(item.price)}</td>
                                        <td className="px-3 py-2 text-foreground">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
