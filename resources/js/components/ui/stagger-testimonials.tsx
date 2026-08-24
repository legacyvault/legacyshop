import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const testimonials = [
    {
        tempId: 0,
        testimonial: 'My favorite solution in the market. We work 5x faster with COMPANY.',
        by: 'Alex, CEO at TechCorp',
        imgSrc: 'https://i.pravatar.cc/300?img=1',
    },
    {
        tempId: 1,
        testimonial: "I'm confident my data is safe with COMPANY. I can't say that about other providers.",
        by: 'Dan, CTO at SecureNet',
        imgSrc: 'https://i.pravatar.cc/300?img=2',
    },
    {
        tempId: 2,
        testimonial: "I know it's cliche, but we were lost before we found COMPANY. Can't thank you guys enough!",
        by: 'Stephanie, COO at InnovateCo',
        imgSrc: 'https://i.pravatar.cc/300?img=3',
    },
    {
        tempId: 3,
        testimonial: "COMPANY's products make planning for the future seamless. Can't recommend them enough!",
        by: 'Marie, CFO at FuturePlanning',
        imgSrc: 'https://i.pravatar.cc/300?img=4',
    },
    {
        tempId: 4,
        testimonial: "If I could give 11 stars, I'd give 12.",
        by: 'Andre, Head of Design at CreativeSolutions',
        imgSrc: 'https://i.pravatar.cc/300?img=5',
    },
    {
        tempId: 5,
        testimonial: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours so far.",
        by: 'Jeremy, Product Manager at TimeWise',
        imgSrc: 'https://i.pravatar.cc/300?img=6',
    },
    {
        tempId: 6,
        testimonial: "Took some convincing, but now that we're on COMPANY, we're never going back.",
        by: 'Pam, Marketing Director at BrandBuilders',
        imgSrc: 'https://i.pravatar.cc/300?img=7',
    },
    {
        tempId: 7,
        testimonial: "I would be lost without COMPANY's in-depth analytics. The ROI is EASILY 100X for us.",
        by: 'Daniel, Data Scientist at AnalyticsPro',
        imgSrc: 'https://i.pravatar.cc/300?img=8',
    },
    {
        tempId: 8,
        testimonial: "It's just the best. Period.",
        by: 'Fernando, UX Designer at UserFirst',
        imgSrc: 'https://i.pravatar.cc/300?img=9',
    },
    {
        tempId: 9,
        testimonial: 'I switched 5 years ago and never looked back.',
        by: 'Andy, DevOps Engineer at CloudMasters',
        imgSrc: 'https://i.pravatar.cc/300?img=10',
    },
    {
        tempId: 10,
        testimonial: "I've been searching for a solution like COMPANY for YEARS. So glad I finally found one!",
        by: 'Pete, Sales Director at RevenueRockets',
        imgSrc: 'https://i.pravatar.cc/300?img=11',
    },
    {
        tempId: 11,
        testimonial: "It's so simple and intuitive, we got the team up to speed in 10 minutes.",
        by: 'Marina, HR Manager at TalentForge',
        imgSrc: 'https://i.pravatar.cc/300?img=12',
    },
    {
        tempId: 12,
        testimonial: "COMPANY's customer support is unparalleled. They're always there when we need them.",
        by: 'Olivia, Customer Success Manager at ClientCare',
        imgSrc: 'https://i.pravatar.cc/300?img=13',
    },
    {
        tempId: 13,
        testimonial: "The efficiency gains we've seen since implementing COMPANY are off the charts!",
        by: 'Raj, Operations Manager at StreamlineSolutions',
        imgSrc: 'https://i.pravatar.cc/300?img=14',
    },
    {
        tempId: 14,
        testimonial: "COMPANY has revolutionized how we handle our workflow. It's a game-changer!",
        by: 'Lila, Workflow Specialist at ProcessPro',
        imgSrc: 'https://i.pravatar.cc/300?img=15',
    },
    {
        tempId: 15,
        testimonial: "The scalability of COMPANY's solution is impressive. It grows with our business seamlessly.",
        by: 'Trevor, Scaling Officer at GrowthGurus',
        imgSrc: 'https://i.pravatar.cc/300?img=16',
    },
    {
        tempId: 16,
        testimonial: "I appreciate how COMPANY continually innovates. They're always one step ahead.",
        by: 'Naomi, Innovation Lead at FutureTech',
        imgSrc: 'https://i.pravatar.cc/300?img=17',
    },
    {
        tempId: 17,
        testimonial: "The ROI we've seen with COMPANY is incredible. It's paid for itself many times over.",
        by: 'Victor, Finance Analyst at ProfitPeak',
        imgSrc: 'https://i.pravatar.cc/300?img=18',
    },
    {
        tempId: 18,
        testimonial: "COMPANY's platform is so robust, yet easy to use. It's the perfect balance.",
        by: 'Yuki, Tech Lead at BalancedTech',
        imgSrc: 'https://i.pravatar.cc/300?img=19',
    },
    {
        tempId: 19,
        testimonial: 'We’ve tried many solutions, but COMPANY stands out in terms of reliability and performance.',
        by: 'Zoe, Performance Manager at ReliableSystems',
        imgSrc: 'https://i.pravatar.cc/300?img=20',
    },
];

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
const statFromName = (name: string) => {
    const seed = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);

    return {
        number: String((seed % 20) + 1).padStart(3, '0'),
        element: ELEMENTS[seed % ELEMENTS.length],
    };
};

interface TestimonialCardProps {
    position: number;
    testimonial: (typeof testimonials)[0];
    handleMove: (steps: number) => void;
    cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ position, testimonial, handleMove, cardSize }) => {
    const isCenter = position === 0;
    const [name] = testimonial.by.split(',');
    const { number, element } = statFromName(testimonial.by);

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
                'absolute top-1/2 left-1/2 cursor-pointer transition-all duration-500 ease-in-out',
                isCenter ? 'z-10' : 'z-0 saturate-[0.85]',
                !isVisible && 'pointer-events-none opacity-0',
            )}
            style={{
                width: cardSize,
                height: cardSize * 1.4,
                perspective: 1400,
                transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -40 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
          scale(${isCenter ? 1.04 : 0.82})
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
                                <img src={testimonial.imgSrc} alt={name} className="h-full w-full object-cover object-top" />
                            </div>
                        </div>

                        {/* Attack box */}
                        <div className={cn('flex flex-1 flex-col justify-center border-y-2 py-2', element.divider)}>
                            <p className="line-clamp-5 text-[11px] leading-snug text-neutral-800 sm:text-xs">“{testimonial.testimonial}”</p>
                        </div>

                        {/* Footer bar */}
                        <div className="flex items-center justify-end text-[9px] text-neutral-600 sm:text-[10px]">
                            <span className="font-mono">{number}/020</span>
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

export const StaggerTestimonials: React.FC = () => {
    const [cardSize, setCardSize] = useState(300);
    const [testimonialsList, setTestimonialsList] = useState(testimonials);

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

    return (
        <div className="relative w-full overflow-hidden bg-muted/30" style={{ height: 600 }}>
            {testimonialsList.map((testimonial, index) => {
                const position = testimonialsList.length % 2 ? index - (testimonialsList.length + 1) / 2 : index - testimonialsList.length / 2;

                // Three on show, plus one hidden either side to hand off the transition.
                if (Math.abs(position) > 2) return null;

                return (
                    <TestimonialCard
                        key={testimonial.tempId}
                        testimonial={testimonial}
                        handleMove={handleMove}
                        position={position}
                        cardSize={cardSize}
                    />
                );
            })}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
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
