import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherEventStream',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['@ahoo-wang/fetcher'],
      output: {
        globals: {
          '@ahoo-wang/fetcher': 'Fetcher',
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
