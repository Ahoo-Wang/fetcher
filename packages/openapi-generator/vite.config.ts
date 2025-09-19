import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      formats: ['es', 'umd'],
      name: 'FetcherOpenAPIGenerator',
    },
    rollupOptions: {
      external: [
        '@ahoo-wang/fetcher-openapi',
        '@ahoo-wang/fetcher-decorator',
        '@ahoo-wang/fetcher-wow',
        'commander',
        'ts-morph',
        'yaml',
      ],
      output: {
        globals: {
          commander: 'commander',
          'ts-morph': 'tsMorph',
          yaml: 'yaml',
        },
      },
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDirs: ['dist'],
      tsconfigPath: 'tsconfig.json',
    }),
  ],
});
