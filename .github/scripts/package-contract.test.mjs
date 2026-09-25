/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  importedPackages,
  packageName,
  problems,
  readPackages,
  viteLibrary,
} from './package-contract.mjs';

test('package names drop subpaths', () => {
  assert.equal(packageName('react/jsx-runtime'), 'react');
  assert.equal(
    packageName('@ahoo-wang/fetcher-react/core'),
    '@ahoo-wang/fetcher-react',
  );
});

test('imports ignore comments, relative paths and builtins', () => {
  const source = `
    import { a } from 'dequal';
    import type { B } from '@ahoo-wang/fetcher';
    import './local.js';
    import 'side-effect';
    const lazy = await import('lazy-pkg/sub');
    import { readFileSync } from 'node:fs';
    import path from 'path';
    /** import { x } from 'in-jsdoc'; */
    // import { y } from 'in-line-comment';
    const url = 'https://example.com'; // import 'after-code'
  `;
  assert.deepEqual([...importedPackages(source)].sort(), [
    '@ahoo-wang/fetcher',
    'dequal',
    'lazy-pkg',
    'side-effect',
  ]);
});

test('vite configs yield the UMD name, externals and globals', () => {
  const config = `
    lib: { name: 'FetcherX' },
    rolldownOptions: {
      external: ['@ahoo-wang/fetcher', 'immer'],
      output: { globals: { '@ahoo-wang/fetcher': 'Fetcher', immer: 'Immer' } },
    },`;
  assert.deepEqual(viteLibrary(config), {
    name: 'FetcherX',
    external: new Set(['@ahoo-wang/fetcher', 'immer']),
    globals: { '@ahoo-wang/fetcher': 'Fetcher', immer: 'Immer' },
  });
});

const pkg = (name, overrides = {}) => ({
  directory: `packages/${name}`,
  manifest: { name: `@ahoo-wang/${name}` },
  imports: new Set(),
  vite: { name: name, external: new Set(), globals: {} },
  ...overrides,
});

test('reports undeclared imports, unused peers, pinned siblings, bundled deps', () => {
  const found = problems([
    pkg('a', {
      manifest: {
        name: '@ahoo-wang/a',
        dependencies: { dequal: '^2' },
        peerDependencies: { '@ahoo-wang/b': 'workspace:^5.0.0', unused: '^1' },
      },
      imports: new Set(['dequal', '@ahoo-wang/b', 'missing']),
      vite: {
        name: 'A',
        external: new Set(['@ahoo-wang/b', 'unused']),
        globals: {},
      },
    }),
  ]);
  assert.deepEqual(found, [
    'packages/a: imports missing, which it does not declare',
    'packages/a: declares unused, which its source never imports',
    'packages/a: peer @ahoo-wang/b is workspace:^5.0.0; use workspace:^ so it follows the release',
    'packages/a: dequal is not external in vite.config.ts, so it is bundled',
  ]);
});

test('reports duplicate UMD names and globals that do not match', () => {
  const found = problems([
    pkg('fetcher', {
      vite: { name: 'Fetcher', external: new Set(), globals: {} },
    }),
    pkg('storage', {
      vite: { name: 'Fetcher', external: new Set(), globals: {} },
    }),
    pkg('cosec', {
      vite: {
        name: 'FetcherCoSec',
        external: new Set(),
        globals: { '@ahoo-wang/storage': 'FetcherStorage' },
      },
    }),
  ]);
  assert.deepEqual(found, [
    "packages/storage: UMD global Fetcher is also packages/fetcher's",
    'packages/cosec: reads @ahoo-wang/storage as the global FetcherStorage, but its build writes Fetcher',
  ]);
});

test('the packages in this repository keep the contract', () => {
  assert.deepEqual(problems(readPackages(process.cwd())), []);
});
