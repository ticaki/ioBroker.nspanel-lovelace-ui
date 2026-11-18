/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Writes `<meta name="nspanel-web-build" content="<id>">` into the built index.html. The id is a hash
 * of the names of all emitted files - they carry content hashes, so every changed build gets a new id,
 * also without a version change. The adapter reads it from www/index.html and sends it in `hello`,
 * the page compares it with its own and reloads once when they differ (bundle older than the adapter).
 */
function webBuildId(): Plugin {
    return {
        name: 'nspanel-web-build-id',
        apply: 'build',
        transformIndexHtml: {
            order: 'post',
            handler(_html, ctx) {
                if (!ctx.bundle) {
                    return undefined;
                }
                const names = Object.keys(ctx.bundle)
                    .filter(name => !name.endsWith('.html'))
                    .sort();
                const id = createHash('sha256').update(names.join('\n')).digest('hex').slice(0, 16);
                return [{ tag: 'meta', attrs: { name: 'nspanel-web-build', content: id }, injectTo: 'head' }];
            },
        },
    };
}

// The web panel is served by the adapter at http://<host>:<webPort>/<topic>,
// its assets at /assets/*. The dev server proxies the websocket to a running adapter.
export default defineConfig({
    plugins: [react(), webBuildId()],
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
