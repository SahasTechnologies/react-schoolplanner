import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
// Writes dist/asset-manifest.json listing every file Rollup emitted for
// this build (all code-split chunks, fonts, css, etc). index.html only
// references the entry chunk, the manualChunks (vendor/router/icons), and
// the stylesheet -- it never lists route-level lazy chunks (Settings,
// MarkbookPage, WeekViewPage), on-demand heavy libraries (the
// jsPDF/html2canvas/DOMPurify chunk), or font files (only referenced from
// inside the compiled CSS). The service worker previously only scanned
// index.html for assets to precache, so all of that was silently missing
// whenever someone went offline -- this manifest lets it precache
// everything instead.
function assetManifestPlugin() {
    return {
        name: 'asset-manifest',
        apply: 'build',
        writeBundle(options, bundle) {
            const outDir = options.dir || path.resolve(process.cwd(), 'dist');
            const urls = Object.keys(bundle)
                .filter((fileName) => !fileName.endsWith('.map'))
                .map((fileName) => '/' + fileName);
            fs.writeFileSync(path.join(outDir, 'asset-manifest.json'), JSON.stringify(urls, null, 2));
        },
    };
}
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        assetManifestPlugin(),
    ],
    build: {
        sourcemap: true,
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
                    router: ['react-router-dom'],
                    icons: ['lucide-react'],
                },
            },
        },
    },
});
