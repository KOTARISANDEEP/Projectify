import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? process.env.BACKEND_URL || 'https://your-backend-domain.com'
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
