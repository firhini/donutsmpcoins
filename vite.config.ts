import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { netlifyApiPlugin } from './scripts/vite-api-plugin';

/** Replaces %SITE_URL% in index.html with the deploy URL (Netlify sets URL at build time). */
// Google Analytics 4 measurement id (public, not a secret). GA_MEASUREMENT_ID in Netlify overrides it.
// Loaded only after the visitor clicks "Accept" in the cookie notice (src/components/ui/Analytics.tsx).
const DEFAULT_GA_ID = 'G-Z2RKMF6X07';

function siteUrlPlugin() {
  const url = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');
  const verification = process.env.GOOGLE_SITE_VERIFICATION || '';
  const ga = process.env.GA_MEASUREMENT_ID || DEFAULT_GA_ID;
  return {
    name: 'site-url',
    transformIndexHtml: (html: string) =>
      html
        .replace(/%SITE_URL%/g, url)
        .replace(/\s*<meta name="google-site-verification" content="%GOOGLE_SITE_VERIFICATION%" \/>/, verification ? `\n    <meta name="google-site-verification" content="${verification}" />` : '')
        .replace(/%GA_MEASUREMENT_ID%/g, ga),
  };
}

const siteUrl = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');

export default defineConfig({
  plugins: [react(), netlifyApiPlugin(), siteUrlPlugin()],
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    'import.meta.env.VITE_GA_ID': JSON.stringify(process.env.GA_MEASUREMENT_ID || DEFAULT_GA_ID),
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    manifest: true,
  },
  ssr: {
    noExternal: [],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as any);
