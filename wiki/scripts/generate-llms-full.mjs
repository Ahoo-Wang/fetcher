#!/usr/bin/env node
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

/**
 * Generates llms.txt and llms-full.txt from the current wiki information architecture.
 *
 * Follows the llms.txt specification (https://llmstxt.org/):
 * - Strips YAML frontmatter from each page
 * - Preserves Mermaid diagrams, citations, tables
 * - Keeps the compact index and inlined corpus on the same canonical routes
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wikiDir = join(__dirname, '..');

const TODAY = new Date().toISOString().slice(0, 10);

// Page collection order — mirrors the public sidebar.
const PAGE_SECTIONS = [
  {
    heading: 'Start',
    pages: [
      'start/index.md',
      'start/installation.md',
      'start/first-request.md',
      'start/choose-packages.md',
    ],
  },
  {
    heading: 'Learn',
    pages: [
      'learn/request-lifecycle.md',
      'learn/requests-and-results.md',
      'learn/interceptors-errors-timeouts.md',
      'learn/streaming.md',
      'learn/react-data-flow.md',
    ],
  },
  {
    heading: 'Recipes',
    pages: [
      'recipes/declarative-services.md',
      'recipes/openapi-client.md',
      'recipes/openai-streaming.md',
      'recipes/wow-cqrs.md',
      'recipes/cosec-authentication.md',
      'recipes/state-and-events.md',
      'recipes/data-viewer.md',
    ],
  },
  {
    heading: 'Skills',
    pages: [
      'skills/index.md',
      'skills/http-and-services.md',
      'skills/streaming-and-openai.md',
      'skills/openapi-and-generation.md',
      'skills/react-and-integrations.md',
    ],
  },
  {
    heading: 'Reference',
    pages: [
      'reference/index.md',
      'reference/fetcher.md',
      'reference/decorator.md',
      'reference/eventbus.md',
      'reference/eventstream.md',
      'reference/storage.md',
      'reference/react.md',
      'reference/openapi.md',
      'reference/generator.md',
      'reference/openai.md',
      'reference/wow.md',
      'reference/cosec.md',
      'reference/viewer.md',
    ],
  },
  {
    heading: 'Contributing',
    pages: [
      'contributing/index.md',
      'contributing/development.md',
      'contributing/testing.md',
      'contributing/documentation.md',
    ],
  },
];

/** Strip YAML frontmatter (--- ... ---) from markdown content */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/** Extract the first H1 title from markdown, falling back to the filename */
function extractTitle(content, fallbackPath) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  // Derive a readable title from the path
  const base = fallbackPath.replace(/\.md$/, '').replace(/[-_]/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function extractDescription(content) {
  return content.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? '';
}

function toRoute(pagePath) {
  return `/${pagePath.replace(/index\.md$/, '').replace(/\.md$/, '')}`;
}

/** Read and normalize a single wiki page */
function readPage(relPath) {
  const absPath = join(wikiDir, relPath);
  if (!existsSync(absPath)) {
    return null;
  }
  const raw = readFileSync(absPath, 'utf8');
  const body = stripFrontmatter(raw).trim();
  const title = extractTitle(body, relPath);
  return {
    title,
    description: extractDescription(raw),
    path: relPath,
    route: toRoute(relPath),
    body,
  };
}

function generate() {
  const indexParts = [
    '# Fetcher',
    '',
    '> Typed HTTP clients, streaming, React hooks, and data viewers.',
    '',
  ];
  const parts = [];

  parts.push('# Fetcher Wiki — Full Content');
  parts.push('');
  parts.push(
    `> All documentation pages inlined for LLM consumption. Generated ${TODAY}.`,
  );
  parts.push('');

  let total = 0;
  let missing = 0;

  for (const section of PAGE_SECTIONS) {
    indexParts.push(`## ${section.heading}`, '');
    parts.push(`## ${section.heading}`);
    parts.push('');

    for (const pagePath of section.pages) {
      const page = readPage(pagePath);
      if (!page) {
        console.warn(`⚠  Missing: ${pagePath}`);
        missing++;
        continue;
      }
      const suffix = page.description ? ` — ${page.description}` : '';
      indexParts.push(`- [${page.title}](${page.route})${suffix}`);
      parts.push(`<doc title="${page.title}" path="${page.path}">`);
      parts.push('');
      parts.push(page.body);
      parts.push('');
      parts.push('</doc>');
      parts.push('');
      total++;
    }
    indexParts.push('');
  }

  indexParts.push(
    '## 中文文档',
    '',
    '- [Fetcher 中文文档](/zh/) — 与英文文档采用相同的信息架构。',
    '',
  );

  // Chinese translations (zh/ mirror)
  parts.push('## 中文翻译 (Chinese Translations)');
  parts.push('');

  for (const section of PAGE_SECTIONS) {
    for (const pagePath of section.pages) {
      const zhPath = `zh/${pagePath}`;
      const page = readPage(zhPath);
      if (!page) {
        continue;
      }
      parts.push(`<doc title="${page.title}" path="${page.path}">`);
      parts.push('');
      parts.push(page.body);
      parts.push('');
      parts.push('</doc>');
      parts.push('');
      total++;
    }
  }

  const indexOutput = indexParts.join('\n');
  const fullOutput = parts.join('\n');
  writeFileSync(join(wikiDir, 'llms.txt'), indexOutput, 'utf8');
  writeFileSync(join(wikiDir, 'llms-full.txt'), fullOutput, 'utf8');

  console.log(
    `✓ Generated llms.txt and llms-full.txt: ${total} pages, ${missing} missing, ${(fullOutput.length / 1024).toFixed(1)} KB`,
  );
}

generate();
