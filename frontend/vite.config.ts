import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5040',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5040',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://timely-hub-backend-paschal-git-main-paschal20s-projects.vercel.app', // Connect to backend preview
        changeOrigin: true,
      },
      '/health': {
        target: 'https://timely-hub-backend-paschal-git-main-paschal20s-projects.vercel.app', // Connect to backend preview
        changeOrigin: true,
      },
    },
  },
});
