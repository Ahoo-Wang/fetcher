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
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// A stand-in for mmdc: rejects diagrams containing `<br/>` or BROKEN as
// syntax errors, or fails the way a missing browser or a hang does.
const STUB = `#!/bin/sh
while [ $# -gt 0 ]; do
  case "$1" in
    -i) input="$2"; shift ;;
    -o) output="$2"; shift ;;
  esac
  shift
done
case "$STUB_MODE" in
  browser) echo 'Error: Failed to launch the browser process!' >&2; exit 1 ;;
  reject) echo 'Error: Lexical error on line 1' >&2; exit 1 ;;
  hang) exec sleep 10 ;;
esac
if grep -q -e '<br/>' -e 'BROKEN' "$input"; then
  echo 'Error: Parse error on line 2' >&2
  exit 1
fi
: > "$output"
`;

const styled = [
  '```mermaid',
  'flowchart LR',
  '  A[Input] --> B[Output]',
  '  linkStyle 0 stroke:#6d5dfc,stroke-width:2px',
  '```',
  '',
].join('\n');

function run(context, markdown, { env = {}, stub = true } = {}) {
  const wiki = mkdtempSync(join(tmpdir(), 'fetcher-mermaid-'));
  context.after(() => rmSync(wiki, { recursive: true, force: true }));
  mkdirSync(join(wiki, 'scripts'));
  mkdirSync(join(wiki, 'bin'));
  copyFileSync(
    new URL('../scripts/fix-mermaid.mjs', import.meta.url),
    join(wiki, 'scripts/fix-mermaid.mjs'),
  );
  if (stub) writeFileSync(join(wiki, 'bin/mmdc'), STUB, { mode: 0o755 });
  const page = join(wiki, 'page.md');
  writeFileSync(page, markdown);
  const result = spawnSync(
    process.execPath,
    [join(wiki, 'scripts/fix-mermaid.mjs')],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        MMDC: '',
        PATH: `${join(wiki, 'bin')}:/usr/bin:/bin`,
        ...env,
      },
    },
  );
  return { ...result, after: readFileSync(page, 'utf8') };
}

test('a valid diagram keeps its styles', context => {
  const result = run(context, styled);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.after, styled);
  assert.match(result.stdout, /All Mermaid blocks are valid!/);
});

for (const [name, options, message] of [
  ['mmdc is missing', { stub: false }, /was not found/],
  ['the browser cannot start', { env: { STUB_MODE: 'browser' } }, /browser/],
  [
    'mmdc rejects a known-valid diagram',
    { env: { STUB_MODE: 'reject' } },
    /known-valid/,
  ],
  [
    'mmdc times out',
    { env: { STUB_MODE: 'hang', MMDC_TIMEOUT_MS: '300' } },
    /did not finish within 300 ms/,
  ],
]) {
  test(`an unavailable validator leaves files unchanged when ${name}`, context => {
    const result = run(context, styled, options);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.equal(result.after, styled);
    assert.match(result.stderr, /Mermaid validator unavailable/);
    assert.match(result.stderr, message);
  });
}

test('a fix is written only after it validates, and keeps styles it does not need to remove', context => {
  const result = run(context, styled.replace('B[Output]', 'B[Out<br/>put]'));
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.after, styled.replace('B[Output]', 'B[Out<br>put]'));
  assert.match(result.stdout, /Replaced 1x <br\/> with <br>/);
});

test('a fix that still fails validation is not written', context => {
  const broken = styled.replace('B[Output]', 'B[Out<br/>put] BROKEN');
  const result = run(context, broken);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(result.after, broken);
  assert.match(result.stdout, /fixes did not validate, not applied/);
  assert.match(result.stdout, /Files modified: 0/);
});
