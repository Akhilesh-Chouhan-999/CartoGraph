import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        /**
         * Keeps graph-rendering dependencies in a separate browser bundle.
         * @param id - The resolved module identifier provided by Rollup.
         */
        manualChunks(id) {
          if (id.includes('/node_modules/@xyflow/') || id.includes('/node_modules/@dagrejs/'))
            return 'graph-vendor';
        },
      },
    },
  },
});
