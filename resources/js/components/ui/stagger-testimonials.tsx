import { cn } from '@/lib/utils';
import { ITestimonial } from '@/types';
import { ChevronLeft, ChevronRight, Instagram, Star } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface TestimonialItem extends ITestimonial {
    tempId: number;
}

// Liquid-chrome card back, generated rather than shipped as an asset.
// A banded black/grey gradient is warped by a turbulence displacement map — the warp is what
// produces the oily flowing ribbons and their cusps. Highlights stop at mid-grey so nothing flares.
const CHROME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="900" y2="1260">
      <stop offset="0" stop-color="#050505"/>
      <stop offset="0.083" stop-color="#c0c0c0"/>
      <stop offset="0.167" stop-color="#050505"/>
      <stop offset="0.25" stop-color="#5f5f5f"/>
      <stop offset="0.333" stop-color="#050505"/>
      <stop offset="0.417" stop-color="#c0c0c0"/>
      <stop offset="0.5" stop-color="#050505"/>
      <stop offset="0.583" stop-color="#5f5f5f"/>
      <stop offset="0.667" stop-color="#050505"/>
      <stop offset="0.75" stop-color="#c0c0c0"/>
      <stop offset="0.833" stop-color="#050505"/>
      <stop offset="0.917" stop-color="#5f5f5f"/>
      <stop offset="1" stop-color="#050505"/>
    </linearGradient>
    <filter id="c" filterUnits="userSpaceOnUse" x="0" y="0" width="900" height="1260" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0030" numOctaves="2" seed="9" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="220" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feFlood flood-color="#060606" result="bg"/>
      <feMerge result="filled">
        <feMergeNode in="bg"/>
        <feMergeNode in="d"/>
      </feMerge>
      <feGaussianBlur in="filled" stdDeviation="0.8"/>
    </filter>
  </defs>
  <rect width="900" height="1260" fill="url(#g)" filter="url(#c)"/>
