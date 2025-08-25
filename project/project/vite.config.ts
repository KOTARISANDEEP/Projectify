import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // No proxy needed in production - frontend calls Render backend directly
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Only for local development
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
