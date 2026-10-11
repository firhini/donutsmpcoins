import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { netlifyApiPlugin } from './scripts/vite-api-plugin';

export default defineConfig({
  plugins: [react(), netlifyApiPlugin()],
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
