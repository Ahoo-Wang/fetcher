/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';
import { legacyUmdPath } from '../../scripts/legacy-umd-path.mjs';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherReact',
      fileName: format =>
        format === 'es' ? 'index.es.js' : `index.${format}.cjs`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react/compiler-runtime',
        'react-compiler-runtime',
        'antd',
        '@ant-design/icons',
        '@ahoo-wang/fetcher',
        '@ahoo-wang/fetcher-decorator',
        '@ahoo-wang/fetcher-eventbus',
        '@ahoo-wang/fetcher-eventstream',
        '@ahoo-wang/fetcher-storage',
        '@ahoo-wang/fetcher-wow',
        '@ahoo-wang/fetcher-react',
        '@ahoo-wang/fetcher-openapi',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'react/jsx-dev-runtime': 'ReactJSXDevRuntime',
          'react/compiler-runtime': 'ReactCompilerRuntime',
          'react-compiler-runtime': 'ReactCompilerRuntime',
          antd: 'Antd',
          '@ant-design/icons': 'AntdIcons',
          '@ahoo-wang/fetcher': 'Fetcher',
          '@ahoo-wang/fetcher-decorator': 'FetcherDecorator',
          '@ahoo-wang/fetcher-eventbus': 'FetcherEventBus',
          '@ahoo-wang/fetcher-eventstream': 'FetcherEventStream',
          '@ahoo-wang/fetcher-storage': 'FetcherStorage',
          '@ahoo-wang/fetcher-wow': 'FetcherWow',
          '@ahoo-wang/fetcher-react': 'FetcherReact',
          '@ahoo-wang/fetcher-openapi': 'FetcherOpenAPI',
        },
        keepNames: true,
      },
    },
  },
  plugins: [
    // 5.x: also write the UMD bundle to its old dist/index.umd.js URL.
    legacyUmdPath(),
    libInjectCss(),
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
    react(),
    babel({
      plugins: [
        'babel-plugin-transform-typescript-metadata',
        '@babel/plugin-transform-class-static-block',
        ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
      ],
      presets: [reactCompilerPreset()],
    }),
  ],
});
