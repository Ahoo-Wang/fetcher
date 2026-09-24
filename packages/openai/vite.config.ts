import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherOpenAI',
      fileName: format =>
        format === 'es' ? 'index.es.js' : `index.${format}.cjs`,
    },
    rollupOptions: {
      external: [
        '@ahoo-wang/fetcher',
        '@ahoo-wang/fetcher-eventstream',
        '@ahoo-wang/fetcher-decorator',
      ],
      output: {
        globals: {
          '@ahoo-wang/fetcher': 'Fetcher',
          '@ahoo-wang/fetcher-eventstream': 'FetcherEventStream',
          '@ahoo-wang/fetcher-decorator': 'FetcherDecorator',
        },
      },
    },
  },
  plugins: [
    dts({
      // `.d.cts` for the `require` condition and `.d.ts` for `import`, so
      // node16/nodenext consumers get CommonJS and ES module types for the
      // matching build. A primary out dir with a module format makes the
      // plugin write every relative specifier with its runtime extension
      // (`./fetcher.js` in `.d.ts`, `./fetcher.cjs` in `.d.cts`), whatever
      // the source wrote.
      outDirs: [{ dir: 'dist', moduleFormat: 'cjs' }, 'dist'],
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
