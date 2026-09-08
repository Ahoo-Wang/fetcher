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

import { referencePackages } from './reference.mjs';

// Explicit reading groups; each group ends before unrelated tasks or packages.
export const readingGroups = [
  {
    directory: 'start',
    topics: [
      'index',
      'installation',
      'first-request',
      'first-view',
      'next-steps',
    ],
  },
  {
    directory: 'guides',
    topics: ['index'],
  },
  {
    directory: 'guides/http',
    topics: [
      'index',
      'shared-client',
      'requests',
      'results',
      'failures',
      'cancellation',
      'interceptors',
    ],
  },
  {
    directory: 'guides/services',
    topics: ['index', 'declarative-client', 'generated-client'],
  },
  {
    directory: 'guides/streaming',
    topics: ['index', 'sse', 'chat'],
  },
  {
    directory: 'guides/react',
    topics: ['index', 'requests', 'queries', 'debounce', 'cleanup'],
  },
  {
    directory: 'guides/viewer',
    topics: [
      'index',
      'local-data',
      'pagination-and-sorting',
      'filters',
      'saved-views',
      'remote-data',
    ],
  },
  {
    directory: 'guides/integrations',
    topics: ['index', 'wow', 'cosec', 'storage-and-events'],
  },
  {
    directory: 'architecture',
    topics: [
      'index',
      'package-boundaries',
      'runtime-support',
      'request-lifecycle',
      'state-and-resources',
      'failure-model',
      'integration-decisions',
    ],
  },
  {
    directory: 'examples',
    topics: ['index', 'http', 'react', 'viewer'],
  },
  {
    directory: 'skills',
    topics: [
      'index',
      'http-and-services',
      'streaming-and-openai',
      'openapi-and-generation',
      'react-and-integrations',
    ],
  },
  {
    directory: 'contributing',
    topics: ['index', 'development', 'testing', 'documentation'],
  },
];
export const pageSections = [
  { heading: 'Overview', pages: ['index.md'] },
  ...readingGroups.map(({ directory, topics }) => ({
    heading: directory,
    pages: topics.map(topic => directory + '/' + topic + '.md'),
  })),
  {
    heading: 'Reference',
    pages: [
      'reference/index.md',
      ...referencePackages.flatMap(({ name, topics }) =>
        topics.map(topic => 'reference/' + name + '/' + topic + '.md'),
      ),
    ],
  },
];
