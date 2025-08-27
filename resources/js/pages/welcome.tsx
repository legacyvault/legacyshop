import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

const ProductCardsSection = () => {
    const products = [
        {
            id: 1,
            name: 'GradeGuardian - UV Protected, Tempered Glass Graded PSA Trading Card Case - Gold',
            brand: 'KANTOFORGE',
            image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
            originalPrice: 561000,
            salePrice: 421000,
            isOnSale: true,
        },
        {
            id: 2,
            name: 'GradeGuardian - UV Protected, Tempered Glass Graded PSA Trading Card Case - Rainbow',
            brand: 'KANTOFORGE',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            originalPrice: 561000,
            salePrice: 421000,
            isOnSale: true,
        },
        {
            id: 3,
            name: 'GradeGuardian - UV Protected, Tempered Glass Graded PSA Trading Card Case - Silver',
            brand: 'KANTOFORGE',
            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
            originalPrice: 561000,
            salePrice: 421000,
            isOnSale: true,
        },
        {
            id: 4,
            name: 'GradeGuardian - UV Protected, Tempered Glass Graded PSA Trading Card Case - Blue',
            brand: 'KANTOFORGE',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
            originalPrice: 449000,
            salePrice: 337000,
            isOnSale: true,
        },
        {
            id: 5,
            name: 'GradeGuardian - UV Protected, Tempered Glass Graded PSA Trading Card Case - Black',
            brand: 'KANTOFORGE',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
            price: 485000,
            isOnSale: false,
        },
    ];

    return (
        <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-12 text-left">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900">GRADEGUARDIANS - LOWER PRICE!</h2>
                    <p className="max-w-2xl text-lg text-gray-600">
                        Premium UV protected trading card cases at unbeatable prices. Limited time offers available.
                    </p>
                </div>

                {/* Product Grid */}
                <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* See More Button */}
                <div className="text-center">
                    <button className="transform rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold tracking-wide text-white uppercase shadow-lg transition-colors duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl">
                        See More Cases
                    </button>
                </div>
            </div>
        </section>
    );
};

const ProductCard = ({ product }: any) => {
    const [isImageHovered, setIsImageHovered] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const calculateDiscount = (originalPrice: number, salePrice: number) => {
        return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    };

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
            {/* Sale Badge */}
            {product.isOnSale && (
                <div className="absolute top-3 left-3 z-10 rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">Sale</div>
            )}

            {/* Product Image */}
            <div className="relative h-64 overflow-hidden" onMouseEnter={() => setIsImageHovered(true)} onMouseLeave={() => setIsImageHovered(false)}>
                <img
                    src={product.image}
                    alt={product.name}
                    className={`h-full w-full object-contain transition-transform duration-500 ${isImageHovered ? 'scale-110' : 'scale-100'}`}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-30" />
            </div>

            {/* Product Info */}
            <div className="p-5">
                {/* Brand */}
                <div className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">{product.brand}</div>

                {/* Product Name */}
                <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium text-gray-900">{product.name}</h3>

                {/* Pricing */}
                <div className="flex flex-wrap items-center gap-2">
                    {product.isOnSale && (
                        <>
                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                            <span className="text-sm font-bold text-red-600">{formatPrice(product.salePrice)}</span>
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                                -{calculateDiscount(product.originalPrice, product.salePrice)}%
                            </span>
                        </>
                    )}
                    {!product.isOnSale && <span className="mb-7 text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>}
                </div>

                {/* Action Button */}
                <button className="mt-4 w-full transform rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800 active:scale-95">
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="">
                <header className="mb-6 w-full shadow-md">
                    <nav className="mx-auto grid max-w-[335px] grid-cols-4 items-center justify-between gap-4 py-6 md:max-w-7xl">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-foreground hover:border-[#1915014a]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <div className="col-span-3 flex w-full items-center gap-4">
                                    <Link
                                        href={route('home')}
                                        className="inline-block rounded-sm border border-transparent py-1.5 text-xl leading-normal font-bold text-foreground hover:border-[#19140035]"
                                    >
                                        LOGO
                                    </Link>

                                    <div className="relative hidden w-full md:block">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full rounded-md border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm text-gray-700 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                        />
                                        <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-foreground" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span>Cart</span>|
                                    <Link
                                        href={route('login')}
                                        className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal font-medium text-foreground hover:border-[#19140035]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal font-medium text-foreground hover:border-[#1915014a]"
                                    >
                                        Register
                                    </Link>
                                </div>
                            </>
                        )}
                    </nav>
                </header>

                {/* HERO SECTION */}

                <div className="mx-auto mb-16 md:max-w-7xl">
                    <h1 className="mb-10 text-center text-5xl font-black text-primary">Welcome to LegacyVault</h1>
                    <p className="mb-4 text-center">
                        Here at LegacyVault, we're all about the details. And when we say "custom," we mean it! Our super talented squad crafts these
                        extended backgrounds with so much love and care, it would make a Jigglypuff jealous! We're talking mind-blowingly gorgeous
                        custom artwork tailored to your favourite cards.
                    </p>
                    <p className="text-center">
                        We totally get it. Your Pokémon cards are more than just cardboard - they're a piece of you, a part of your story. That's why
                        we're here to not just protect 'em but also to glam 'em up. We create stellar protective cases with insane, customized
                        extended backgrounds that will make your collection the envy of all.
                    </p>
                </div>

                {/* 3D SECTION */}
                <div className="h-[1200px] bg-amber-600">
                    <span>3 nya di mulai dari sini</span>
                </div>

                <div className="my-8">
                    <ProductCardsSection />
                </div>
            </div>
        </>
    );
}
