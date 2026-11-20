import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: { __PWA__: JSON.stringify(!process.env.ARTIFACT) },
  // Vercel: landing en /, demo en /demo/. Artifact (vista previa): solo la demo, rutas relativas.
  base: process.env.ARTIFACT ? './' : '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: { input: process.env.ARTIFACT || process.env.DEMO_ONLY ? { demo: 'demo/index.html' } : { main: 'index.html', demo: 'demo/index.html' } },
  },
  plugins: [
    process.env.ARTIFACT ? null : VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // el service worker lo registra solo la demo: la landing queda liviana
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Red Alvarez 3D · TP Redes 2026',
        short_name: 'Red 3D',
        description: 'Recorrido 3D interactivo de la red de la oficina del TP final de Redes 2026.',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'fullscreen',
        orientation: 'any',
        start_url: '/demo/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // todo queda offline después de la primera visita (ideal para el proyector sin wifi)
        // el HTML no se precachea: siempre se pide a la red (si no hay red, sale de la caché) y así
        // nadie queda viendo una versión vieja de la landing o de la demo
        globPatterns: ['**/*.{js,css,woff2,png,jpg,webp,glb,json,svg}'],
        navigateFallback: null,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          { urlPattern: ({ request }) => request.mode === 'navigate', handler: 'NetworkFirst', options: { cacheName: 'pages', networkTimeoutSeconds: 4 } },
          { urlPattern: /\.pdf$/, handler: 'CacheFirst', options: { cacheName: 'pdf' } },
        ],
      },
    }),
  ],
});
