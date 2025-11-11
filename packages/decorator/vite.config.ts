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
      external: ['@ahoo-wang/fetcher', 'reflect-metadata'],
      output: {
        globals: {
          '@ahoo-wang/fetcher': 'Fetcher',
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
