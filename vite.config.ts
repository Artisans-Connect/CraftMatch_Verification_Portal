import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const fingerprintShim = fileURLToPath(new URL('./src/lib/lucideFingerprintShim.tsx', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react/dist/esm/icons/fingerprint.js': fingerprintShim,
      './icons/fingerprint.js': fingerprintShim,
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
