import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const ImageSequence: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameCount = 50; // total frames
    const currentFrame = (index: number) => `/sequence/${String(index).padStart(4, '0')}.png`;

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const img = new Image();
        img.src = currentFrame(1);

        const images: HTMLImageElement[] = [];
        for (let i = 1; i <= frameCount; i++) {
            const image = new Image();
            image.src = currentFrame(i);
            images.push(image);
        }

        const state = { frame: 0 };

        const render = () => {
            const scale = 0.8;
            const img = images[state.frame];
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.min(hRatio, vRatio) * scale;
            const centerShiftX = (canvas.width - img.width * ratio) / 2;
            const centerShiftY = (canvas.height - img.height * ratio) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
        };

        // Use gsap.context so revert() cleans up ScrollTrigger pin/markers safely when unmounting
        const ctx = gsap.context(() => {
            gsap.to(state, {
                frame: frameCount - 1,
                snap: 'frame',
                ease: 'none',
                scrollTrigger: {
                    trigger: canvas,
                    start: 'top top',
                    end: '180% bottom', // scroll length
                    scrub: true,
                    pin: true,
                    pinSpacing: false, // avoid spacer node that can misalign during unmount
                },
                onUpdate: render,
            });
        }, canvas);

        images[0].onload = render;

        return () => {
            // kill only triggers tied to this canvas before reverting scope; guards against orphaned pin nodes
            ScrollTrigger.getAll()
                .filter((st) => st.trigger === canvas)
                .forEach((st) => st.kill());

            try {
                ctx.revert();
            } catch (err) {
                console.warn('GSAP cleanup skipped:', err);
            }
        };
    }, []);

    return (
        <div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100vh' }} />
        </div>
    );
};

export default ImageSequence;
