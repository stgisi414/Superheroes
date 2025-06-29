
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      plugins: [react()],
      define: {
        'process.env': env
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: true,
        port: 5173,
        allowedHosts: ['dc6fd3fc-1ae9-41e5-b6a6-cdd53582d9eb-00-1akqpj7omovi5.riker.replit.dev', 'superhearoesare.cool', 'superheroez.replit.app']
      },
      preview: {
        host: '0.0.0.0',
        port: 5173
      }
    };
});
