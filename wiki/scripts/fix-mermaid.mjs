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
 * Mermaid syntax validator and fixer using mermaid-cli (mmdc).
 *
 * 1. Check that the validator itself works by rendering a known-valid diagram.
 * 2. Validate every Mermaid block in the wiki's Markdown files with `mmdc`.
 * 3. For a block mmdc rejects, try the non-destructive fixes first and the
 *    ones that delete styles only if those are not enough; keep a fix only
 *    when mmdc accepts the result.
 * 4. Write the files after every block has been validated.
 *
 * Exit codes: 0 every block is valid (after fixes), 1 some blocks are still
 * invalid (those blocks are left as they were), 2 the validator could not run
 * (missing mmdc, browser failure, timeout); no file is written.
 *
 * Environment: MMDC (the mmdc command, default `mmdc` on PATH),
 * MMDC_TIMEOUT_MS (per-diagram timeout, default 30000) and
 * PUPPETEER_EXECUTABLE_PATH (the browser mmdc drives; defaults to the system
 * Chrome on macOS when it is installed).
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const MMDC = process.env.MMDC || 'mmdc';
const TIMEOUT_MS = Number(process.env.MMDC_TIMEOUT_MS) || 30000;
const MAC_CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(MAC_CHROME))
  process.env.PUPPETEER_EXECUTABLE_PATH = MAC_CHROME;

// Failures of mmdc or its browser rather than of the diagram.
const INFRASTRUCTURE_ERROR =
  /Failed to launch the browser process|Could not find (?:Chrome|Chromium|expected browser)|Browser was not found|Protocol error|TimeoutError|Navigation timeout|command not found|is not recognized as an internal or external command/i;
const PREFLIGHT = 'flowchart LR\n  A[Input] --> B[Output]\n';

class ValidatorUnavailableError extends Error {}

const tempDir = mkdtempSync(join(tmpdir(), 'mermaid-validate-'));
let validations = 0;

/**
 * Validate a single mermaid block using mmdc.
 * Returns { valid: boolean, error: string | null }; throws
 * ValidatorUnavailableError when mmdc could not judge the diagram.
 */
function validateBlock(block) {
  const id = validations++;
  const input = join(tempDir, `block_${id}.mmd`);
  const output = join(tempDir, `block_${id}.svg`);
  writeFileSync(input, block, 'utf-8');
  const result = spawnSync(
    MMDC,
    ['-i', input, '-o', output, '-q', '-t', 'dark', '-b', 'transparent'],
    {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    },
  );
  if (result.error?.code === 'ENOENT')
    throw new ValidatorUnavailableError(
      `Mermaid CLI "${MMDC}" was not found. Install @mermaid-js/mermaid-cli (see wiki/contributing/documentation.md) or set MMDC.`,
    );
  if (result.error?.code === 'ETIMEDOUT' || result.signal)
    throw new ValidatorUnavailableError(
      `Mermaid CLI "${MMDC}" did not finish within ${TIMEOUT_MS} ms${result.signal ? ` (${result.signal})` : ''}.`,
    );
  if (result.error)
    throw new ValidatorUnavailableError(
      `Mermaid CLI "${MMDC}" could not run: ${result.error.message}`,
    );
  if (result.status === 0) return { valid: true, error: null };
  const error = (result.stderr || result.stdout || '').trim();
  if (!error || INFRASTRUCTURE_ERROR.test(error))
    throw new ValidatorUnavailableError(
      `Mermaid CLI "${MMDC}" failed (exit ${result.status}): ${error || 'no output'}`,
    );
  return { valid: false, error };
}

const firstLine = block => block.trim().split('\n')[0].trim();

function removeLines(regex, label) {
  return block => {
    const count = (block.match(regex) || []).length;
    return count > 0
      ? {
          block: block.replace(regex, ''),
          change: `Removed ${count}x ${label}`,
        }
      : null;
  };
}

// Fixes that keep every directive of the diagram.
const repairs = [
  // Mermaid can't parse &lt;T&gt; — wrap generic types in backticks.
  block => {
    const count = (block.match(/&lt;|&gt;/g) || []).length;
    if (count === 0) return null;
    return {
      block: block.replace(/(\w+)&lt;([^&]+)&gt;/g, '`$1<$2>`'),
      change: `Fixed ${count}x HTML entities in generic types`,
    };
  },
  // <br/> → <br> (Vue compiler compatibility)
  block => {
    const count = (block.match(/<br\/>/g) || []).length;
    if (count === 0) return null;
    return {
      block: block.replace(/<br\/>/g, '<br>'),
      change: `Replaced ${count}x <br/> with <br>`,
    };
  },
  // subgraph "Some Name" → subgraph sg_N ["Some Name"]
  block => {
    let counter = 0;
    const fixed = block.replace(
      /subgraph\s+"([^"]+)"/g,
      (_, name) => `subgraph sg_${++counter} ["${name}"]`,
    );
    return counter > 0
      ? { block: fixed, change: `Fixed ${counter}x quoted subgraph names` }
      : null;
  },
  // sequenceDiagram: keep a single autonumber right after the header.
  block => {
    if (firstLine(block) !== 'sequenceDiagram') return null;
    const autonumber = /^\s*autonumber\s*$/gm;
    if ((block.match(autonumber) || []).length === 0) return null;
    const fixed = block
      .replace(autonumber, '')
      .replace(/^(sequenceDiagram)\n/, '$1\nautonumber\n');
    return fixed === block
      ? null
      : { block: fixed, change: 'Normalized autonumber in sequenceDiagram' };
  },
  // quadrantChart: remove parentheses from point labels.
  block => {
    if (firstLine(block) !== 'quadrantChart') return null;
    let count = 0;
    const fixed = block.replace(
      /^(\s+[\w\s]+)\(([^)]+)\)(:\s*\[[\d., ]+])$/gm,
      (_, label, inner, point) => {
        count++;
        return label + inner + point;
      },
    );
    return count > 0
      ? {
          block: fixed,
          change: `Removed ${count}x parentheses from quadrantChart labels`,
        }
      : null;
  },
];

