import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',  // Ensure all assets are served from the root
  plugins: [react(), tailwindcss()],
  server: {
    port: 30001,
    host: '127.0.0.1', // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // your local backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Don't rewrite the path
      },
      '/uploads': {
        target: 'http://localhost:5000', // your local backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Don't rewrite the path
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps to save memory
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large dependencies into separate chunks to reduce memory per chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('@fortawesome')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            // Split other large dependencies
            return 'vendor-other';
          }
        },
      },
      // Aggressively reduce memory usage
      maxParallelFileOps: 1,
      // Process files sequentially to reduce peak memory
    },
    chunkSizeWarningLimit: 1000,
    // Reduce memory usage during build
    target: 'es2015',
    cssCodeSplit: true,
    // Reduce chunk size - inline smaller assets
    assetsInlineLimit: 4096,
    // Reduce memory by limiting concurrent operations
    reportCompressedSize: false, // Disable size reporting to save memory
  },
  preview: {
    port: 4173,
    host: true,
  },
}))
