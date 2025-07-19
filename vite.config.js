import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['school.svg'],
            manifest: {
                name: 'School Planner',
                short_name: 'Planner',
                start_url: '/',
                display: 'standalone',
                background_color: '#181e29',
                theme_color: '#181e29',
                icons: [
                    {
                        src: 'school.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                    },
                ],
            },
        }),
    ],
});
