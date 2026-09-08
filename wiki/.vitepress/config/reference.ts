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

export function referenceSidebar(zh = false) {
  const prefix = zh ? '/zh' : '';
  const entries = referencePackages.map(({ name, topics }) => {
    const items = topics.map(topic => {
      const source = readFileSync(
        new URL(
          `../../${zh ? 'zh/' : ''}reference/${name}/${topic}.md`,
          import.meta.url,
        ),
        'utf8',
      );
      const title =
        source.match(/^title:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, '') ??
        topic;
      return {
        text: title,
        link: `${prefix}/reference/${name}/${topic === 'index' ? '' : topic}`,
      };
    });
    return { name, text: name === 'fetcher' ? 'Fetcher' : name, items };
  });
  const packages = entries.map(({ text, items }) => ({
    text,
    link: items[0].link,
  }));
  return Object.fromEntries([
    [
      `${prefix}/reference/`,
      [{ text: zh ? '所有包' : 'All packages', items: packages }],
    ],
    ...entries.map(({ name, text, items }) => [
      `${prefix}/reference/${name}/`,
      [
        {
          text: zh ? '← 包索引' : '← Package index',
          link: `${prefix}/reference/`,
        },
        { text, items },
        {
          text: zh ? '其他包' : 'Other packages',
          collapsed: true,
          items: packages.filter(item => item.link !== items[0].link),
        },
      ],
    ]),
  ]);
}
