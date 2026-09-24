/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { violations } from './dependency-direction.mjs';

const script = fileURLToPath(
  new URL('./dependency-direction.mjs', import.meta.url),
);

function workspace(files) {
  const root = mkdtempSync(join(tmpdir(), 'dependency-direction-'));
  const all = {
    'pnpm-workspace.yaml':
      "packages:\n  - packages/*\n  - 'integration-test'\n\ncatalog:\n  react: ^19.3.0\n",
    'package.json': { name: 'workspace', private: true },
    'packages/fetcher/package.json': { name: '@ahoo-wang/fetcher' },
    'packages/fetcher/src/index.ts': "export * from './fetcher';\n",
    'integration-test/package.json': { name: 'it' },
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(
      join(root, path),
      typeof content === 'string' ? content : JSON.stringify(content),
    );
  }
  return root;
}

test('this repository depends on no Wow package', () => {
  assert.deepEqual(violations(process.cwd()), []);
  assert.doesNotThrow(() => execFileSync(process.execPath, [script]));
});

test('a Wow package is refused in every dependency field, override, catalog and source import', () => {
  const root = workspace({
    'package.json': {
      name: 'workspace',
      devDependencies: { '@ahoo-wang/wow-client': 'catalog:' },
      pnpm: { overrides: { '@ahoo-wang/wow-react@1': '1.0.0' } },
    },
    'pnpm-workspace.yaml':
      "packages:\n  - packages/*\n  - 'integration-test'\n\ncatalog:\n  '@ahoo-wang/wow-client': ^9.2.0\n",
    'packages/fetcher/package.json': {
      name: '@ahoo-wang/fetcher',
      peerDependencies: { '@ahoo-wang/wow-react': '^9' },
    },
    'packages/fetcher/src/query.ts':
      "import type { Condition } from '@ahoo-wang/wow-client';\nconst lazy = () => import('@ahoo-wang/wow-view-engine/react');\n",
    'integration-test/package.json': {
      name: 'it',
      dependencies: { '@ahoo-wang/wow-generator': '^9' },
      optionalDependencies: { '@ahoo-wang/wow-view-store': '^9' },
    },
  });
  try {
    assert.deepEqual(violations(root).sort(), [
      'integration-test/package.json dependencies: @ahoo-wang/wow-generator',
      'integration-test/package.json optionalDependencies: @ahoo-wang/wow-view-store',
      'package.json devDependencies: @ahoo-wang/wow-client',
      'package.json pnpm.overrides: @ahoo-wang/wow-react@1',
      'packages/fetcher/package.json peerDependencies: @ahoo-wang/wow-react',
      'packages/fetcher/src/query.ts imports @ahoo-wang/wow-client',
      'packages/fetcher/src/query.ts imports @ahoo-wang/wow-view-engine/react',
      'pnpm-workspace.yaml catalog: @ahoo-wang/wow-client',
    ]);
    assert.throws(
      () => execFileSync(process.execPath, [script, root], { stdio: 'pipe' }),
      /Wow → fetcher/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fetcher packages and look-alike names are allowed', () => {
  const root = workspace({
    'packages/react/package.json': {
      name: '@ahoo-wang/fetcher-react',
      peerDependencies: { '@ahoo-wang/fetcher': 'workspace:^' },
      devDependencies: { 'wow-client': '1.0.0', '@other/wow-client': '1' },
    },
    'packages/react/src/index.ts':
      "import { Fetcher } from '@ahoo-wang/fetcher';\n// '@ahoo-wang/wow-react' builds on this entry.\n",
  });
  try {
    assert.deepEqual(violations(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
