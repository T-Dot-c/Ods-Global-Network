import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config for Provider Portal (Port 3001)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'provider-portal-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.headers.accept?.includes('text/html') &&
            !req.url?.startsWith('/@') &&
            !req.url?.startsWith('/src/')
          ) {
            req.url = '/provider.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3001,
    strictPort: true,
  },
});
