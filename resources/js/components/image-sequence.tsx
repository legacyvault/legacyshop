import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const ImageSequence: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameCount = 50; // total frames
    const currentFrame = (index: number) => `/sequence/${String(index).padStart(4, '0')}.png`;

    useEffect(() => {
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

        gsap.to(state, {
            frame: frameCount - 1,
            snap: 'frame',
            ease: 'none',
            scrollTrigger: {
                trigger: canvas,
                start: 'top top',
                end: '200% bottom', // scroll length
                scrub: true,
                pin: true,
            },
            onUpdate: render,
        });

        images[0].onload = render;
    }, []);

    return (
        <div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100vh' }} />
        </div>
    );
};

export default ImageSequence;
