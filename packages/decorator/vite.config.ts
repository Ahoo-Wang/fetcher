import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherDecorator',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        '@ahoo-wang/fetcher',
        '@ahoo-wang/fetcher-eventstream',
        'reflect-metadata',
      ],
      output: {
        globals: {
          '@ahoo-wang/fetcher': 'Fetcher',
          '@ahoo-wang/fetcher-eventstream': 'FetcherEventStream',
          'reflect-metadata': 'reflect-metadata',
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
