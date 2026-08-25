import { MODAL_STAGGER_ATTR, Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal';
import { Button } from '@/components/ui/button';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BadgePercent, Bell, Heart, PackageCheck } from 'lucide-react';
import { CSSProperties, useEffect, useState } from 'react';

/**
 * Guest-only "please sign in" modal.
 *
 * Shows itself automatically (no trigger button) a few seconds after a logged-out
 * visitor lands on the storefront, and only once per browser session — dismissing
 * it writes a sessionStorage flag so it does not re-appear on every Inertia visit.
 */

const DISMISS_KEY = 'login-prompt-dismissed';
const SHOW_AFTER_MS = 4000;

const PERKS = [
    { icon: PackageCheck, label: 'Track every order in one place' },
    { icon: Heart, label: 'Save cards to your wishlist' },
    { icon: BadgePercent, label: 'Member-only drops & pricing' },
    { icon: Bell, label: 'Get notified before a set sells out' },
];

// Fixed rotations rather than the demo's Math.random() — a random tilt per render
// would change on every re-render and reads as a glitch.
const IMAGES = [
    { src: '/banner-example.jpg', rotate: '-8deg' },
    { src: '/poke-icon.png', rotate: '4deg' },
    { src: '/logo.png', rotate: '-3deg' },
];

export default function LoginPromptModal() {
    const { auth } = usePage<SharedData>().props;
    const isGuest = !auth?.user;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!isGuest) return;

        let dismissed = false;
        try {
            dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
        } catch {
            // Storage can be unavailable (private mode); fall through and show once.
        }
        if (dismissed) return;

        const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
        return () => window.clearTimeout(timer);
    }, [isGuest]);

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            try {
                sessionStorage.setItem(DISMISS_KEY, '1');
            } catch {
                // Ignore — worst case the modal shows again next navigation.
            }
        }
    };

    if (!isGuest) return null;

    return (
        <Modal open={open} onOpenChange={handleOpenChange}>
            {/* 9:16 portrait: height-driven so the ratio holds on any viewport, capped at 90dvh. */}
            <ModalBody className="mt-8 h-[600px] w-[min(92vw,calc(90dvh*9/16))] max-w-[min(92vw,calc(90dvh*9/16))]">
                <ModalContent className="overflow-y-auto">
                    {/* The stagger attribute sits on the row, not the cards — GSAP owns the row's
                        transform while each card keeps its own CSS rotate/hover transform. */}
                    <div {...{ [MODAL_STAGGER_ATTR]: '' }} className="mb-6 flex items-center justify-center">
                        {IMAGES.map(({ src, rotate }) => (
                            <div
                                key={src}
                                style={{ '--card-rotate': rotate } as CSSProperties}
                                className="-mr-4 shrink-0 overflow-hidden rounded-xl border border-border bg-card p-1 transition-transform duration-300 ease-out [transform:rotate(var(--card-rotate))_translateZ(0)] hover:z-10 hover:[transform:rotate(0deg)_scale(1.1)_translateZ(0)]"
                            >
                                <img
                                    src={src}
                                    alt=""
                                    aria-hidden
                                    loading="lazy"
                                    decoding="async"
                                    className="h-20 w-20 shrink-0 rounded-lg object-cover md:h-24 md:w-24"
                                />
                            </div>
                        ))}
                    </div>

                    <h4 {...{ [MODAL_STAGGER_ATTR]: '' }} className="mb-2 text-center font-pixel text-lg leading-relaxed text-foreground">
                        Join the collection
                    </h4>

                    <p {...{ [MODAL_STAGGER_ATTR]: '' }} className="mb-8 text-center text-sm text-muted-foreground">
                        Sign in to unlock the full storefront experience — it only takes a moment.
                    </p>

                    <ul className="flex flex-col gap-4">
                        {PERKS.map(({ icon: Icon, label }) => (
                            <li key={label} {...{ [MODAL_STAGGER_ATTR]: '' }} className="flex items-start gap-3">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span className="text-sm text-muted-foreground">{label}</span>
                            </li>
                        ))}
                    </ul>
                </ModalContent>

                <ModalFooter className="flex-col gap-3">
                    <Button asChild className="w-full">
                        <Link href={route('login')} onClick={() => handleOpenChange(false)}>
                            Sign in
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={route('register')} onClick={() => handleOpenChange(false)}>
                            Create account
                        </Link>
                    </Button>
                </ModalFooter>
            </ModalBody>
        </Modal>
    );
}
