import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 8080,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      source: path.resolve(__dirname, './source'),
      components: path.resolve(__dirname, 'source/components'),
      assets: path.resolve(__dirname, 'source/assets'),
      hooks: path.resolve(__dirname, 'source/hooks'),
      screens: path.resolve(__dirname, 'source/screens'),
      icons: path.resolve(__dirname, 'source/assets/icons'),

      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    },
  },
});
