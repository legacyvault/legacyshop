import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import FrontLayout from '@/layouts/front/front-layout';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    ChevronDown,
    ChevronRight,
    FileText,
    MapPin,
    ShieldCheck,
    TicketPercent,
} from 'lucide-react';

const dummyAddress = {
    label: 'alamat rumah',
    recipient: 'Gifino Thoriq',
    detail: 'Jalan cenderawasih I KAV 273, Pondok Aren, Kota Tangerang Selatan, Banten, 6285717548873',
};

const dummyItems = [
    {
        id: 'noir-gear',
        store: 'Noir Gear Official',
        name: 'Noir Timeless82 v2 Classic Edition Mechanical Keyboard Gasket Mount',
        variant: 'Black, Tactile',
        quantity: 1,
        price: 909_000,
        protectionLabel: 'Proteksi Rusak Total 3 bulan',
        protectionPrice: 27_200,
        shippingService: 'J&T',
        shippingPrice: 7_000,
        shippingEstimate: 'Estimasi tiba besok - 4 Oct',
        shippingInsurancePrice: 5_500,
        image:
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=160&q=80',
    },
];

const dummyPayments = [
    { id: 'mandiri', name: 'Mandiri Virtual Account', accent: 'bg-[#FFE8CC] text-[#E57E25]', selected: true },
    { id: 'bca', name: 'BCA Virtual Account', accent: 'bg-[#DAE8FF] text-[#1A56DB]' },
    { id: 'alfamart', name: 'Alfamart / Alfamidi / Lawson / Dan+Dan', accent: 'bg-[#FFE4EC] text-[#D1357F]' },
    { id: 'bri', name: 'BRI Virtual Account', accent: 'bg-[#DFF7F0] text-[#0E9F6E]' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function Checkout() {
    const { auth, translations, locale } = usePage<SharedData>().props;

    const subtotal = dummyItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const protection = dummyItems.reduce((total, item) => total + item.protectionPrice, 0);
    const shipping = dummyItems.reduce((total, item) => total + item.shippingPrice, 0);
    const insurance = dummyItems.reduce((total, item) => total + item.shippingInsurancePrice, 0);
    const total = subtotal + protection + shipping + insurance;

    return (
        <>
            <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
                </div>

                <div className="mb-2">
                        <span onClick={() => window.history.back()} className='underline cursor-pointer'>Back to Cart</span>        
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <Card className="gap-4 border border-border/60 bg-background shadow-sm">
                            <CardHeader className="flex-row items-start justify-between gap-4 py-0 pt-6">
                                <div className="space-y-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                        Alamat Pengiriman
                                    </div>
                                    <div className="flex gap-3 text-sm">
                                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <div className="font-semibold capitalize text-foreground">
                                                {dummyAddress.label} • {dummyAddress.recipient}
                                            </div>
                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                {dummyAddress.detail}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    Ganti
                                </Button>
                            </CardHeader>
                        </Card>

                        {dummyItems.map((item) => (
                            <Card key={item.id} className="gap-6 border border-border/60 bg-background shadow-sm">
                                <CardHeader className="flex-col gap-3 pb-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
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
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h2 className="text-base font-semibold text-foreground sm:text-lg">{item.name}</h2>
                                                <p className="text-sm text-muted-foreground">{item.variant}</p>
                                            </div>
                                            <button className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                <ShieldCheck className="h-4 w-4" />
                                                {item.protectionLabel}
                                                <span className="font-normal text-muted-foreground">({formatCurrency(item.protectionPrice)})</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-dashed border-border bg-muted/30">
                                        <button className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-4 py-3 text-left text-sm font-semibold sm:text-base">
                                            Reguler
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <div className="space-y-4 px-4 py-4">
                                            <div className="rounded-xl border border-primary/20 bg-background px-4 py-3 text-sm">
                                                <div className="font-semibold text-foreground">
                                                    {item.shippingService} ({formatCurrency(item.shippingPrice)})
                                                </div>
                                                <p className="mt-1 text-muted-foreground">{item.shippingEstimate}</p>
                                            </div>
                                            <button className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                <ShieldCheck className="h-4 w-4" />
                                                Pakai Asuransi Pengiriman
                                                <span className="font-normal text-muted-foreground">({formatCurrency(item.shippingInsurancePrice)})</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                        <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                            <FileText className="h-4 w-4" />
                                            Kasih Catatan
                                        </button>
                                        <span className="text-xs text-muted-foreground">0/200</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-28">
                        <Card className="gap-0 border border-border/60 bg-background shadow-sm">
                            <CardHeader className="flex-row items-center justify-between gap-3 py-6">
                                <CardTitle className="text-lg font-semibold">Metode Pembayaran</CardTitle>
                                <button className="text-sm font-semibold text-primary transition hover:text-primary/80">
                                    Lihat Semua
                                </button>
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
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Cek ringkasan transaksimu, yuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Subtotal Produk</span>
                                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Proteksi</span>
                                    <span className="font-medium text-foreground">{formatCurrency(protection)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Ongkos Kirim</span>
                                    <span className="font-medium text-foreground">{formatCurrency(shipping)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Asuransi Pengiriman</span>
                                    <span className="font-medium text-foreground">{formatCurrency(insurance)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-6">
                                <div className="flex w-full items-center justify-between text-base font-semibold text-foreground">
                                    <span>Total Tagihan</span>
                                    <span className="text-xl">{formatCurrency(total)}</span>
                                </div>
                                <Button size="lg" className="h-12 w-full text-base font-semibold">
                                    Bayar Sekarang
                                </Button>
                                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                                    Dengan melanjutkan pembayaran, kamu menyetujui S&amp;K Asuransi Pengiriman &amp; Proteksi.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    );
}
