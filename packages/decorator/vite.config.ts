import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherDecorator',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['@ahoo-wang/fetcher', '@ahoo-wang/fetcher-eventstream', '@ahoo-wang/fetcher-wow'],
      output: {
        globals: {
          '@ahoo-wang/fetcher': 'Fetcher',
          '@ahoo-wang/fetcher-eventstream': 'FetcherEventStream',
          '@ahoo-wang/fetcher-wow': 'FetcherWow',
        },
      },
    },
  },
  plugins: [
    dts({
      outDirs: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
