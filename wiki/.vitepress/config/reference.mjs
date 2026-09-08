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
      'symbols',
    ],
  },
  {
    name: 'decorator',
    topics: [
      'index',
      'services-and-endpoints',
      'parameters',
      'execution',
      'symbols',
    ],
  },
  {
    name: 'eventbus',
    topics: [
      'index',
      'events-and-delivery',
      'broadcast-and-messengers',
      'symbols',
    ],
  },
  {
    name: 'eventstream',
    topics: [
      'index',
      'sse-pipeline',
      'json-and-results',
      'consumption-and-cancellation',
      'symbols',
    ],
  },
  {
    name: 'storage',
    topics: ['index', 'key-storage', 'serialization-and-runtime', 'symbols'],
  },
  {
    name: 'openapi',
    topics: [
      'index',
      'documents-and-operations',
      'schemas-and-references',
      'security-and-extensions',
      'symbols',
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
      'symbols',
    ],
  },
  {
    name: 'openai',
    topics: ['index', 'client-and-completions', 'streaming', 'symbols'],
  },
  {
    name: 'cosec',
    topics: [
      'index',
      'configuration',
      'tokens-and-refresh',
      'interceptors-and-attribution',
      'symbols',
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
      'wow',
      'storage-and-events',
      'cosec',
      'monitoring-and-utilities',
      'symbols',
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
      'identity-and-attribution',
      'messages-and-state',
      'errors-and-utilities',
      'operator-locales',
      'symbols',
    ],
  },
  {
    name: 'viewer',
    topics: [
      'index',
      'view-and-viewer',
      'models-and-state',
      'filters',
      'tables-and-cells',
      'saved-views',
      'fetcher-viewer',
      'registries-and-inputs',
      'toolbar-and-locale',
      'symbols',
    ],
  },
];
