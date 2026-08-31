import gsap from 'gsap';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const FRAME_COUNT = 50;
const PLAY_DURATION = 0.9; // seconds for a full forward sweep
const MAX_DPR = 2; // beyond 2x the extra pixels cost more than they show
const currentFrame = (index: number) => `/sequence/${String(index).padStart(4, '0')}.png`;

const ImageSequence: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const playRef = useRef<(direction: 'forward' | 'reverse') => void>(() => {});
    const [isActive, setIsActive] = useState(false);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) return;

        const images: HTMLImageElement[] = [];
        for (let i = 1; i <= FRAME_COUNT; i++) {
            const image = new Image();
            image.src = currentFrame(i);
            images.push(image);
        }

        const state = { frame: 0 };

        const render = () => {
            const img = images[Math.round(state.frame)];
            if (!img?.complete || !img.naturalWidth) return;

            const scale = 1;
            const ratio = Math.min(canvas.width / img.width, canvas.height / img.height) * scale;
            const centerShiftX = (canvas.width - img.width * ratio) / 2;
            const centerShiftY = (canvas.height - img.height * ratio) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
        };

        // Size the backing store in device pixels, otherwise every frame is upscaled on retina screens.
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            const width = canvas.clientWidth || window.innerWidth;
            const height = canvas.clientHeight || window.innerHeight;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            render();
        };

        resize();
        window.addEventListener('resize', resize);
        images[0].onload = render;

        // Hover drives playback: forward on enter, rewind on leave. Duration scales with the
        // remaining distance so a quick in/out doesn't feel sluggish.
        const ctx = gsap.context(() => {
            playRef.current = (direction) => {
                const target = direction === 'forward' ? FRAME_COUNT - 1 : 0;
                const distance = Math.abs(target - state.frame) / (FRAME_COUNT - 1);

                gsap.to(state, {
                    frame: target,
                    duration: PLAY_DURATION * distance,
                    ease: 'power2.inOut', // soft start, quick middle, soft landing
                    overwrite: true,
                    onUpdate: render,
                });
            };
        }, canvas);

        return () => {
            window.removeEventListener('resize', resize);
            gsap.killTweensOf(state);
            ctx.revert();
        };
    }, []);

    // Touch devices have no hover, so play the sequence once the canvas scrolls into view.
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        if (window.matchMedia('(hover: hover)').matches) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsActive(entry.isIntersecting);
                playRef.current(entry.isIntersecting ? 'forward' : 'reverse');
            },
            { threshold: 0.5 },
        );

        observer.observe(wrapper);

        return () => observer.disconnect();
    }, []);

    const activate = () => {
        setIsActive(true);
        playRef.current('forward');
    };

    const deactivate = () => {
        setIsActive(false);
        playRef.current('reverse');
    };

    return (
        <div
            ref={wrapperRef}
            className="group relative h-full w-full cursor-pointer"
            onMouseEnter={activate}
            onMouseLeave={deactivate}
            onFocus={activate}
            onBlur={deactivate}
            tabIndex={0}
            role="img"
            aria-label="Interactive product sequence — hover to play"
        >
            <canvas ref={canvasRef} className="h-full w-full" />

            <span
                className={`pointer-events-none absolute top-[5%] left-[53%] flex h-16 w-16 items-center justify-center transition-all duration-300 ${
                    isActive ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
            >
                <span className="absolute inset-0 animate-ping rounded-full bg-background/50 [animation-duration:2s] motion-reduce:hidden" />
                <span className="absolute inset-0 rounded-full bg-background/25 blur-md" />
                <span className="relative flex h-full w-full animate-pulse items-center justify-center rounded-full bg-background text-center text-xs font-semibold tracking-wide text-foreground shadow-lg ring-1 ring-foreground/10 [animation-duration:2s] motion-reduce:animate-none">
                    Hover me
                </span>
            </span>
        </div>
    );
};

export default ImageSequence;
