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

import { readFileSync } from 'node:fs';
import { referencePackages } from './reference.mjs';
import { readingGroups } from './pages.mjs';

// Navigation labels stay concise without changing article titles.
const labels: Record<string, [string, string]> = {
  'start/installation': ['Installation', '安装'],
  'start/first-request': ['First request', '第一个请求'],
  'start/first-view': ['First data view', '第一个数据视图'],
  'start/next-steps': ['Next steps', '下一步'],
  'guides/http/shared-client': ['Shared client', '共享客户端'],
  'guides/http/requests': ['Request construction', '请求构造'],
  'guides/http/results': ['Results and validation', '结果与校验'],
  'guides/http/failures': ['Error handling', '错误处理'],
  'guides/http/cancellation': ['Cancellation and timeouts', '取消与超时'],
  'guides/http/interceptors': ['Interceptors', '拦截器'],
  'guides/services/declarative-client': ['Declarative clients', '声明式客户端'],
  'guides/services/generated-client': ['Generated clients', '生成客户端'],
  'guides/streaming/sse': ['SSE events', 'SSE 事件'],
  'guides/streaming/chat': ['Streaming chat', '流式对话'],
  'guides/react/requests': ['Request state', '请求状态'],
  'guides/react/queries': ['Queries', '查询'],
  'guides/react/debounce': ['Debouncing', '防抖'],
  'guides/react/cleanup': ['Cancellation and cleanup', '取消与清理'],
  'guides/view-engine/getting-started': ['Getting started', '快速接入'],
  'guides/view-engine/filters': ['Filters', '筛选器'],
  'guides/view-engine/table-and-runtime': ['Table and runtime', '表格与运行时'],
  'guides/view-engine/saved-views': ['Saved views', '保存视图'],
  'guides/view-engine/extensions': ['Extensions', '业务扩展'],
  'guides/viewer/local-data': ['Local data', '本地数据'],
  'guides/viewer/pagination-and-sorting': [
    'Pagination and sorting',
    '分页与排序',
  ],
  'guides/viewer/filters': ['Filtering', '过滤'],
  'guides/viewer/saved-views': ['Saved views', '保存视图'],
  'guides/viewer/remote-data': ['Remote data', '远端数据'],
  'guides/integrations/wow': ['Wow commands and state', 'Wow 命令与状态'],
  'guides/integrations/cosec': ['CoSec authentication', 'CoSec 认证'],
  'guides/integrations/storage-and-events': [
    'Storage and events',
    '存储与事件',
  ],
  'reference/eventstream/json-and-results': [
    'JSON and extraction',
    'JSON 与结果提取',
  ],
  'reference/viewer/view-and-viewer': ['View and Viewer', 'View 与 Viewer'],
  'reference/viewer/models-and-state': ['Models and state', '模型与状态'],
  'reference/viewer/saved-views': ['Saved views', '保存视图'],
  'reference/viewer/fetcher-viewer': ['FetcherViewer', 'FetcherViewer'],
  'reference/viewer/registries-and-inputs': [
    'Registries and inputs',
    '注册表与输入',
  ],
  'reference/viewer/toolbar-and-locale': [
    'Toolbar and locale',
    '工具栏与本地化',
  ],
};

function pageTitle(directory: string, topic: string, zh: boolean) {
  const source = readFileSync(
    new URL(
      `../../${zh ? 'zh/' : ''}${directory}/${topic}.md`,
      import.meta.url,
    ),
    'utf8',
  );
  return (
    source.match(/^title:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, '') ?? topic
  );
}

function pageItems(directory: string, topics: string[], zh: boolean) {
  return topics.map(topic => ({
    text:
      topic === 'index'
        ? zh
          ? '概览'
          : 'Overview'
        : topic === 'symbols'
          ? zh
            ? '符号索引'
            : 'Symbol index'
          : (labels[`${directory}/${topic}`]?.[zh ? 1 : 0] ??
            pageTitle(directory, topic, zh)),
    link: `${zh ? '/zh' : ''}/${directory}/${topic === 'index' ? '' : topic}`,
  }));
}

export function siteSidebar(zh = false) {
  const prefix = zh ? '/zh' : '';
  const sections: [string, string, string][] = [
    ['start', 'Start', '开始使用'],
    ['guides', 'Guides', '开发指南'],
    ['architecture', 'Architecture', '架构与选型'],
    ['reference', 'API reference', 'API 参考'],
    ['examples', 'Examples', '完整示例'],
    ['skills', 'Skills', 'Skills'],
    ['contributing', 'Contributing', '贡献指南'],
  ];
  const groups = readingGroups.map(({ directory, topics }) => ({
    directory,
    text: pageTitle(directory, 'index', zh),
    items: pageItems(directory, topics, zh),
  }));
  const packages = referencePackages.map(({ name, topics }) => ({
    directory: `reference/${name}`,
    text: name === 'fetcher' ? 'Fetcher' : name,
    items: pageItems(`reference/${name}`, topics, zh),
  }));
  const contexts = [
    ...groups.map(group => group.directory),
    'reference',
    ...packages.map(pkg => pkg.directory),
  ];
  return Object.fromEntries(
    contexts.map(current => [
      `${prefix}/${current}/`,
      sections.map(([directory, en, cn]) => {
        const children =
          directory === 'guides'
            ? groups.filter(group => group.directory.startsWith('guides/'))
            : directory === 'reference'
              ? packages
              : [];
        return {
          text: zh ? cn : en,
          collapsed: current.split('/')[0] !== directory,
          items: children.length
            ? [
                ...pageItems(directory, ['index'], zh),
                ...children.map(group => ({
                  text: group.text,
                  collapsed: group.directory !== current,
                  items: group.items,
                })),
              ]
            : groups.find(group => group.directory === directory)!.items,
        };
      }),
    ]),
  );
}
