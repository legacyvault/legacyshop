import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    build: {
        ssr: 'resources/js/pages/ssr.tsx',
        outDir: 'build-ssr',
        emptyOutDir: true,
    },
    ssr: {
        noExternal: ['@inertiajs/react', '@inertiajs/core'],
    },
});
