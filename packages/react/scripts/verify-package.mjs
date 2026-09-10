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

// Run after building: pnpm --filter @ahoo-wang/fetcher-react test:package
import assert from 'node:assert/strict';
import {
  readFileSync,
  statSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as root from '@ahoo-wang/fetcher-react';
import * as core from '@ahoo-wang/fetcher-react/core';

const packageRoot = new URL('../', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('package.json', packageRoot), 'utf8'),
);
for (const entry of Object.values(manifest.exports)) {
  for (const path of Object.values(entry)) {
    assert.ok(statSync(new URL(path, packageRoot)).size > 0, path);
  }
}
for (const specifier of ['', '/core']) {
  assert.equal(
    import.meta.resolve(manifest.name + specifier),
    new URL(manifest.exports['.' + specifier].import, packageRoot).href,
  );
}

for (const [provider, consumer] of [
  [root, core],
  [core, root],
]) {
  let fullscreen;
  function Consumer() {
    fullscreen = consumer.useFullscreenContext();
    return null;
  }
  renderToStaticMarkup(
    createElement(provider.FullscreenProvider, null, createElement(Consumer)),
  );
  assert.ok(fullscreen, 'Fullscreen context must cross public ESM entrypoints');
  assert.equal(typeof fullscreen.toggle, 'function');
}
assert.equal(root.FullscreenContext, core.FullscreenContext);

const coreModules = new Set([import.meta.resolve(manifest.name + '/core')]);
let usesCompiler = false;
for (const file of coreModules) {
  const code = readFileSync(new URL(file), 'utf8');
  for (const { fileName } of ts.preProcessFile(code, true, true)
    .importedFiles) {
    if (fileName.startsWith('.')) {
      const target = new URL(fileName, file);
      assert.ok(target.href.startsWith(new URL('dist/', packageRoot).href));
      coreModules.add(target.href);
    } else {
      assert.match(
        fileName,
        /^react(?:\/|$)/,
        `Core imports an integration dependency from ${fileURLToPath(file)}`,
      );
      usesCompiler ||= fileName === 'react/compiler-runtime';
    }
  }
}
assert.ok(usesCompiler, 'Core hooks must retain React Compiler output');
// Resolve declarations as a consumer does, without source aliases.
const typeProbe = mkdtempSync(new URL('.package-types-', packageRoot));
try {
  const file = `${typeProbe}/consumer.ts`;
  writeFileSync(
    file,
    `import { ${Object.keys(core).join(', ')} } from '${manifest.name}';\nimport type { UseFullscreenOptions, UseDebouncedCallbackOptions } from '${manifest.name}';\nimport { useSingleQuery } from '${manifest.name}';\ndeclare const query: ReturnType<typeof useSingleQuery>;\nquery.result; query.loading; query.error;`,
  );
  const program = ts.createProgram([file], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }),
  );
} finally {
  rmSync(typeProbe, { recursive: true, force: true });
}
console.log(
  `Public ESM contexts share state; ${coreModules.size} core runtime modules and all export targets verified.`,
);
// Root integrations keep BroadcastChannels open; this one-shot probe owns its process.
process.exit(0);
