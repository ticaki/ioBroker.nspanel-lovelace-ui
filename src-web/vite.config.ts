/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The web panel is served by the adapter at http://<host>:<webPort>/<topic>,
// its assets at /assets/*. The dev server proxies the websocket to a running adapter.
export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        port: 4174,
        proxy: {
            '/ws': {
                target: 'ws://localhost:8090',
                ws: true,
            },
        },
    },
    build: {
        target: 'chrome89',
        outDir: '../www',
        emptyOutDir: true,
        chunkSizeWarningLimit: 3000,
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