</svg>`;

// One shared data URI for every card, so the browser rasterises the texture once.
const CHROME_TEXTURE = `url("data:image/svg+xml,${encodeURIComponent(CHROME_SVG)}")`;

// Each element palette repaints the whole card: outer frame, inner face, art border and divider.
// Classes are written out in full so Tailwind's scanner keeps them.
const ELEMENTS = [
    {
        name: 'Electric',
        frame: 'from-yellow-300 via-amber-400 to-yellow-500',
        face: 'from-yellow-50 to-amber-100 border-amber-700/40',
        art: 'from-yellow-500 to-amber-600',
        divider: 'border-amber-700/25',
    },
    {
        name: 'Fire',
        frame: 'from-orange-300 via-red-400 to-orange-600',
        face: 'from-orange-50 to-red-100 border-red-800/40',
        art: 'from-orange-500 to-red-600',
        divider: 'border-red-800/25',
    },
    {
        name: 'Water',
        frame: 'from-sky-300 via-blue-400 to-sky-600',
        face: 'from-sky-50 to-blue-100 border-sky-800/40',
        art: 'from-sky-500 to-blue-600',
        divider: 'border-sky-800/25',
    },
    {
        name: 'Grass',
        frame: 'from-lime-300 via-emerald-400 to-green-600',
        face: 'from-lime-50 to-emerald-100 border-emerald-800/40',
        art: 'from-emerald-500 to-green-600',
        divider: 'border-emerald-800/25',
    },
    {
        name: 'Psychic',
        frame: 'from-fuchsia-300 via-purple-400 to-violet-600',
        face: 'from-fuchsia-50 to-purple-100 border-purple-800/40',
        art: 'from-fuchsia-500 to-purple-600',
        divider: 'border-purple-800/25',
    },
    {
        name: 'Fighting',
        frame: 'from-amber-400 via-orange-500 to-amber-700',
        face: 'from-orange-50 to-amber-100 border-orange-900/40',
        art: 'from-orange-600 to-amber-700',
        divider: 'border-orange-900/25',
    },
    {
        name: 'Darkness',
        frame: 'from-slate-400 via-slate-600 to-slate-800',
        face: 'from-slate-50 to-slate-200 border-slate-800/50',
        art: 'from-slate-600 to-slate-800',
        divider: 'border-slate-800/30',
    },
    {
        name: 'Metal',
        frame: 'from-zinc-200 via-zinc-400 to-zinc-500',
        face: 'from-zinc-50 to-zinc-200 border-zinc-600/50',
        art: 'from-zinc-400 to-zinc-600',
        divider: 'border-zinc-600/30',
    },
    {
        name: 'Fairy',
        frame: 'from-pink-300 via-rose-400 to-pink-500',
        face: 'from-pink-50 to-rose-100 border-pink-800/40',
        art: 'from-pink-500 to-rose-600',
        divider: 'border-pink-800/25',
    },
];

// Card stats are derived from the name so they stay stable across shuffles
// (tempId is re-rolled on every move).
const statFromName = (name: string, total: number) => {
    const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return {
        number: String((seed % Math.max(total, 1)) + 1).padStart(3, '0'),
        element: ELEMENTS[seed % ELEMENTS.length],
    };
};

// The stagger used to be scale(1.04) centre / scale(0.82) side. Upscaling a composited layer
// resamples its text, so the centre's 1.04 now lives in layout and only the sides are transformed.
// Both cards keep the exact on-screen sizes they had before.
const CENTRE_ZOOM = 1.04;
const SIDE_SCALE = 0.82 / CENTRE_ZOOM;

const toEven = (value: number) => Math.round(value / 2) * 2;

interface TestimonialCardProps {
    position: number;
    testimonial: TestimonialItem;
    handleMove: (steps: number) => void;
    cardSize: number;
    total: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ position, testimonial, handleMove, cardSize, total }) => {
    const isCenter = position === 0;
    const name = testimonial.name;
    const { number, element } = statFromName(name, total);
    // translate(-50%, -50%) of an odd length lands on a half pixel and resamples the whole
    // layer, so both dimensions are snapped to even numbers.
    const centreWidth = toEven(cardSize * CENTRE_ZOOM);
    const centreHeight = toEven(centreWidth * 1.4);

    const faceShadow = isCenter ? '0 18px 40px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(120,80,0,0.35)' : '0 8px 20px -10px rgba(0,0,0,0.35)';
    // Foil animation repaints rather than composites, so only the backs actually in view get it.
    const isNearCentre = Math.abs(position) <= 2;
    // Only the trio is on show; the pair beyond it stays mounted but invisible so cards have
    // somewhere to fade in from and out to instead of popping.
    const isVisible = Math.abs(position) <= 1;

    return (
        // Outer shell stays 2D: it owns the stagger placement and the stacking order.
        // 3D sorting would override z-index, so the flip lives one level down.
        <div
            onClick={() => handleMove(position)}
            className={cn(
                'absolute top-1/2 left-1/2 cursor-pointer transition-[transform,opacity] duration-500 ease-in-out',
                isCenter ? 'z-10' : 'z-0 saturate-[0.85]',
                !isVisible && 'pointer-events-none opacity-0',
            )}
            style={{
                // Laid out at the centre card's full size so the centre sits at scale(1) and its
                // text rasterises at native resolution. The compositor caches one texture for the
                // whole transition, so any scale > 1 here would be a visible upscale of that texture.
                width: centreWidth,
                height: centreHeight,
                perspective: 1400,
                transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -40 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
          scale(${isCenter ? 1 : SIDE_SCALE})
        `,
            }}
        >
            <div
                className="relative h-full w-full transition-transform duration-700 ease-in-out"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${isCenter ? 0 : 180}deg)`,
                }}
            >
                {/* FRONT — only readable while this card holds the centre */}
                <div
                    aria-hidden={!isCenter}
                    className={cn('absolute inset-0 rounded-xl bg-gradient-to-br p-2', element.frame)}
                    style={{ backfaceVisibility: 'hidden', boxShadow: faceShadow }}
                >
                    <div className={cn('relative flex h-full w-full flex-col gap-2 rounded-lg border bg-gradient-to-b p-2.5 text-neutral-900', element.face)}>
                        {/* Name + star row */}
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-bold sm:text-base">{name}</span>
                            <span className="flex shrink-0 items-center gap-0.5" role="img" aria-label="Rated 5 out of 5 stars">
                                {Array.from({ length: 5 }, (_, index) => (
                                    <span key={index} className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-300 sm:h-[22px] sm:w-[22px]">
                                        <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
                                    </span>
                                ))}
                            </span>
                        </div>

                        {/* Art window */}
                        <div className={cn('rounded-sm bg-gradient-to-br p-[3px]', element.art)}>
                            <div className="relative h-44 overflow-hidden rounded-[2px] bg-gradient-to-b from-sky-200 to-emerald-200 sm:h-52">
                                {/* The 400px thumbnail covers a 1x screen at this size but not a
                                    retina one, so hand retina the full-size original instead. */}
                                <img
                                    src={testimonial.thumbnail_url ?? testimonial.picture_url}
                                    srcSet={
                                        testimonial.thumbnail_url
                                            ? `${testimonial.thumbnail_url} 1x, ${testimonial.picture_url} 2x`
                                            : undefined
                                    }
                                    alt={name}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Attack box */}
                        <div className={cn('flex flex-1 flex-col justify-center border-y-2 py-2', element.divider)}>
                            <p className="line-clamp-5 text-[11px] leading-snug text-neutral-800 sm:text-xs">“{testimonial.message}”</p>
                        </div>

                        {/* Footer bar */}
                        <div className="flex items-center justify-between gap-2 text-[9px] text-neutral-600 sm:text-[10px]">
                            {testimonial.instagram_account ? (
                                <a
                                    href={`https://instagram.com/${testimonial.instagram_account}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    tabIndex={isCenter ? 0 : -1}
                                    className="flex min-w-0 items-center gap-1 hover:underline"
                                >
                                    <Instagram className="h-3 w-3 shrink-0" />
                                    <span className="truncate">@{testimonial.instagram_account}</span>
                                </a>
                            ) : (
                                <span />
                            )}
                            <span className="shrink-0 font-mono">
                                {number}/{String(total).padStart(3, '0')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* BACK — full-bleed liquid chrome, no frame */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 overflow-hidden rounded-xl bg-black"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: faceShadow }}
                >
                    {/* Oversized so the slow drift never exposes an edge */}
                    <div
                        className={cn('absolute bg-cover bg-center', isNearCentre && 'animate-card-chrome')}
                        style={{ inset: '-25%', backgroundImage: CHROME_TEXTURE }}
                    />

                    {/* Pool of shade so the gold mark holds up over the white swirls */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.35)_45%,transparent_70%)]" />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/logo.png" alt="" className="w-[30%] drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]" loading="lazy" decoding="async" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StaggerTestimonials: React.FC<{ testimonials: ITestimonial[] }> = ({ testimonials }) => {
    const [cardSize, setCardSize] = useState(300);

    const initialList = useMemo<TestimonialItem[]>(() => testimonials.map((item, index) => ({ ...item, tempId: index })), [testimonials]);

    const [testimonialsList, setTestimonialsList] = useState(initialList);

    useEffect(() => setTestimonialsList(initialList), [initialList]);

    const handleMove = (steps: number) => {
        const newList = [...testimonialsList];
        if (steps > 0) {
            for (let i = steps; i > 0; i--) {
                const item = newList.shift();
                if (!item) return;
                newList.push({ ...item, tempId: Math.random() });
            }
        } else {
            for (let i = steps; i < 0; i++) {
                const item = newList.pop();
                if (!item) return;
                newList.unshift({ ...item, tempId: Math.random() });
            }
        }
        setTestimonialsList(newList);
    };

    useEffect(() => {
        const updateSize = () => {
            const { matches } = window.matchMedia('(min-width: 640px)');
            setCardSize(matches ? 300 : 240);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    if (testimonialsList.length === 0) return null;

    return (
        <div className="relative w-full overflow-hidden bg-muted/30" style={{ height: 600 }}>
            {testimonialsList.map((testimonial, index) => {
                const position = index - Math.floor(testimonialsList.length / 2);

                // Three on show, plus one hidden either side to hand off the transition.
                if (Math.abs(position) > 2) return null;

                return (
                    <TestimonialCard
                        key={testimonial.tempId}
                        testimonial={testimonial}
                        handleMove={handleMove}
                        position={position}
                        cardSize={cardSize}
                        total={testimonialsList.length}
                    />
                );
            })}
            <div className={cn('absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2', testimonialsList.length < 2 && 'hidden')}>
                <button
                    onClick={() => handleMove(-1)}
                    className={cn(
                        'flex h-8 w-8 items-center justify-center text-lg transition-colors rounded-md',
                        'border-1 border-border bg-background hover:bg-primary hover:text-primary-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                    )}
                    aria-label="Previous testimonial"
                >
                    <ChevronLeft />
                </button>
                <button
                    onClick={() => handleMove(1)}
                    className={cn(
                        'flex h-8 w-8 items-center justify-center text-lg transition-colors rounded-md',
                        'border-1 border-border bg-background hover:bg-primary hover:text-primary-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                    )}
                    aria-label="Next testimonial"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};
