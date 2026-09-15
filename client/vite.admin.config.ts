import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config for Admin Portal (Port 3000)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'admin-portal-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.headers.accept?.includes('text/html') &&
            !req.url?.startsWith('/@') &&
            !req.url?.startsWith('/src/')
          ) {
            req.url = '/admin.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
});
