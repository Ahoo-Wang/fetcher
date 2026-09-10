/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { basename, relative } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const ts = createRequire(
  new URL('../../packages/view-engine/package.json', import.meta.url),
)('typescript');
const entries = ['index', 'react'].map(
  name => `${root}packages/view-engine/src/${name}.ts`,
);
const program = ts.createProgram(entries, {
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ESNext,
  jsx: ts.JsxEmit.Preserve,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const sections = entries.map((entry, index) => {
  const module = checker.getSymbolAtLocation(program.getSourceFile(entry));
  const symbols = checker
    .getExportsOfModule(module)
    .map(exported => {
      const symbol =
        exported.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exported)
          : exported;
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
      assert.ok(declaration, `Missing declaration: ${exported.name}`);
      const source = declaration.getSourceFile();
      const path = relative(root, source.fileName).replaceAll('\\', '/');
      assert.ok(
        path.startsWith('packages/view-engine/src/'),
        `Unexpected declaration: ${path}`,
      );
      const line =
        source.getLineAndCharacterOfPosition(declaration.getStart(source))
          .line + 1;
      return `| \`${exported.name}\` | [${basename(path)}:${line}](https://github.com/Ahoo-Wang/fetcher/blob/main/${path}#L${line}) |`;
    })
    .sort((a, b) => a.localeCompare(b, 'en'));
  return `## \`@ahoo-wang/fetcher-view-engine${index ? '/react' : ''}\`\n\n| Symbol | Declaration |\n| --- | --- |\n${symbols.join('\n')}\n`;
});
const rows = text =>
  text
    .split('\n')
    .filter(line => /^\|\s*`/.test(line))
    .map(line => line.replace(/\s+/g, ' ').trim());
for (const locale of ['', 'zh/']) {
  const path = `${root}wiki/${locale}reference/view-engine/symbols.md`;
  const current = readFileSync(path, 'utf8');
  const content =
    current.slice(0, current.indexOf('## `')) +
    sections
      .join('\n')
      .replaceAll(
        '| Symbol | Declaration |',
        locale ? '| 符号 | 声明 |' : '| Symbol | Declaration |',
      );
  if (process.argv.includes('--write')) writeFileSync(path, content);
  else
    assert.deepEqual(
      rows(current),
      rows(content),
      `Public symbol index is stale: ${path}`,
    );
}
console.log(
  'Verified both View Engine public symbol indexes against source exports.',
);
