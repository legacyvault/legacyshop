import ImageSequence from '@/components/image-sequence';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { IRootProducts, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const ProductCardsSection = ({ products }: { products: IRootProducts | undefined }) => {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-12 text-left">
                    <h2 className="mb-4 text-5xl font-bold text-primary">GRADEGUARDIANS - LOWER PRICE!</h2>
                    <p className="max-w-2xl text-xl text-muted-foreground">
                        Premium UV protected trading card cases at unbeatable prices. Limited time offers available.
                    </p>
                    <Link href={'/list-products'}>
                        <Button className="mt-4">See More Cases</Button>
                    </Link>
                </div>

                {/* Product Grid */}
                <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {products?.data.map((product) => (
                        <ProductCard key={product.id} product={product} onClick={() => router.get(`/view-product/${product.id}`)} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default function Welcome() {
    const { auth, translations, locale } = usePage<SharedData>().props;

    const textRef1 = useRef<HTMLDivElement | null>(null);
    const textRef2 = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!textRef1.current && !textRef2.current) return;

        // 👇 Intro reveal (on first load)
        gsap.from([textRef1.current, textRef2.current], {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.2,
        });

        gsap.from(bottomRef.current, {
            opacity: 0,
            y: 100,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: bottomRef.current,
                start: 'top 80%', // reveal when top enters 80% of viewport
                toggleActions: 'play none none reverse',
            },
        });
    }, []);

    const { products: productsPayload } = usePage<{ products?: IRootProducts }>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="">
                <FrontLayout auth={auth} locale={locale} translations={translations}>
                    {/* BANNER */}
                    <section className="min-h-[400px] w-full bg-[url('/banner-example.jpg')] bg-cover"></section>

                    <div className="mx-auto my-12 max-w-2xl">
                        <h1 className="text-center text-4xl font-bold">Welcome to Legacy Vault</h1>
                        <h4 className="font- mt-4 text-center text-lg">
                            At LegacyVault, we believe every detail matters. When we say custom, we mean truly one-of-a-kind. Our skilled design team
                            pours passion and precision into creating extended backgrounds that elevate your favorite cards into stunning works of
                            art.
                        </h4>
                    </div>

                    {/* HERO + SEQUENCE SECTION */}
                    <section className="relative flex h-[200vh] w-full flex-col bg-primary">
                        {/* Image sequence pinned behind */}
                        <div className="h-screen w-full">
                            <ImageSequence />
                        </div>

                        {/* Overlay text */}
                        <div className="absolute top-0 flex h-screen w-full flex-col items-center justify-center text-center text-white">
                            <h1 ref={textRef1} className="mb-6 text-5xl font-black drop-shadow-lg md:text-7xl">
                                {translations.home.welcome}
                            </h1>
                            <p ref={textRef2} className="max-w-2xl px-4 text-lg md:text-xl">
                                {translations.home.description1}
                            </p>
                        </div>

                        {/* Scroll down to reveal more content */}
                        <div ref={bottomRef} className="relative z-10 mt-auto py-24 text-center">
                            <h2 className="mx-auto mb-6 max-w-3xl text-xl font-bold text-background">{translations.home.description2}</h2>
                            <p className="mx-auto max-w-xl text-background">
                                Discover more about our work, technology, and how we bring ideas to life.
                            </p>
                            <Button className="mt-8 bg-background text-foreground transition hover:scale-105" variant={'secondary'}>
                                Get Started
                            </Button>
                        </div>
                    </section>

                    <div className="my-8">
                        <ProductCardsSection products={productsPayload} />
                    </div>
                </FrontLayout>
            </div>
        </>
    );
}
