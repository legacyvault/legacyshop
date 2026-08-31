<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{--
            Midtrans and PayPal are only needed on pages that actually call
            window.snap.pay(...) or render a PayPal button — checkout, plus
            the order-history/retry-payment pages (settings/purchases and
            the two admin orders pages). They were previously loaded
            unconditionally in <head> on every storefront page (home,
            product listing, product detail, articles, ...), blocking HTML
            parsing there for no reason. Only load them on the pages that
            need them, and mark them `defer` so even there they don't block
            parsing.
        --}}
        @if (in_array($page['component'] ?? null, [
            'front/checkout/index',
            'settings/purchases/index',
            'orders/index',
            'orders/summary/index',
        ]))
            <script
                type="text/javascript"
                src="{{ config('services.midtrans.snap_url') }}/snap/snap.js"
                data-client-key="{{ config('services.midtrans.client_key') }}"
                defer>
            </script>

            <script src="https://www.paypal.com/sdk/js?client-id={{ config('services.paypal.client_id') }}" defer></script>
        @endif

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(1 0 0);
            }
        </style>

        {{--
            No <title> here. Inertia's head manager emits one via @inertiaHead
            (server-rendered under SSR, swapped client-side after hydration), so
            a hardcoded tag here produces *two* <title> elements in the HTML.
            Browsers show the last one, but crawlers take the first — which is
            how every page ended up titled "Legacy_Vault" in Google's results.
            Page titles belong in <Seo> / <Head>, not here.
        --}}

        <link rel="icon" href="/logo.ico" sizes="any">
        <link rel="apple-touch-icon" href="/logo.png">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Press+Start+2P&display=swap" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
