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
 * Generates llms-full.txt by inlining all wiki markdown pages.
 *
 * Follows the llms.txt specification (https://llmstxt.org/):
 * - Strips YAML frontmatter from each page
 * - Preserves Mermaid diagrams, citations, tables
 * - Orders pages by importance (Onboarding → Getting Started → Architecture → Packages → API → Testing)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wikiDir = join(__dirname, '..')

const TODAY = new Date().toISOString().slice(0, 10)

// Page collection order — mirrors sidebar navigation importance
const PAGE_SECTIONS = [
  {
    heading: 'Onboarding',
    pages: [
      'onboarding/contributor.md',
      'onboarding/staff-engineer.md',
      'onboarding/executive.md',
      'onboarding/product-manager.md',
    ],
  },
  {
    heading: 'Getting Started',
    pages: [
      'guide/index.md',
      'guide/quick-start.md',
      'guide/configuration.md',
      'guide/contributing.md',
    ],
  },
  {
    heading: 'Architecture',
    pages: [
      'architecture/index.md',
      'architecture/fetcher-core.md',
      'architecture/interceptors.md',
      'architecture/eventstream.md',
      'architecture/url-builder.md',
    ],
  },
  {
    heading: 'Packages',
    pages: [
      'packages/index.md',
      'packages/fetcher.md',
      'packages/decorator.md',
      'packages/eventbus.md',
      'packages/eventstream.md',
      'packages/openai.md',
      'packages/openapi.md',
      'packages/generator.md',
      'packages/react.md',
      'packages/storage.md',
      'packages/cosec.md',
      'packages/wow.md',
      'packages/viewer.md',
    ],
  },
  {
    heading: 'API Reference',
    pages: [
      'api/index.md',
      'api/fetcher-client.md',
      'api/decorators.md',
      'api/react-hooks.md',
      'api/type-definitions.md',
    ],
  },
  {
    heading: 'Testing',
    pages: [
      'testing/index.md',
      'testing/unit-testing.md',
      'testing/integration-testing.md',
      'testing/browser-testing.md',
    ],
  },
]

/** Strip YAML frontmatter (--- ... ---) from markdown content */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}

/** Extract the first H1 title from markdown, falling back to the filename */
function extractTitle(content, fallbackPath) {
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) {
    return h1Match[1].trim()
  }
  // Derive a readable title from the path
  const base = fallbackPath.replace(/\.md$/, '').replace(/[-_]/g, ' ')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** Read and normalize a single wiki page */
function readPage(relPath) {
  const absPath = join(wikiDir, relPath)
  if (!existsSync(absPath)) {
    return null
  }
  const raw = readFileSync(absPath, 'utf8')
  const body = stripFrontmatter(raw).trim()
  const title = extractTitle(body, relPath)
  return { title, path: relPath, body }
}

function generate() {
  const parts = []

  parts.push('# Fetcher Wiki — Full Content')
  parts.push('')
  parts.push(
    `> All documentation pages inlined for LLM consumption. Generated ${TODAY}.`,
  )
  parts.push('')

  let total = 0
  let missing = 0

  for (const section of PAGE_SECTIONS) {
    parts.push(`## ${section.heading}`)
    parts.push('')

    for (const pagePath of section.pages) {
      const page = readPage(pagePath)
      if (!page) {
        console.warn(`⚠  Missing: ${pagePath}`)
        missing++
        continue
      }
      parts.push(`<doc title="${page.title}" path="${page.path}">`)
      parts.push('')
      parts.push(page.body)
      parts.push('')
      parts.push('</doc>')
      parts.push('')
      total++
    }
  }

  const output = parts.join('\n')
  writeFileSync(join(wikiDir, 'llms-full.txt'), output, 'utf8')

  console.log(
    `✓ Generated llms-full.txt: ${total} pages, ${missing} missing, ${(output.length / 1024).toFixed(1)} KB`,
  )
}

generate()
