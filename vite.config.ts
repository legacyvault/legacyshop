import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/pages/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: { jsx: 'automatic' },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
        // helps vite prefer browser condition for packages that export it
        conditions: ['browser', 'module', 'import'],
    },
    // IMPORTANT: only mark server libs noExternal for the SSR build
    ssr: {
        noExternal: ['@inertiajs/react', '@inertiajs/server'],
        // (remove '@inertiajs/core' here)
    },
    optimizeDeps: {
        // keep the server build out of dev optimizer
        exclude: ['@inertiajs/server'],
    },
});
