import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Red Alvarez 3D · TP Redes 2026',
        short_name: 'Red 3D',
        description: 'Recorrido 3D interactivo de la red de la oficina del TP final de Redes 2026.',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'fullscreen',
        orientation: 'any',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // todo queda offline después de la primera visita (ideal para el proyector sin wifi)
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg,glb,json,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [{ urlPattern: /\.pdf$/, handler: 'CacheFirst', options: { cacheName: 'pdf' } }],
      },
    }),
  ],
});
