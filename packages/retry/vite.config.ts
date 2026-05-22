import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FetcherRetry',
      formats: ['es', 'umd'],
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['@ahoo-wang/fetcher'],
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(__dirname, 'src'),
      exclude: ['**/*.test.ts'],
    }),
  ],
});
