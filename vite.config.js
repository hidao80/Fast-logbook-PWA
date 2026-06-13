import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      strategies: 'generateSW',
      filename: 'sw.js',
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Fast logbook PWA',
        short_name: 'Fast logbook',
        version: '26.06.13',
        description: 'Time-stamped work notes PWA',
        start_url: '/index.html',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#62BF04',
        id: 'Fast-logbook-PWA_eeaea1ca-42b1-40d0-bbda-27093abf9df7',
        lang: 'ja',
        scope: '/',
        categories: ['productivity', 'utilities', 'logging', 'pwa', 'work'],
        icons: [
          {
            src: 'img/android-launchericon-48-48.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: 'img/android-launchericon-72-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'img/android-launchericon-96-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'img/android-launchericon-144-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'img/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'img/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2,json}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
});