// Fixes that delete styling; tried only when the repairs are not enough.
const removals = [
  block =>
    firstLine(block) === 'sequenceDiagram'
      ? removeLines(
          /^\s*style\s+\S+\s+fill:.*$/gm,
          'style directives from sequenceDiagram',
        )(block)
      : null,
  removeLines(/^\s*linkStyle\s+.*$/gm, 'linkStyle directives'),
  removeLines(
    /^\s*style\s+"[^"]+"\s+fill:.*$/gm,
    'style "quoted name" directives',
  ),
];

function applyFixes(block, fixes) {
  let fixed = block;
  const changes = [];
  for (const fix of fixes) {
    const result = fix(fixed);
    if (!result) continue;
    fixed = result.block;
    changes.push(result.change);
  }
  if (changes.length > 0) fixed = fixed.replace(/\n{3,}/g, '\n\n');
  return { fixed, changes };
}

/**
 * Validate a block and, when mmdc rejects it, look for a fix mmdc accepts.
 * Returns { block, changes, broken, error }: `block` differs from the input
 * only when the fixed version was validated.
 */
function processBlock(block) {
  const original = validateBlock(block);
  if (original.valid) return { block, changes: [], broken: false, error: null };
  let attempted = [];
  let error = original.error;
  for (const fixes of [repairs, [...repairs, ...removals]]) {
    const { fixed, changes } = applyFixes(block, fixes);
    if (changes.length === 0 || changes.length === attempted.length) continue;
    attempted = changes;
    const result = validateBlock(fixed);
    if (result.valid)
      return { block: fixed, changes, broken: false, error: null };
    error = result.error;
  }
  return { block, changes: attempted, broken: true, error };
}

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (
      stat.isDirectory() &&
      !entry.startsWith('.') &&
      entry !== 'node_modules'
    ) {
      files.push(...walkDir(fullPath));
    } else if (extname(entry) === '.md') {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const wikiDir = join(import.meta.dirname, '..');
  const files = walkDir(wikiDir);
  const preflight = validateBlock(PREFLIGHT);
  if (!preflight.valid)
    throw new ValidatorUnavailableError(
      `Mermaid CLI "${MMDC}" rejected a known-valid diagram, so its results cannot be trusted: ${preflight.error}`,
    );

  let totalBlocks = 0;
  let totalFixed = 0;
  let totalStillBroken = 0;
  const updates = new Map();

  console.log(
    `Scanning ${files.length} markdown files for Mermaid blocks...\n`,
  );

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const issues = [];
    let blockIndex = 0;
    const newContent = content.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (fullMatch, block) => {
        const index = blockIndex++;
        totalBlocks++;
        const result = processBlock(block);
        if (result.broken) {
          totalStillBroken++;
          issues.push({
            block: index,
            status:
              result.changes.length > 0
                ? 'BROKEN (fixes did not validate, not applied)'
                : 'BROKEN (no fix available)',
            changes: result.changes,
            error: result.error,
          });
          return fullMatch;
        }
        if (result.changes.length === 0) return fullMatch;
        totalFixed++;
        issues.push({
          block: index,
          status: 'FIXED and now valid',
          changes: result.changes,
        });
        return '```mermaid\n' + result.block + '```';
      },
    );
    if (newContent !== content) updates.set(file, newContent);

    if (issues.length > 0) {
      console.log(`${file.replace(wikiDir, '.')}:`);
      for (const issue of issues) {
        console.log(`  Block ${issue.block}: ${issue.status}`);
        for (const change of issue.changes) console.log(`    - ${change}`);
        if (issue.error) {
          const errLine = issue.error
            .split('\n')
            .filter(line => line.trim())
            .slice(0, 3)
            .join(' | ');
          console.log(`    Error: ${errLine.substring(0, 200)}`);
        }
      }
      console.log('');
    }
  }

  // Every block has been validated; only now touch the files.
  for (const [file, content] of updates) writeFileSync(file, content, 'utf-8');

  console.log(`\n--- Summary ---`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Mermaid blocks found: ${totalBlocks}`);
  console.log(`Blocks fixed: ${totalFixed}`);
  console.log(`Blocks still broken: ${totalStillBroken}`);
  console.log(`Files modified: ${updates.size}`);

  if (totalBlocks === 0) {
    console.log('No Mermaid blocks found.');
  } else if (totalStillBroken > 0) {
    console.log(
      `\n${totalStillBroken} block(s) still have syntax errors and were left unchanged.`,
    );
    return 1;
  } else if (totalFixed === 0) {
    console.log('All Mermaid blocks are valid!');
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof ValidatorUnavailableError)) throw error;
  console.error(`Mermaid validator unavailable: ${error.message}`);
  console.error('No Markdown file was modified.');
  process.exitCode = 2;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
