import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config for Customer Portal (Port 3002)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'customer-portal-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.headers.accept?.includes('text/html') &&
            !req.url?.startsWith('/@') &&
            !req.url?.startsWith('/src/')
          ) {
            req.url = '/customer.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3002,
    strictPort: true,
  },
});
