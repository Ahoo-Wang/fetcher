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

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { createMarkdownRenderer } from 'vitepress';
import { fileURLToPath } from 'node:url';
import { referencePackages } from '../.vitepress/config/reference.mjs';

test('every reference topic has complete bilingual page metadata', () => {
  for (const { name, topics } of referencePackages) {
    for (const topic of topics) {
      for (const prefix of ['', 'zh/']) {
        const path = `${prefix}reference/${name}/${topic}.md`;
        const source = readFileSync(
          new URL(`../${path}`, import.meta.url),
          'utf8',
        );
        assert.match(source, /^---\r?\n/, path);
        assert.match(source, /^title: .+/m, path);
        assert.match(source, /^description: .+/m, path);
        if (topic === 'index')
          assert.doesNotMatch(
            source,
            /\]\(\.\.?\//,
            `${path}: old non-slash URLs need absolute topic links`,
          );
      }
    }
  }
});

test('LLM corpus includes every canonical page in both languages exactly once', () => {
  const wiki = new URL('../', import.meta.url);
  const old = new Set(
    referencePackages.flatMap(({ name }) => [
      `reference/${name}.md`,
      `zh/reference/${name}.md`,
    ]),
  );
  const directories = [
    'start',
    'learn',
    'recipes',
    'reference',
    'skills',
    'contributing',
  ];
  const expected = ['index.md', 'zh/index.md'];
  for (const prefix of ['', 'zh/']) {
    for (const directory of directories) {
      for (const file of readdirSync(new URL(`${prefix}${directory}/`, wiki), {
        recursive: true,
      })) {
        const path = `${prefix}${directory}/${file}`;
        if (file.endsWith('.md') && !old.has(path)) expected.push(path);
      }
    }
  }
  const corpus = readFileSync(new URL('llms-full.txt', wiki), 'utf8');
  const actual = [
    ...corpus.matchAll(/<doc title="[^"\n]*" path="([^"]+)">/g),
  ].map(match => match[1]);
  assert.equal(actual.length, new Set(actual).size, 'duplicate corpus page');
  assert.deepEqual(new Set(actual), new Set(expected));
});

test('legacy pages cannot shadow the canonical package directory on static hosts', () => {
  const dist = new URL('../.vitepress/dist/', import.meta.url);
  for (const { name } of referencePackages) {
    for (const prefix of ['', 'zh/']) {
      assert.ok(
        existsSync(new URL(`${prefix}reference/${name}/index.html`, dist)),
      );
      assert.ok(
        existsSync(new URL(`${prefix}reference/${name}/migration.html`, dist)),
      );
      assert.equal(
        existsSync(new URL(`${prefix}reference/${name}.html`, dist)),
        false,
      );
    }
  }
});

test('reference tables preserve complete union type code spans in both languages', async () => {
  const wiki = new URL('../', import.meta.url);
  const markdown = await createMarkdownRenderer(fileURLToPath(wiki));
  const contracts = {
    'fetcher/requests': [
      'string | undefined',
      'BodyInit | Record<string, any> | string | null',
    ],
    'fetcher/index': ['void | Promise<void>'],
    'decorator/services-and-endpoints': ['fetcher?: string | Fetcher'],
    'storage/serialization-and-runtime': [
      'getItem(key): string | null',
      'key(index): string | null',
    ],
    'storage/key-storage': ['T | null'],
  };
  for (const prefix of ['', 'zh/']) {
    for (const [topic, expected] of Object.entries(contracts)) {
      const path = `${prefix}reference/${topic}.md`;
      const source = readFileSync(new URL(path, wiki), 'utf8');
      const tokens = markdown.parse(source, {});
      const codes = tokens
        .filter(
          (token, index) =>
            token.type === 'inline' && tokens[index - 1]?.type === 'td_open',
        )
        .flatMap(token => token.children ?? [])
        .filter(token => token.type === 'code_inline')
        .map(token => token.content);
      for (const contract of expected)
        assert.ok(
          codes.includes(contract),
          `${path}: missing rendered ${contract}`,
        );
    }
  }
});

test('LLM index emits description text without YAML delimiters', () => {
  const index = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
  assert.ok(
    index.includes(
      '- [Fetcher reference](/reference/fetcher/) — HTTP requests with explicit result extraction, ordered interceptors, and native Fetch cancellation.',
    ),
  );
});
