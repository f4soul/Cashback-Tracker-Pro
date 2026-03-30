import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon-180x180.png',
          'maskable-icon-512x512.png',
          'logos/*.png',
          'assets/logos/*.png', // на всякий случай
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'],
          // ... остальной workbox код без изменений
        },
        manifest: {
          // ... manifest без изменений
        },
      }),
    ],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), //
      },
    },
    server: {
      hmr: true,
    },
  };
});
