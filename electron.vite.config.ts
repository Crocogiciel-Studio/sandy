import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      rolldownOptions: {
        input: {
          main: resolve('src/shell/electron/main.ts'),
          'pty-host': resolve('src/pty-host/index.ts'),
        },
        // Native module: loaded from node_modules at runtime, never bundled.
        external: ['node-pty'],
      },
    },
  },
  preload: {
    build: {
      rolldownOptions: {
        input: { index: resolve('src/shell/electron/preload/index.ts') },
        // Sandboxed preloads must be CommonJS.
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    root: resolve('src/ui'),
    build: {
      rolldownOptions: {
        input: { index: resolve('src/ui/index.html') },
      },
    },
    plugins: [react()],
  },
});
