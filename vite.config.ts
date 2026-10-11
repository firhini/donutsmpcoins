import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { netlifyApiPlugin } from './scripts/vite-api-plugin';

/** Replaces %SITE_URL% in index.html with the deploy URL (Netlify sets URL at build time). */
function siteUrlPlugin() {
  const url = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
  return { name: 'site-url', transformIndexHtml: (html: string) => html.replace(/%SITE_URL%/g, url) };
}

export default defineConfig({
  plugins: [react(), netlifyApiPlugin(), siteUrlPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as any);
