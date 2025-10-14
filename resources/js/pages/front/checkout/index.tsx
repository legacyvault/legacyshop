import AddDeliveryAddressModal from '@/components/add-delivery-address-modal';
import CourierListModal from '@/components/courier-list-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SharedData, type IDeliveryAddress, type IRatePricing } from '@/types';
import { Link, router, usePage, useRemember } from '@inertiajs/react';
import { BadgeCheck, Check, ChevronRight, CurrencyIcon, MapPin, PackageCheck, ReceiptText, ShieldCheck, TicketPercent } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const CHECKOUT_ITEMS_STORAGE_KEY = 'checkout:selectedItems';
const FALLBACK_IMAGE = '/banner-example.jpg';

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

const dummyPayments = [
    { id: 'mandiri', name: 'Mandiri Virtual Account', accent: 'bg-[#FFE8CC] text-[#E57E25]', selected: true },
    { id: 'bca', name: 'BCA Virtual Account', accent: 'bg-[#DAE8FF] text-[#1A56DB]' },
    { id: 'alfamart', name: 'Alfamart / Alfamidi / Lawson / Dan+Dan', accent: 'bg-[#FFE4EC] text-[#D1357F]' },
    { id: 'bri', name: 'BRI Virtual Account', accent: 'bg-[#DFF7F0] text-[#0E9F6E]' },
];

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
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>(() => loadStoredCheckoutItems());

    const addresses = useMemo(() => (Array.isArray(deliveryAddresses) ? deliveryAddresses : []), [deliveryAddresses]);
    const [selectedAddress, setSelectedAddress] = useState<IDeliveryAddress | null>(() => {
        if (!addresses.length) return null;
        return addresses.find((address) => address.is_active) ?? addresses[0];
    });
    const [isChangeAddressOpen, setIsChangeAddressOpen] = useState(false);

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

    const addressInformation = useMemo(
        () =>
            selectedAddress
                ? {
                      destination_latitude: selectedAddress.latitude,
                      destination_longitude: selectedAddress.longitude,
                  }
                : { destination_latitude: null, destination_longitude: null },
        [selectedAddress],
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
        if (!warehouseKey || !selectedAddress) {
            return null;
        }

        return `${warehouseKey}-${selectedAddress.id}`;
    }, [warehouseKey, selectedAddress]);

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
            if (!warehouse || !selectedAddress) {
                if (openModalOnSuccess) {
                    setIsCourierModalOpen(true);
                }
                return;
            }

            if (!rateItemsPayload.length) {
                if (openModalOnSuccess) {
                    setIsCourierModalOpen(true);
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
                destination_latitude: Number(selectedAddress.latitude),
                destination_longitude: Number(selectedAddress.longitude),
                couriers: 'gojek,jne,anteraja',
                items: rateItemsPayload,
            };

            // router.post(route('delivery.rates'), payload, {
            //     preserveScroll: true,
            //     preserveState: true,
            //     onFinish: () => {
            //         setIsRequestingRates(false);
            //     },
            // });
        },
        [warehouse, selectedAddress, rateItemsPayload, setIsCourierModalOpen, setShouldAutoOpenCourier],
    );

    useEffect(() => {
        if (!rateKey) {
            return;
        }

        if (isRequestingRates) {
            return;
        }

        if (!warehouse || !selectedAddress || !rateItemsPayload.length) {
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
        selectedAddress,
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

    const subtotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const protection = checkoutItems.reduce((total, item) => total + (item.protectionPrice ?? 0), 0);
    const shipping = selectedRate?.price ?? 0;
    const insurance = 0;
    const total = subtotal + protection + shipping + insurance;
    const hasCheckoutItems = checkoutItems.length > 0;

    const [isModalOpen, setIsModalOpen] = useState(false);

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

    return (
        <>
            <AddDeliveryAddressModal
                open={isModalOpen}
                onOpenChange={handleModalChange}
                provinces={provinces}
                deliveryAddress={selectedDeliveryAddress}
                id={selectedId}
                closeOnSuccess={true}
            />
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
                            <CardHeader className="flex-row items-start justify-between gap-4 py-0 pt-6">
                                <div className="space-y-4">
                                    <div className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Delivery Address</div>
                                    <div className="flex gap-3 text-sm">
                                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </span>
                                        <div>
                                            {selectedAddress ? (
                                                <>
                                                    <div className="font-semibold text-foreground capitalize">
                                                        {selectedAddress.name} • {selectedAddress.contact_name}
                                                    </div>
                                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{selectedAddress.address}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">{selectedAddress.contact_phone}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">There is no delivery address yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                                                        <p className="text-xs text-muted-foreground">{address.contact_phone}</p>
                                                                        <Button
                                                                            onClick={() => editAddressHandler(address)}
                                                                            className="mt-4 pl-0"
                                                                            variant={'link'}
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
                                                <p className="text-sm text-muted-foreground">Kamu belum memiliki alamat pengiriman tersimpan.</p>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
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
                                            <p className="text-muted-foreground">Pilih layanan pengiriman yang tersedia untuk alamat kamu.</p>
                                            {ratesError ? <p className="text-xs text-destructive">{ratesError}</p> : null}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShippingButtonClick}
                                    disabled={isRequestingRates || !selectedAddress || !warehouse || !hasCheckoutItems}
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
                                            Available for Cash on Delivery
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
                                <CardTitle className="text-lg font-semibold">Metode Pembayaran</CardTitle>
                                <button className="text-sm font-semibold text-primary transition hover:text-primary/80">Lihat Semua</button>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-3">
                                    {dummyPayments.map((method) => (
                                        <label
                                            key={method.id}
                                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 transition hover:border-primary/50 hover:bg-background ${
                                                method.selected ? 'border-primary bg-background' : ''
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${method.accent}`}
                                                >
                                                    {method.name.slice(0, 2).toUpperCase()}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">{method.name}</span>
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                                        method.selected ? 'border-primary' : 'border-border'
                                                    }`}
                                                >
                                                    {method.selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left text-sm font-semibold text-primary transition hover:bg-primary/10">
                                    <span className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                            <TicketPercent className="h-4 w-4 text-primary" />
                                        </span>
                                        Makin hemat pakai promo
                                    </span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Bonus Cashback</span>
                                    <span className="font-semibold text-primary">40.000</span>
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
                                <Button size="lg" className="h-12 w-full text-base font-semibold" disabled={!hasCheckoutItems}>
                                    Pay Now
                                </Button>
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
        </>
    );
}
