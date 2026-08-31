import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            // The client bundle must never pull in Inertia's server entry, but the
            // SSR bundle *is* that entry — aliasing it there stubs out createServer
            // and produces a bundle that throws on boot, which silently degrades
            // every page to client-only rendering (no HTML for crawlers).
            ...(isSsrBuild
                ? {}
                : {
                      '@inertiajs/core/server': resolve(__dirname, 'resources/noop.ts'),
                      '@inertiajs/react/server': resolve(__dirname, 'resources/noop.ts'),
                  }),
        },
    },
    optimizeDeps: {
        exclude: ['@inertiajs/react/server', '@inertiajs/core/server'],
    },
    ssr: {
        noExternal: ['@inertiajs/react', '@inertiajs/core'],
    },
}));

