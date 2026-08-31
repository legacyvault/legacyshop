import { formatPublishedDate, getArticleExcerpt, getArticleLink, getArticleReadTime } from '@/components/articles/article-utils';
import ImageSequence from '@/components/image-sequence';
import ProductCard from '@/components/product-card';
import Seo from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Casestudy5, type CasestudyItem } from '@/components/ui/casestudy-5';
import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';
import FrontLayout from '@/layouts/front/front-layout';
import { IArticle, IBanner, IEventProduct, IProducts, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

// Same three steps we walk through on the About Us page, trimmed for the homepage.
const homeCraftSteps = [
    {
        step: 'I.',
        title: 'Reference',
        description:
            'We study the original card art frame by frame - line weight, light source, color palette, illustrator art-style - until we understand it well enough to continue it by hand.',
    },
    {
        step: 'II.',
        title: 'Hand-Drawn Extension',
        description:
            "The artwork is extended stroke by stroke, matching the original artist's linework so the transition feels seamless - each piece handled by an illustrator who specializes in that art style.",
    },
    {
        step: 'III.',
        title: 'Quality Check',
        description:
            "Every Extended Art is checked by hand against an actual card. We match the card's color and texture, then finish it with a fine glitter coat so it feels as premium as it looks.",
    },
];

const toCasestudyItem = (article: IArticle, label: string, excerptLength = 140): CasestudyItem => {
    const readTime = getArticleReadTime(article);

    return {
        company: label,
        tags: [formatPublishedDate(article.published_at), readTime].filter(Boolean).join(' / ').toUpperCase(),
        title: article.title,
        subtitle: getArticleExcerpt(article, excerptLength),
        image: article.thumbnail_url ?? article.image_cover ?? '/banner-example.jpg',
        link: getArticleLink(article),
    };
};

const ArticlesSection = ({ articles }: { articles: IArticle[] }) => {
    if (!articles.length) return null;

    const featuredArticle = toCasestudyItem(articles[0], 'Featured', 140);
    const latestArticle = articles.slice(1, 2).map((article) => toCasestudyItem(article, 'Latest', 90));

    return (
        <section className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Casestudy5
                    featuredCasestudy={featuredArticle}
                    casestudies={latestArticle}
                    ctaLabel="Read article"
                    linkComponent={Link}
                    className=""
                    aside={
                        <>
                            <h2 className="mb-2 font-pixel text-2xl font-bold text-primary md:text-3xl">NEWS &amp; ARTICLES</h2>
                            <p className="text-sm text-muted-foreground">
                                Get latest news from what’s happening in the world of Cards &amp; Collectibles.
                            </p>
                            <Link href={'/articles'} className="mt-4 w-fit">
                                <Button size="sm">Explore More</Button>
                            </Link>
                        </>
                    }
                />
            </div>
        </section>
    );
};

const SLIDE_TRANSITION_MS = 700;
const DRAG_CLICK_SLOP = 6;
const DRAG_FLICK_RATIO = 0.12;

const BannerCarousel = ({ banners }: { banners: IBanner[] }) => {
    const total = banners.length;
    const isLooping = total > 1;

    const loopedBanners = useMemo(() => (isLooping ? [...banners, ...banners, ...banners] : banners), [banners, isLooping]);

    const [trackIndex, setTrackIndex] = useState(isLooping ? total : 0);
    const [isAnimated, setIsAnimated] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [metrics, setMetrics] = useState({ viewportWidth: 0, slideWidth: 0, slideHeight: 0 });
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const dragStartXRef = useRef(0);
    const hasDraggedRef = useRef(false);

    const activeIndex = isLooping ? ((trackIndex % total) + total) % total : 0;

    useEffect(() => {
        setIsAnimated(true);
        setTrackIndex(total > 1 ? total : 0);
    }, [total]);

    // Two slides across on desktop: the centred banner plus half of each neighbour at the edges.
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const measure = () => {
            const width = viewport.clientWidth;
            if (!width) return;

            const perView = window.innerWidth >= 1024 ? Math.min(2, loopedBanners.length) : window.innerWidth >= 640 ? 1.6 : 1.15;
            const slideWidth = width / perView;

            // Every slide is a 16:9 landscape, so the track height follows the slide width.
            setMetrics({ viewportWidth: width, slideWidth, slideHeight: (slideWidth * 9) / 16 });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        window.addEventListener('resize', measure);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [loopedBanners.length]);

    useEffect(() => {
        if (!isLooping || isPaused) return;

        const intervalId = setInterval(() => setTrackIndex((prev) => prev + 1), 5000);

        return () => clearInterval(intervalId);
    }, [isLooping, isPaused]);

    // Once a move has played out, jump back into the middle copy without animating.
    useEffect(() => {
        if (!isLooping) return;
        if (trackIndex >= total && trackIndex < total * 2) return;

        const timeoutId = setTimeout(
            () => {
                setIsAnimated(false);
                setTrackIndex((prev) => (prev < total ? prev + total : prev - total));
            },
            isAnimated ? SLIDE_TRANSITION_MS : 0,
        );

        return () => clearTimeout(timeoutId);
    }, [trackIndex, total, isLooping, isAnimated]);

    // Re-arm the transition on the frame after the silent jump has painted.
    useEffect(() => {
        if (isAnimated) return;

        const frameId = requestAnimationFrame(() => requestAnimationFrame(() => setIsAnimated(true)));

        return () => cancelAnimationFrame(frameId);
    }, [isAnimated]);

    if (!total) {
        return null;
    }

    // Move to the nearest copy of the requested banner so the track never rewinds the long way.
    const goToBanner = (index: number) => {
        if (!isLooping) return;

        let delta = index - activeIndex;
        if (delta > total / 2) delta -= total;
        if (delta < -total / 2) delta += total;

        setTrackIndex((prev) => prev + delta);
    };

    const openBanner = (banner: IBanner) => {
        if (banner.url) window.location.assign(banner.url);
    };

    const { viewportWidth, slideWidth, slideHeight } = metrics;
    const trackOffset = slideWidth ? viewportWidth / 2 - (trackIndex + 0.5) * slideWidth : 0;

    const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isLooping || !slideWidth || event.button !== 0) return;

        dragStartXRef.current = event.clientX;
        hasDraggedRef.current = false;
        setIsDragging(true);
        setIsPaused(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const distance = event.clientX - dragStartXRef.current;
        if (Math.abs(distance) > DRAG_CLICK_SLOP) hasDraggedRef.current = true;

        setDragOffset(distance);
    };

    // Land on whichever slide the drag ended nearest to; a short flick still moves one slide.
    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        let steps = Math.round(-dragOffset / slideWidth);
        if (steps === 0 && Math.abs(dragOffset) > slideWidth * DRAG_FLICK_RATIO) {
            steps = dragOffset < 0 ? 1 : -1;
        }

        setIsDragging(false);
        setDragOffset(0);
        setIsPaused(false);
        if (steps !== 0) setTrackIndex((prev) => prev + steps);
    };

    return (
        <section
            className="relative w-full pb-6"
            aria-roledescription="carousel"
            aria-label="Featured banners"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
        >
            <div
                ref={viewportRef}
                className={`relative touch-pan-y overflow-hidden select-none ${isLooping ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                <div
                    className={`flex h-[49vw] items-center ease-out sm:h-[35vw] lg:h-[28vw] ${
                        isAnimated && !isDragging ? 'transition-transform duration-700 motion-reduce:transition-none' : ''
                    }`}
                    style={{ height: slideHeight || undefined, transform: `translate3d(${trackOffset + dragOffset}px, 0, 0)` }}
                >
                    {loopedBanners.map((banner, index) => {
                        const bannerIndex = index % total;
                        const isActive = index === trackIndex;

                        return (
                            <div
                                key={`${banner.id ?? bannerIndex}-${index}`}
                                className="h-full shrink-0"
                                style={{ width: slideWidth || '100%' }}
                                aria-hidden={!isActive}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasDraggedRef.current) return;
                                        if (isActive) openBanner(banner);
                                        else goToBanner(bannerIndex);
                                    }}
                                    draggable={false}
                                    tabIndex={isActive ? 0 : -1}
                                    aria-label={isActive ? banner.banner_title || 'Open banner' : `Show banner ${bannerIndex + 1}`}
                                    className={`group relative block h-full w-full overflow-hidden bg-muted text-left ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset ${
                                        isAnimated ? 'transition-[opacity,filter] duration-700 motion-reduce:transition-none' : ''
                                    } ${isActive ? 'opacity-100 brightness-100' : 'opacity-60 brightness-[0.55] hover:opacity-80 hover:brightness-75'}`}
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                        style={{ backgroundImage: `url('${banner.picture_url ?? '/banner-example.jpg'}')` }}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isLooping && (
                <div className="mt-5 flex items-center justify-center gap-2">
                    {banners.map((banner, index) => {
                        const isActive = index === activeIndex;

                        return (
                            <button
                                key={banner.id ?? `dot-${index}`}
                                type="button"
                                onClick={() => goToBanner(index)}
                                className={`h-2 rounded-full transition-all ${isActive ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                                aria-label={`Go to banner ${index + 1}`}
                                aria-current={isActive}
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
            return 2;
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
                                <div key={index} className="flex w-full min-w-full shrink-0 basis-full gap-2 px-1 sm:gap-4">
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

const ProductCardsSectionEvent = ({ products, title, event_id }: { products: IEventProduct[]; title: string; event_id: string }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [visibleCount, setVisibleCount] = useState(1);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const calculateVisibleCount = () => {
            const width = window.innerWidth;

            if (width >= 1280) return 5;
            if (width >= 1024) return 4;
            if (width >= 768) return 3;
            return 2;
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
                    <h2 className="mb-4 font-pixel text-4xl font-bold text-primary">{title}</h2>
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
                                <div key={index} className="flex w-full min-w-full shrink-0 basis-full gap-2 px-1 sm:gap-4">
                                    {slide.map((product, itemIndex) => (
                                        <div key={product ? product.id : `placeholder-${itemIndex}`} className="min-w-0 flex-1">
                                            {product ? (
                                                <ProductCard
                                                    product={product.product}
                                                    onClick={() => router.get(`/view-product/${product.product_id}`)}
                                                />
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
                    <Link href={`/list-product/${event_id}`}>
                        <Button className="mt-4">Explore More</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

function Welcome() {
    const { translations } = usePage<SharedData>().props;

    const { productsTop, productsBottom, units, banner, articles, events, testimonials } = usePage<
        SharedData & { productsTop: IProducts[]; productsBottom: IProducts[] }
    >().props;

    const activeTestimonials = useMemo(() => (Array.isArray(testimonials) ? testimonials : []), [testimonials]);

    // A unit tile is nothing but its artwork, so skip any unit without one
    const unitsWithImage = useMemo(
        () => (Array.isArray(units) ? units.filter((unit) => Boolean(unit.thumbnail_url || unit.picture_url)) : []),
        [units],
    );

    // Only events flagged for the homepage, and only while they are active
    const homepageEvents = useMemo(
        () => (Array.isArray(events) ? events.filter((event) => Boolean(event.is_active) && Boolean(event.show_on_homepage)) : []),
        [events],
    );

    const activeBanner = useMemo(() => {
        if (Array.isArray(banner)) {
            return banner as IBanner[];
        }

        if (banner) {
            return [banner as IBanner];
        }

        return [] as IBanner[];
    }, [banner]);

    return (
        <>
            <Seo
                title="Extended Art Trading Cards & Collectibles"
                description="Legacy Vault crafts hand-drawn Extended Art trading cards and collectibles. Browse top-selling items, seasonal events and curated shop picks."
            />
            <div className="">
                {/* BANNER */}
                {activeBanner.length > 0 && <BannerCarousel banners={activeBanner} />}

                {/* UNIT SHOWCASE */}
                {unitsWithImage.length > 0 && (
                    <section className={`mx-auto mt-24 max-w-6xl px-4 ${homepageEvents.length === 0 ? 'mb-48' : ''}`}>
                        <div className="flex flex-wrap justify-center gap-6">
                            {unitsWithImage.map((unit) => (
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
                                            backgroundImage: `url('${unit.thumbnail_url || unit.picture_url}')`,
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
                {homepageEvents.length > 0 && (
                    <section className="mx-auto my-12 max-w-6xl px-4">
                        <div className="flex flex-wrap justify-center gap-6">
                            {homepageEvents.map((event) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => router.get(`/list-product/${event.id}`)}
                                    className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl text-left shadow-md transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(33.333%_-_1rem)]"
                                    aria-label={`View products for ${event.name}`}
                                >
                                    {/* Background image layer with hover upscale */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url('${event.thumbnail_url ?? event.picture_url ?? '/banner-example.jpg'}')`,
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
                {/* HERO + SEQUENCE + CRAFT — one section, at least a full viewport tall: copy beside the sequence, craft steps underneath */}
                <section className="flex w-full flex-col bg-primary py-12 text-primary-foreground lg:min-h-screen lg:py-8">
                    {/* Rows keep a fixed rhythm and the block as a whole is centred, so leftover viewport height
                        spills evenly above and below instead of stretching the gap between the two rows. */}
                    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-4 sm:px-6 lg:gap-16">
                        {/* Row 1 — copy on the left, sequence on the right (playback is driven by hover) */}
                        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="h-px w-7 bg-primary-foreground/60" />
                                    <span className="text-xs font-bold tracking-widest text-primary-foreground/70 uppercase">
                                        Legacy Vault - Hand-Drawn Extended Art
                                    </span>
                                </div>
                                <h1 className="font-pixel text-3xl leading-snug font-black text-balance text-primary-foreground lg:text-4xl">
                                    Every card deserves to break its frame.
                                </h1>

                                <p className="mt-5 max-w-xl text-sm text-primary-foreground/80">{translations.home.description1}</p>
                                <p className="mt-3 max-w-xl text-sm text-primary-foreground/80">{translations.home.description2}</p>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <Link href="/list-products">
                                        <Button className="bg-primary-foreground px-7 text-primary transition hover:scale-105 hover:bg-primary-foreground/90">
                                            Browse Extended Art
                                        </Button>
                                    </Link>
                                    <Link href="/about-us">
                                        <Button
                                            variant="outline"
                                            className="border-primary-foreground/50 bg-transparent px-7 text-primary-foreground transition hover:scale-105 hover:bg-primary-foreground hover:text-primary"
                                        >
                                            Our Story
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Square so the card render never letterboxes */}
                            <div className="mx-auto aspect-square w-full max-w-xl">
                                <ImageSequence />
                            </div>
                        </div>

                        {/* Row 2 — THE CRAFT: the three steps behind every piece */}
                        <div className="grid shrink-0 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
                            {homeCraftSteps.map((item) => (
                                <div key={item.step} className="border-t border-primary-foreground/25 pt-5">
                                    <span className="block font-pixel text-lg font-bold text-primary-foreground italic">{item.step}</span>
                                    <h3 className="text-md mt-3 font-pixel font-semibold text-primary-foreground">{item.title}</h3>
                                    <p className="mt-3 text-sm text-primary-foreground/75">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* EVENT SHOWCASE PRODUCT SECTION */}

                {homepageEvents.length > 0 && (
                    <section>
                        {homepageEvents.map((v) => (
                            <section key={v.id} id={`event-${v.id}`} className="my-8 scroll-mt-40">
                                <ProductCardsSectionEvent products={v.event_products} title={v.name} event_id={v.id} />
                            </section>
                        ))}
                    </section>
                )}

                {/* TESTIMONIALS */}
                {activeTestimonials.length > 0 && (
                    <section className="my-8 py-16">
                        <div className="mx-auto -mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-12 text-center">
                                <h2 className="mb-4 font-pixel text-2xl font-bold text-primary md:text-3xl">WHAT COLLECTORS SAY</h2>
                                <p className="text-sm text-muted-foreground">Hear from the collectors and sellers who trade with us every day.</p>
                            </div>
                        </div>
                        <StaggerTestimonials testimonials={activeTestimonials} />
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
            </div>
        </>
    );
}

Welcome.layout = (page: ReactNode) => <FrontLayout>{page}</FrontLayout>;

export default Welcome;
