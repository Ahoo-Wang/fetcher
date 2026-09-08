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
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { createMarkdownRenderer, resolveConfig } from 'vitepress';
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
        assert.doesNotMatch(
          source,
          /^## (?:旧章节链接|Earlier section links)$/m,
          path,
        );
      }
    }
  }
});

test('LLM corpus includes every canonical page in both languages exactly once', () => {
  const wiki = new URL('../', import.meta.url);
  const directories = [
    'start',
    'guides',
    'architecture',
    'examples',
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
        if (file.endsWith('.md')) expected.push(path);
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

test('reference tables preserve complete union type code spans in both languages', async () => {
  const wiki = new URL('../', import.meta.url);
  const markdown = await createMarkdownRenderer(fileURLToPath(wiki));
  const contracts = {
    'fetcher/requests': [
      'string | undefined',
      'BodyInit | Record<string, any> | string | null',
    ],
    'fetcher/interceptors': ['void | Promise<void>'],
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
            token.type === 'inline' &&
            (topic === 'fetcher/interceptors' ||
              tokens[index - 1]?.type === 'td_open'),
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

test('LLM corpus expands the actual shared examples', () => {
  const corpus = readFileSync(
    new URL('../llms-full.txt', import.meta.url),
    'utf8',
  );
  for (const path of [
    'examples/http/client.ts',
    '../stories/docs/ReactRequests.tsx',
    '../stories/docs/LocalViewer.tsx',
  ]) {
    const source = readFileSync(
      new URL(`../${path}`, import.meta.url),
      'utf8',
    ).trimEnd();
    assert.ok(corpus.includes(source), `missing source: ${path}`);
  }
  assert.doesNotMatch(corpus, /^<<< /m);
});

test('code references reject missing, escaped, symlinked and unsupported targets with context', async () => {
  const { expandCodeReferences } =
    await import('../scripts/code-references.mjs');
  const { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = mkdtempSync(join(tmpdir(), 'fetcher-code-'));
  try {
    const wiki = join(root, 'repo/wiki');
    mkdirSync(wiki, { recursive: true });
    writeFileSync(join(root, 'external.ts'), 'private external content');
    symlinkSync(join(root, 'external.ts'), join(wiki, 'linked.ts'));
    for (const target of [
      '@/missing.ts',
      '@/../../external.ts',
      '@/linked.ts',
      '@/code.ts{1-2}',
      '@/code.ts#section',
    ]) {
      assert.throws(
        () =>
          expandCodeReferences(`<<< ${target}`, 'zh/examples/http.md', wiki),
        error =>
          error.message.includes('zh/examples/http.md') &&
          error.message.includes(target),
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('canonical reading groups stop before unrelated tasks and packages', async () => {
  const { readingGroups, pageSections } =
    await import('../.vitepress/config/pages.mjs');
  const expected = pageSections.flatMap(section => section.pages);
  assert.equal(expected.length, new Set(expected).size);
  const groups = [
    ...readingGroups,
    ...referencePackages.map(({ name, topics }) => ({
      directory: `reference/${name}`,
      topics,
    })),
  ];
  for (const { directory, topics } of groups) {
    for (const prefix of ['', 'zh/']) {
      const first = readFileSync(
        new URL(`../${prefix}${directory}/${topics[0]}.md`, import.meta.url),
        'utf8',
      );
      const last = readFileSync(
        new URL(
          `../${prefix}${directory}/${topics.at(-1)}.md`,
          import.meta.url,
        ),
        'utf8',
      );
      assert.match(first, /^prev: false$/m, directory);
      assert.match(last, /^next: false$/m, directory);
    }
  }
  for (const { topics } of referencePackages)
    assert.equal(topics.at(-1), 'symbols');
});

test('missing Chinese page fails before either LLM artifact is written', async () => {
  const { pageSections } = await import('../.vitepress/config/pages.mjs');
  const { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const root = mkdtempSync(join(tmpdir(), 'fetcher-corpus-'));
  try {
    const wiki = join(root, 'wiki');
    for (const path of [
      'scripts/generate-llms-full.mjs',
      'scripts/code-references.mjs',
      '.vitepress/config/pages.mjs',
      '.vitepress/config/reference.mjs',
    ]) {
      mkdirSync(dirname(join(wiki, path)), { recursive: true });
      copyFileSync(new URL(`../${path}`, import.meta.url), join(wiki, path));
    }
    for (const path of pageSections.flatMap(section => section.pages))
      for (const prefix of ['', 'zh/']) {
        if (`${prefix}${path}` === 'zh/reference/viewer/symbols.md') continue;
        mkdirSync(dirname(join(wiki, prefix, path)), { recursive: true });
        writeFileSync(
          join(wiki, prefix, path),
          '---\ntitle: Test\ndescription: Test\n---\n# Test',
        );
      }
    for (const path of ['llms.txt', 'llms-full.txt'])
      writeFileSync(join(wiki, path), 'unchanged');
    const result = spawnSync(
      process.execPath,
      [join(wiki, 'scripts/generate-llms-full.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /zh\/reference\/viewer\/symbols.md/);
    for (const path of ['llms.txt', 'llms-full.txt'])
      assert.equal(readFileSync(join(wiki, path), 'utf8'), 'unchanged');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('every sidebar connects all sections with the current context expanded', async () => {
  const { site } = await resolveConfig(
    fileURLToPath(new URL('../', import.meta.url)),
  );
  const sections = [
    'start',
    'guides',
    'architecture',
    'reference',
    'examples',
    'skills',
    'contributing',
  ];
  const linksOf = items =>
    items.flatMap(item => [
      ...(item.link ? [item.link] : []),
      ...linksOf(item.items ?? []),
    ]);
  for (const [locale, prefix] of [
    ['root', ''],
    ['zh', '/zh'],
  ]) {
    const sidebar = site.locales[locale].themeConfig.sidebar;
    for (const [route, items] of Object.entries(sidebar)) {
      assert.equal(items.length, sections.length, route);
      const current = route.slice(prefix.length + 1).split('/')[0];
      items.forEach((section, index) => {
        assert.equal(section.items[0].link, `${prefix}/${sections[index]}/`);
        assert.equal(section.collapsed, sections[index] !== current, route);
      });
      const links = linksOf(items);
      assert.equal(new Set(links).size, links.length, route);
      assert.ok(links.includes(`${prefix}/guides/http/shared-client`));
      assert.ok(links.includes(`${prefix}/reference/viewer/symbols`));
      for (const name of ['guides', 'reference']) {
        const groups = items[sections.indexOf(name)].items.slice(1);
        groups.forEach(group => {
          const groupRoute = group.items[0].link;
          assert.equal(group.collapsed, groupRoute !== route);
          assert.equal(
            group.items[0].text,
            locale === 'zh' ? '概览' : 'Overview',
          );
          if (name === 'reference')
            assert.match(group.items.at(-1).link, /\/symbols$/);
        });
        if (name === 'reference')
          assert.deepEqual(
            groups.map(group => group.items[0].link),
            referencePackages.map(pkg => `${prefix}/reference/${pkg.name}/`),
            `Package order must stay stable at ${route}`,
          );
      }
    }
  }
});
