import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const enableAnalyzer = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    enableAnalyzer &&
      visualizer({
        filename: 'dist/bundle-analysis.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        emitFile: true,
        open: false,
      }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
