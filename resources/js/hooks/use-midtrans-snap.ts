import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Loads Midtrans Snap on demand and reports when `window.snap` is usable.
 *
 * The root Blade template only emits the Snap <script> on a full page load of
 * the payment pages. Navigating to those pages through Inertia (SPA) skips the
 * <head> tag entirely, so the script may never be present and any code gated on
 * `window.snap` silently does nothing. This hook injects the script when needed
 * using the server-provided client key, with the VITE value as a fallback.
 */
export function useMidtransSnap(): boolean {
    const { midtrans } = usePage<SharedData>().props;
    const clientKey = midtrans?.clientKey ?? import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '';
    const snapUrl = `${midtrans?.snapUrl ?? import.meta.env.VITE_MIDTRANS_URL ?? 'https://app.sandbox.midtrans.com'}/snap/snap.js`;
    const [isReady, setIsReady] = useState<boolean>(() => typeof window !== 'undefined' && Boolean(window.snap?.pay));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.snap) {
            setIsReady(true);
            return;
        }

        if (!clientKey) return;

        const scriptId = 'midtrans-snap-script';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        const handleLoad = () => setIsReady(true);

        if (existingScript) {
            if (window.snap) {
                handleLoad();
                return;
            }
            existingScript.addEventListener('load', handleLoad);
            return () => existingScript.removeEventListener('load', handleLoad);
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = snapUrl;
        script.async = true;
        script.dataset.clientKey = clientKey;
        script.onload = handleLoad;
        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
        };
    }, [clientKey, snapUrl]);

    return isReady;
}
