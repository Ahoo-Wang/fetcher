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
import { createRequire } from 'node:module';
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
// Export targets nest by condition: { import: { types, default } }.
function targets(entry) {
  return typeof entry === 'string'
    ? [entry]
    : Object.values(entry).flatMap(targets);
}
for (const path of targets(manifest.exports)) {
  assert.ok(statSync(new URL(path, packageRoot)).size > 0, path);
}
for (const specifier of ['', '/core', '/fetcher']) {
  assert.equal(
    import.meta.resolve(manifest.name + specifier),
    new URL(manifest.exports['.' + specifier].import.default, packageRoot).href,
  );
}
// CommonJS consumers get the UMD bundle and its CommonJS declarations.
const require = createRequire(import.meta.url);
assert.equal(
  require.resolve(manifest.name),
  fileURLToPath(new URL(manifest.exports['.'].require.default, packageRoot)),
);
assert.match(manifest.exports['.'].require.types, /\.d\.cts$/);
assert.equal(typeof require(manifest.name).useFullscreenContext, 'function');

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
      // React itself, or dequal: a declared dependency, no integration.
      assert.match(
        fileName,
        /^(?:react(?:\/|$)|dequal$)/,
        `Core imports an integration dependency from ${fileURLToPath(file)}`,
      );
      usesCompiler ||= fileName === 'react/compiler-runtime';
    }
  }
}
assert.ok(usesCompiler, 'Core hooks must retain React Compiler output');
// The fetcher hooks are what @ahoo-wang/wow-react (Wow repository) builds
// on; reaching them must not load any other integration.
const fetcherModules = new Set([
  import.meta.resolve(manifest.name + '/fetcher'),
]);
for (const file of fetcherModules) {
  const code = readFileSync(new URL(file), 'utf8');
  for (const { fileName } of ts.preProcessFile(code, true, true)
    .importedFiles) {
    if (fileName.startsWith('.')) {
      const target = new URL(fileName, file);
      assert.ok(target.href.startsWith(new URL('dist/', packageRoot).href));
      fetcherModules.add(target.href);
    } else {
      assert.doesNotMatch(
        fileName,
        /^@ahoo-wang\/fetcher-(cosec|storage|eventbus)(?:\/|$)/,
        `The fetcher entry loads an integration from ${fileURLToPath(file)}`,
      );
    }
  }
}
// Resolve declarations as a consumer does, without source aliases.
// Declarations must resolve, and not degrade to `any`, under bundler and
// node16 from ES modules and from CommonJS (`require` gets `.d.cts`).
const typeProbe = mkdtempSync(new URL('.package-types-', packageRoot));
try {
  const consumer = `import { ${Object.keys(core).join(', ')} } from '${manifest.name}';\nimport type { UseFullscreenOptions, UseDebouncedCallbackOptions } from '${manifest.name}';\nimport { useFetcher } from '${manifest.name}';\ndeclare const query: ReturnType<typeof useFetcher>;\nquery.result; query.loading; query.error;\n// @ts-expect-error a hook is not a number unless its types degraded to any\nexport const probe: number = useFetcher;\n`;
  const subpaths = `import { FullscreenProvider } from '${manifest.name}/core';\nimport { useFetcher } from '${manifest.name}/fetcher';\n// @ts-expect-error a component is not a number unless its types degraded to any\nexport const provider: number = FullscreenProvider;\n// @ts-expect-error a hook is not a number unless its types degraded to any\nexport const hook: number = useFetcher;\n`;
  const probes = [
    [ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler, 'consumer.ts'],
    [ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16, 'consumer.mts'],
    [ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16, 'consumer.cts'],
  ];
  for (const [module, moduleResolution, name] of probes) {
    const files = [`${typeProbe}/${name}`];
    writeFileSync(files[0], consumer);
    if (!name.endsWith('.cts')) {
      files.push(`${typeProbe}/subpaths.${name.split('.')[1]}`);
      writeFileSync(files[1], subpaths);
    }
    const program = ts.createProgram(files, {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2020,
      module,
      moduleResolution,
      jsx: ts.JsxEmit.ReactJSX,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(
      diagnostics.length,
      0,
      `${name}:\n` +
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: file => file,
          getCurrentDirectory: () => process.cwd(),
          getNewLine: () => '\n',
        }),
    );
  }
} finally {
  rmSync(typeProbe, { recursive: true, force: true });
}
console.log(
  `Public ESM contexts share state; ${coreModules.size} core runtime modules and all export targets verified.`,
);
// Root integrations keep BroadcastChannels open; this one-shot probe owns its process.
process.exit(0);
