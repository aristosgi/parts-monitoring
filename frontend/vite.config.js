import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    host: '0.0.0.0', // Listen on all interfaces
    proxy: {
      '/api': {
        // In Docker, use service name 'backend'. In local dev, use localhost
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
