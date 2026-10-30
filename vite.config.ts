import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest, startWorker } from './src/server/apiHandler.ts';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'basha-smm-api-server',
      configureServer(server) {
        startWorker();
        server.middlewares.use(async (req, res, next) => {
          try {
            const handled = await handleApiRequest(req, res);
            if (!handled) {
              next();
            }
          } catch (err) {
            console.error('Error in API middleware:', err);
            next(err);
          }
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
