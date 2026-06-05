import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
