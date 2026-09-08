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

// Canonical Reference page order, shared by navigation and LLM output.
export const referencePackages = [
  {
    name: 'fetcher',
    topics: [
      'index',
      'client',
      'requests',
      'urls',
      'results',
      'interceptors',
      'errors-and-cancellation',
    ],
  },
  {
    name: 'decorator',
    topics: ['index', 'services-and-endpoints', 'parameters', 'execution'],
  },
  {
    name: 'eventbus',
    topics: ['index', 'events-and-delivery', 'broadcast-and-messengers'],
  },
  {
    name: 'eventstream',
    topics: [
      'index',
      'sse-pipeline',
      'json-and-results',
      'consumption-and-cancellation',
    ],
  },
  {
    name: 'storage',
    topics: ['index', 'key-storage', 'serialization-and-runtime'],
  },
  {
    name: 'openapi',
    topics: [
      'index',
      'documents-and-operations',
      'schemas-and-references',
      'security-and-extensions',
    ],
  },
  {
    name: 'generator',
    topics: [
      'index',
      'cli',
      'configuration',
      'generated-output',
      'programmatic-api',
      'wow-discovery',
    ],
  },
  {
    name: 'openai',
    topics: ['index', 'client-and-completions', 'streaming'],
  },
  {
    name: 'cosec',
    topics: [
      'index',
      'configuration',
      'tokens-and-refresh',
      'interceptors-and-attribution',
    ],
  },
  {
    name: 'react',
    topics: [
      'index',
      'fetcher-hooks',
      'promise-and-query-state',
      'api-hooks',
      'debounce',
      'storage-and-events',
      'cosec',
      'wow',
      'monitoring-and-utilities',
    ],
  },
  {
    name: 'wow',
    topics: [
      'index',
      'configuration',
      'commands',
      'snapshot-queries',
      'filters',
      'query-options',
      'cursor-queries',
      'aggregations',
      'events-and-history',
      'shared-types',
    ],
  },
  {
    name: 'viewer',
    topics: [
      'index',
      'models-and-state',
      'view-and-viewer',
      'saved-views',
      'fetcher-viewer',
      'filters',
      'tables-and-cells',
      'registries-and-inputs',
      'toolbar-and-locale',
    ],
  },
];
