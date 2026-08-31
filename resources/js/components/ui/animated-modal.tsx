import { cn } from '@/lib/utils';
import gsap from 'gsap';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ModalContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

type ModalProviderProps = {
    children: ReactNode;
    /** Uncontrolled initial state — use for modals that show themselves on mount. */
    defaultOpen?: boolean;
    /** Controlled state. When provided, the parent owns `open`. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export const ModalProvider = ({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: ModalProviderProps) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );

    return <ModalContext.Provider value={{ open, setOpen }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export function Modal({ children, ...props }: ModalProviderProps) {
    return <ModalProvider {...props}>{children}</ModalProvider>;
}

export const ModalTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
    const { setOpen } = useModal();
    return (
        <button
            type="button"
            className={cn('relative overflow-hidden rounded-md px-4 py-2 text-center text-foreground', className)}
            onClick={() => setOpen(true)}
        >
            {children}
        </button>
    );
};

/**
 * Children marked with this attribute are staggered in after the panel lands.
 * Only opacity/transform are touched, so the whole sequence stays on the compositor.
 */
export const MODAL_STAGGER_ATTR = 'data-modal-stagger';

export const ModalBody = ({
    children,
    className,
    showCloseButton = true,
}: {
    children: ReactNode;
    className?: string;
    showCloseButton?: boolean;
}) => {
    const { open, setOpen } = useModal();

    // Stays true through the exit animation so the panel can animate out before unmounting.
    const [rendered, setRendered] = useState(open);

    const rootRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) setRendered(true);
    }, [open]);

    useEffect(() => {
        if (!rendered) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [rendered]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, setOpen]);

    useOutsideClick(panelRef, () => setOpen(false), open);

    useLayoutEffect(() => {
        if (!rendered) return;

        const ctx = gsap.context(() => {
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (open) {
                const items = gsap.utils.toArray<HTMLElement>(`[${MODAL_STAGGER_ATTR}]`);

                gsap.set(overlayRef.current, { autoAlpha: 0 });
                gsap.set(panelRef.current, { autoAlpha: 0, scale: 0.94, yPercent: 3, willChange: 'transform, opacity' });
                if (items.length) gsap.set(items, { autoAlpha: 0, y: 12, willChange: 'transform, opacity' });

                const tl = gsap.timeline({
                    defaults: { ease: 'power3.out', force3D: true },
                    onComplete: () => {
                        gsap.set([panelRef.current, ...items], { clearProps: 'willChange' });
                    },
                });

                tl.to(overlayRef.current, { autoAlpha: 1, duration: prefersReduced ? 0 : 0.22, ease: 'none' })
                    .to(panelRef.current, { autoAlpha: 1, scale: 1, yPercent: 0, duration: prefersReduced ? 0 : 0.42 }, '<')
                    .to(items, { autoAlpha: 1, y: 0, duration: prefersReduced ? 0 : 0.3, stagger: 0.045 }, prefersReduced ? '<' : '-=0.24');

                return;
            }

            gsap.timeline({ defaults: { ease: 'power2.in', force3D: true }, onComplete: () => setRendered(false) })
                .to(panelRef.current, { autoAlpha: 0, scale: 0.96, yPercent: 2, duration: prefersReduced ? 0 : 0.18 })
                .to(overlayRef.current, { autoAlpha: 0, duration: prefersReduced ? 0 : 0.18, ease: 'none' }, '<');
        }, rootRef);

        return () => ctx.revert();
    }, [rendered, open]);

    if (!rendered) return null;

    // z-100: the modal renders before FrontHeader in the layout, so at an equal
    // z-index the header would paint over the overlay.
    return (
        <div ref={rootRef} className="fixed inset-0 z-100 flex h-full w-full items-center justify-center" role="dialog" aria-modal="true">
            {/* Static blur, animated opacity only — animating backdrop-filter itself is what makes this kind of modal stutter. */}
            <div ref={overlayRef} className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm" />

            <div
                ref={panelRef}
                className={cn(
                    'relative z-10 flex flex-col overflow-hidden border border-border bg-background shadow-2xl [transform:translateZ(0)] sm:rounded-2xl',
                    className,
                )}
            >
                {showCloseButton && <CloseIcon />}
                {children}
            </div>
        </div>
    );
};

export const ModalContent = ({ children, className }: { children: ReactNode; className?: string }) => {
    return <div className={cn('flex min-h-0 flex-1 flex-col p-6 md:p-8', className)}>{children}</div>;
};

export const ModalFooter = ({ children, className }: { children: ReactNode; className?: string }) => {
    return <div className={cn('flex shrink-0 justify-end bg-muted p-4', className)}>{children}</div>;
};

const CloseIcon = () => {
    const { setOpen } = useModal();
    return (
        <button type="button" onClick={() => setOpen(false)} className="group absolute top-4 right-4 z-10" aria-label="Close">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-foreground transition-transform duration-200 group-hover:rotate-3 group-hover:scale-125"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
            </svg>
        </button>
    );
};

// Hook to detect clicks outside of a component.
export const useOutsideClick = (ref: React.RefObject<HTMLElement | null>, callback: (event: MouseEvent | TouchEvent) => void, enabled = true) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!enabled) return;

        const listener = (event: MouseEvent | TouchEvent) => {
            // DO NOTHING if the element being clicked is the target element or their children
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            callbackRef.current(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, enabled]);
};
