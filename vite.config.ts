import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cello Practice Companion',
        short_name: 'Cello Practice',
        description: 'A gentle record of your cello practice.',
        start_url: './',
        display: 'standalone',
        background_color: '#f7f5f0',
        theme_color: '#243d42',
        icons: [
          { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      }
    })
  ]
});
