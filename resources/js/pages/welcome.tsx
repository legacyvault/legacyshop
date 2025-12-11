import { formatPublishedDate, getArticleExcerpt, getArticleLink, getArticleReadTime } from '@/components/articles/article-utils';
import ImageSequence from '@/components/image-sequence';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { IArticle, IBanner, IEventProduct, IProducts, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const ArticlesSection = ({ articles }: { articles: IArticle[] }) => {
    if (!articles.length) return null;
    const featuredArticle = articles[0];
    const secondaryArticles = articles.slice(1, 4);

    const featuredReadTime = getArticleReadTime(featuredArticle);

    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-5xl font-bold text-primary">NEWS & ARTICLES</h2>
                    <p className="mx-auto max-w-6xl text-xl text-muted-foreground">
                        Unlock everything. From game-breaking easter eggs and honest product reviews to what's trending in the world of pop culture
                        and entertainment. Your quick, fun briefing on all things awesome.
                    </p>
                    <Link href={'/articles'}>
                        <Button className="mt-4">Explore More</Button>
                    </Link>
                </div>

                <Link href={getArticleLink(featuredArticle)}>
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className="group relative block overflow-hidden bg-muted" aria-label={`Read article ${featuredArticle.title}`}>
                            <div className="aspect-[16/11] w-full overflow-hidden">
                                <img
                                    src={featuredArticle.image_cover ?? '/banner-example.jpg'}
                                    alt={featuredArticle.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        <article className="flex flex-col justify-center">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                Featured
                            </span>
                            <div className="mt-4 block">
                                <h3 className="text-3xl leading-tight font-bold text-foreground transition hover:text-primary">
                                    {featuredArticle.title}
                                </h3>
                            </div>
                            <p className="mt-4 text-lg text-muted-foreground">{getArticleExcerpt(featuredArticle, 200)}</p>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                                    {featuredArticle.title?.slice(0, 1).toUpperCase() ?? 'L'}
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-foreground">Legacy Vault Team</p>
                                    <p className="text-muted-foreground">
                                        {formatPublishedDate(featuredArticle.published_at)}
                                        {featuredReadTime ? ` • ${featuredReadTime}` : ''}
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>
                </Link>
                {secondaryArticles.length > 0 && (
                    <div className="mt-12 grid gap-8 md:grid-cols-2">
                        {secondaryArticles.map((article) => {
                            const readTime = getArticleReadTime(article);

                            return (
                                <Link href={getArticleLink(article)}>
                                    <article
                                        key={article.id}
                                        className="group flex h-full flex-col overflow-hidden bg-background transition hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        <div
                                            className="relative block aspect-[16/10] overflow-hidden bg-muted"
                                            aria-label={`Read article ${article.title}`}
                                        >
                                            <img
                                                src={article.image_cover ?? '/banner-example.jpg'}
                                                alt={article.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
                                            <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                                                Article
                                            </span>
                                            <div className="mt-4 block">
                                                <h4 className="text-xl leading-tight font-semibold text-foreground transition group-hover:text-primary">
                                                    {article.title}
                                                </h4>
                                            </div>
                                            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{getArticleExcerpt(article)}</p>
                                            <div className="mt-auto flex items-center justify-between pt-6 text-sm text-muted-foreground">
                                                <div>
                                                    {formatPublishedDate(article.published_at)}
                                                    {readTime ? ` • ${readTime}` : ''}
                                                </div>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5 transition group-hover:translate-x-1"
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="M13 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

const BannerCarousel = ({ banners }: { banners: IBanner[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const hasMultiple = banners.length > 1;

    useEffect(() => {
        setCurrentIndex(0);
    }, [banners.length]);

    useEffect(() => {
        if (!hasMultiple) return;

        const intervalId = setInterval(() => {
            setCurrentIndex((prev) => {
                const nextIndex = prev + 1;
                return nextIndex >= banners.length ? 0 : nextIndex;
            });
        }, 5000);

        return () => clearInterval(intervalId);
    }, [banners.length, hasMultiple]);

    if (!banners.length) {
        return null;
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex >= banners.length ? 0 : nextIndex;
        });
    };

    const goToPrev = () => {
        setCurrentIndex((prev) => {
            const prevIndex = prev - 1;
            return prevIndex < 0 ? banners.length - 1 : prevIndex;
        });
    };

    return (
        <section className="relative h-[70vh] w-full overflow-hidden">
            {banners.map((banner, index) => {
                const isActive = index === currentIndex;

                return (
                    <div
                        key={banner.id ?? index}
                        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
                            isActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                        style={{ backgroundImage: `url('${banner.picture_url ?? '/banner-example.jpg'}')` }}
                        onClick={() => window.location.replace(banner.url)}
                    >
                        <div className="absolute inset-0 bg-black/30" />

                        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center text-background">
                            {banner.banner_title && <h1 className="text-6xl font-bold md:text-7xl">{banner.banner_title}</h1>}
                            {banner.banner_text && <h4 className="mt-4 text-lg font-medium">{banner.banner_text}</h4>}
                            {banner.button_text && (
                                <div>
                                    <Button
                                        onClick={() => window.location.replace(banner.url)}
                                        className="mt-6 bg-background text-foreground hover:bg-background"
                                    >
                                        {banner.button_text}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {hasMultiple && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-4">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrev();
                        }}
                        className="pointer-events-auto rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                        aria-label="Show previous banner"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                        className="pointer-events-auto rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                        aria-label="Show next banner"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {hasMultiple && (
                <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {banners.map((banner, index) => {
                        const isActive = index === currentIndex;

                        return (
                            <button
                                key={banner.id ?? `dot-${index}`}
                                type="button"
                                onClick={() => goToSlide(index)}
                                className={`h-2 w-2 rounded-full transition ${isActive ? 'w-6 bg-white' : 'bg-white/50'}`}
                                aria-label={`Go to banner ${index + 1}`}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
};

const ProductCardsSection = ({ products, title }: { products: IProducts[]; title: string }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [visibleCount, setVisibleCount] = useState(1);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const calculateVisibleCount = () => {
            const width = window.innerWidth;

            if (width >= 1280) return 5;
            if (width >= 1024) return 4;
            if (width >= 768) return 3;
            if (width >= 640) return 2;
            return 1;
        };

        const updateVisibleCount = () => {
            setVisibleCount(calculateVisibleCount());
        };

        updateVisibleCount();

        window.addEventListener('resize', updateVisibleCount);

        return () => {
            window.removeEventListener('resize', updateVisibleCount);
        };
    }, []);

    const slides = useMemo(() => {
        if (!products.length || visibleCount < 1) return [];

        const chunked: (IProducts | null)[][] = [];

        for (let i = 0; i < products.length; i += visibleCount) {
            const slice = products.slice(i, i + visibleCount);

            if (slice.length < visibleCount) {
                const placeholders = Array.from({ length: visibleCount - slice.length }, () => null);
                chunked.push([...slice, ...placeholders]);
            } else {
                chunked.push(slice);
            }
        }

        return chunked;
    }, [products, visibleCount]);

    useEffect(() => {
        if (!slides.length) {
            setActiveSlide(0);
            return;
        }

        setActiveSlide((current) => Math.min(current, slides.length - 1));
    }, [slides.length]);

    if (!slides.length) {
        return null;
    }

    const goToSlide = (direction: 'prev' | 'next') => {
        setActiveSlide((current) => {
            if (direction === 'prev') {
                return current === 0 ? slides.length - 1 : current - 1;
            }

            return current === slides.length - 1 ? 0 : current + 1;
        });
    };

    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-5xl font-bold text-primary">{title}</h2>
                </div>
                {/* Product Carousel */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Show previous products"
                        onClick={() => goToSlide('prev')}
                        className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
                    >
                        <span className="sr-only">Previous products</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                            {slides.map((slide, index) => (
                                <div key={index} className="flex w-full min-w-full shrink-0 basis-full gap-4 px-1">
                                    {slide.map((product, itemIndex) => (
                                        <div key={product ? product.id : `placeholder-${itemIndex}`} className="min-w-0 flex-1">
                                            {product ? (
                                                <ProductCard product={product} onClick={() => router.get(`/view-product/${product.id}`)} />
                                            ) : (
                                                <div className="h-full w-full opacity-0" aria-hidden="true" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Show next products"
                        onClick={() => goToSlide('next')}
                        className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
                    >
                        <span className="sr-only">Next products</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={`indicator-${index}`}
                            type="button"
                            onClick={() => setActiveSlide(index)}
                            className={`h-2 w-8 rounded-full transition ${activeSlide === index ? 'bg-primary' : 'bg-muted'}`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={activeSlide === index}
                        />
                    ))}
                </div>
                {/* Section Footer */}
                <div className="mt-12 text-center">
                    <Link href={'/list-products'}>
                        <Button className="mt-4">Explore More</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

const ProductCardsSectionEvent = ({ products, title }: { products: IEventProduct[]; title: string }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [visibleCount, setVisibleCount] = useState(1);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const calculateVisibleCount = () => {
            const width = window.innerWidth;

            if (width >= 1280) return 5;
            if (width >= 1024) return 4;
            if (width >= 768) return 3;
            if (width >= 640) return 2;
            return 1;
        };

        const updateVisibleCount = () => {
            setVisibleCount(calculateVisibleCount());
        };

        updateVisibleCount();

        window.addEventListener('resize', updateVisibleCount);

        return () => {
            window.removeEventListener('resize', updateVisibleCount);
        };
    }, []);

    const slides = useMemo(() => {
        if (!products.length || visibleCount < 1) return [];

        const chunked: (IEventProduct | null)[][] = [];

        for (let i = 0; i < products.length; i += visibleCount) {
            const slice = products.slice(i, i + visibleCount);

            if (slice.length < visibleCount) {
                const placeholders = Array.from({ length: visibleCount - slice.length }, () => null);
                chunked.push([...slice, ...placeholders]);
            } else {
                chunked.push(slice);
            }
        }

        return chunked;
    }, [products, visibleCount]);

    useEffect(() => {
        if (!slides.length) {
            setActiveSlide(0);
            return;
        }

        setActiveSlide((current) => Math.min(current, slides.length - 1));
    }, [slides.length]);

    if (!slides.length) {
        return null;
    }

    const goToSlide = (direction: 'prev' | 'next') => {
        setActiveSlide((current) => {
            if (direction === 'prev') {
                return current === 0 ? slides.length - 1 : current - 1;
            }

            return current === slides.length - 1 ? 0 : current + 1;
        });
    };

    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-5xl font-bold text-primary">{title}</h2>
                </div>
                {/* Product Carousel */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Show previous products"
                        onClick={() => goToSlide('prev')}
                        className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
                    >
                        <span className="sr-only">Previous products</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                            {slides.map((slide, index) => (
                                <div key={index} className="flex w-full min-w-full shrink-0 basis-full gap-4 px-1">
                                    {slide.map((product, itemIndex) => (
                                        <div key={product ? product.id : `placeholder-${itemIndex}`} className="min-w-0 flex-1">
                                            {product ? (
                                                <ProductCard product={product.product} onClick={() => router.get(`/view-product/${product.id}`)} />
                                            ) : (
                                                <div className="h-full w-full opacity-0" aria-hidden="true" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Show next products"
                        onClick={() => goToSlide('next')}
                        className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
                    >
                        <span className="sr-only">Next products</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={`indicator-${index}`}
                            type="button"
                            onClick={() => setActiveSlide(index)}
                            className={`h-2 w-8 rounded-full transition ${activeSlide === index ? 'bg-primary' : 'bg-muted'}`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={activeSlide === index}
                        />
                    ))}
                </div>
                {/* Section Footer */}
                <div className="mt-12 text-center">
                    <Link href={'/list-products'}>
                        <Button className="mt-4">Explore More</Button>
                    </Link>
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

    const { productsTop, productsBottom, units, banner, articles, events } = usePage<
        SharedData & { productsTop: IProducts[]; productsBottom: IProducts[] }
    >().props;

    const activeBanner = useMemo(() => {
        if (Array.isArray(banner)) {
            return banner as IBanner[];
        }

        if (banner) {
            return [banner as IBanner];
        }

        return [] as IBanner[];
    }, [banner]);

    console.log(events);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="">
                <FrontLayout auth={auth} locale={locale} translations={translations}>
                    {/* BANNER */}
                    {activeBanner.length > 0 && <BannerCarousel banners={activeBanner} />}

                    {/* UNIT SHOWCASE */}
                    {units.length > 0 && (
                        <section className="mx-auto mt-24 max-w-6xl px-4">
                            <div className="flex flex-wrap justify-center gap-6">
                                {units.map((unit) => (
                                    <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() => router.get(`/list-product/${unit.id}`)}
                                        className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl text-left shadow-md transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(33.333%_-_1rem)]"
                                        aria-label={`View products for ${unit.name}`}
                                    >
                                        {/* Background image layer with hover upscale */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-105"
                                            style={{
                                                backgroundImage: `url('${unit.picture_url ?? '/banner-example.jpg'}')`,
                                            }}
                                        />

                                        {/* Subtle overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Content */}
                                        {/* <div className="relative z-10 flex h-full flex-col justify-end p-4 text-white">
                                            <h3 className="text-xl font-semibold drop-shadow-sm">{unit.name}</h3>
                                        </div> */}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* EVENT SHOWCASE */}
                    {events.length > 0 && (
                        <section className="mx-auto mt-12 mb-48 max-w-6xl px-4">
                            <div className="flex flex-wrap justify-center gap-6">
                                {events.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl text-left shadow-md transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(33.333%_-_1rem)]"
                                        aria-label={`View products for ${event.name}`}
                                    >
                                        {/* Background image layer with hover upscale */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-105"
                                            style={{
                                                backgroundImage: `url('${event.picture_url ?? '/banner-example.jpg'}')`,
                                            }}
                                        />

                                        {/* Subtle overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Content */}
                                        {/* <div className="relative z-10 flex h-full flex-col justify-end p-4 text-white">
                                            <h3 className="text-xl font-semibold drop-shadow-sm">{unit.name}</h3>
                                        </div> */}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

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

                    {/* EVENT SHOWCASE PRODUCT SECTION */}

                    {events.length > 0 && (
                        <section>
                            {events.map((v) => (
                                <section key={v.id} id={`event-${v.id}`} className="my-8 scroll-mt-40">
                                    <ProductCardsSectionEvent products={v.event_products} title={v.name} />
                                </section>
                            ))}
                        </section>
                    )}

                    <div className="my-8">
                        <ProductCardsSection products={productsTop} title={'TOP SELLING ITEMS'} />
                    </div>

                    <div className="my-8">
                        <ProductCardsSection products={productsBottom} title={'SHOP PICKS OF THE MONTH'} />
                    </div>

                    <div className="my-8">
                        <ArticlesSection articles={articles} />
                    </div>
                </FrontLayout>
            </div>
        </>
    );
}
