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

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherReact',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@ahoo-wang/fetcher',
        '@ahoo-wang/fetcher-storage',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@ahoo-wang/fetcher': 'Fetcher',
          '@ahoo-wang/fetcher-storage': 'FetcherStorage',
        },
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
  plugins: [
    dts({
      outDirs: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
