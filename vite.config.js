import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { minify as minifyHtml } from 'html-minifier-terser';
// Minifies dist/index.html on build. Vite minifies JS (via terser, below)
// and CSS (built in) automatically, but it does NOT minify the HTML entry
// file itself -- that needs to be done explicitly via this hook.
function htmlMinifyPlugin() {
    return {
        name: 'html-minify',
        apply: 'build',
        enforce: 'post',
        async transformIndexHtml(html) {
            return await minifyHtml(html, {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: false, // keep type="module", it's required
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true,
            });
        },
    };
}
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        htmlMinifyPlugin(),
        // Generates a Workbox-based service worker (dist/sw.js) with a
        // precache manifest built from the ACTUAL files Vite emitted --
        // every content-hashed JS/CSS chunk (including route-level lazy
        // chunks like Settings/MarkbookPage/WeekViewPage and on-demand
        // libraries like html2canvas/jsPDF/DOMPurify), every font file,
        // and index.html itself, each entry revisioned by content hash.
        // This replaces an earlier hand-written service worker that
        // scraped index.html for <script>/<link> tags (missing anything
        // not directly referenced there) and separately re-fetched
        // index.html on every navigation (which could silently drift out
        // of sync with what was actually precached after a redeploy).
        // Workbox's generated precache/navigation-fallback logic is
        // battle-tested across the huge number of production PWAs that
        // rely on it, which is what we want here after repeated issues
        // with a custom implementation.
        VitePWA({
            registerType: 'autoUpdate',
            // We register the service worker ourselves (see
            // src/utils/cacheUtils.ts) so it only runs when the person has
            // "Save Site for Offline Use" turned on in Settings.
            injectRegister: false,
            // We already ship our own static manifest.webmanifest.
            manifest: false,
            workbox: {
                cacheId: 'school-planner',
                globPatterns: ['**/*.{js,css,html,woff,woff2,ttf,svg,md,txt,xml,webmanifest}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api\//],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                runtimeCaching: [
                    {
                        // Cloudflare Pages Functions (word/quote-of-the-day
                        // proxying, etc) must always hit the real network --
                        // never get served from cache or turned into an
                        // opaque "service worker" error response.
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                        handler: 'NetworkOnly',
                    },
                ],
            },
        }),
    ],
    build: {
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
            mangle: {
                toplevel: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router'],
                    icons: ['lucide-react'],
                },
            },
        },
    },
});
