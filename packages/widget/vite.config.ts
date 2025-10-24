import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MegaEthTipsWidget',
      fileName: () => 'widget.js',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
