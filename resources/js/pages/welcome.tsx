import { formatPublishedDate, getArticleExcerpt, getArticleLink, getArticleReadTime } from '@/components/articles/article-utils';
import ImageSequence from '@/components/image-sequence';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { IArticle, IBanner, IEventProduct, IProducts, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

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
                    <h2 className="mb-4 text-5xl font-bold text-primary font-pixel">NEWS & ARTICLES</h2>
                    <p className="mx-auto max-w-6xl text-xl text-muted-foreground">
                        Get latest news from what’s happening in the world of Cards & Collectibles.
                    </p>
                    <Link href={'/articles'}>
                        <Button className="mt-4">Explore More</Button>
                    </Link>
                </div>

                <Link href={getArticleLink(featuredArticle)}>
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className="group relative block overflow-hidden bg-muted" aria-label={`Read article ${featuredArticle.title}`}>
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-md">
                                <img
                                    src={featuredArticle.thumbnail_url ?? featuredArticle.image_cover ?? '/banner-example.jpg'}
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
                                                src={article.thumbnail_url ?? article.image_cover ?? '/banner-example.jpg'}
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

    const textRef1 = useRef<HTMLDivElement | null>(null);
    const textRef2 = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!textRef1.current || !textRef2.current || !bottomRef.current) return;

        // Scope GSAP instances so React Strict Mode double-runs don't orphan DOM nodes
        const ctx = gsap.context(() => {
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
        });

        return () => ctx.revert();
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

    return (
        <>
            <div className="">
                {/* BANNER */}
                {activeBanner.length > 0 && <BannerCarousel banners={activeBanner} />}

                {/* UNIT SHOWCASE */}
                {units.length > 0 && (
                    <section className={`mx-auto mt-24 max-w-6xl px-4 ${events.length === 0 ? 'mb-48' : ''}`}>
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
                                            backgroundImage: `url('${unit.thumbnail_url ?? unit.picture_url ?? '/banner-example.jpg'}')`,
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
                {/* HERO + SEQUENCE SECTION */}
                <section className="w-full overflow-hidden bg-background py-24 text-foreground">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        {/* Headline on the first row, supporting copy + CTA right-aligned on the second */}
                        <div className="flex flex-col gap-4 lg:gap-8">
                            <h1 ref={textRef1} className="font-pixel text-3xl text-center font-black text-balance md:text-3xl">
                                {translations.home.welcome}
                            </h1>

                            <div className="self-center text-center">
                                <p ref={textRef2} className="md:text-md max-w-xl text-sm text-muted-foreground">
                                    {translations.home.description1}
                                </p>

                                <div ref={bottomRef} className="mt-8 flex flex-wrap items-center gap-3 justify-center">
                                    <Button className="px-7 transition hover:scale-105">Get Started</Button>
                                    <Button variant={'outline'} className="px-7 transition hover:scale-105">
                                        How it works
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Caption on the left, sequence on the right — playback is driven by hover */}
                        <div className="mt-16 flex flex-col items-start gap-8 rounded-3xl bg-primary p-8 text-white/70 lg:flex-row lg:gap-16 lg:p-12">
                            <p className="max-w-md text-md lg:flex-[0_1_22rem]">{translations.home.description2}</p>

                            <div className="aspect-square w-full lg:aspect-[4/3] lg:flex-1">
                                <ImageSequence />
                            </div>
                        </div>
                    </div>
                </section>

                {/* EVENT SHOWCASE PRODUCT SECTION */}

                {events.length > 0 && (
                    <section>
                        {events.map((v) => (
                            <section key={v.id} id={`event-${v.id}`} className="my-8 scroll-mt-40">
                                <ProductCardsSectionEvent products={v.event_products} title={v.name} event_id={v.id} />
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
            </div>
        </>
    );
}

Welcome.layout = (page: ReactNode) => <FrontLayout>{page}</FrontLayout>;

export default Welcome;
