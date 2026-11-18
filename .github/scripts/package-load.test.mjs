/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadArguments, loadChecks, satisfies } from './package-load.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));

test('satisfies the engines ranges the manifests use', () => {
  assert.equal(satisfies('v18.20.8', '>=18.20.8'), true);
  assert.equal(satisfies('v18.20.7', '>=18.20.8'), false);
  assert.equal(satisfies('v24.11.0', '>=18.20.8'), true);
  const union = '^22.12.0 || ^24.0.0 || >=26.0.0';
  assert.equal(satisfies('v18.20.8', union), false);
  assert.equal(satisfies('v20.19.0', union), false);
  assert.equal(satisfies('v22.11.0', union), false);
  assert.equal(satisfies('v22.12.0', union), true);
  assert.equal(satisfies('v23.11.0', union), false);
  assert.equal(satisfies('v24.0.0', union), true);
  assert.equal(satisfies('v25.9.0', union), false);
  assert.equal(satisfies('v26.0.0', union), true);
  assert.equal(satisfies('v18.0.0', undefined), true);
  assert.throws(() => satisfies('v20.0.0', '~20.1.0'), /Unsupported/);
});

test('every published engines range is one satisfies understands', () => {
  for (const name of [
    'decorator',
    'eventbus',
    'eventstream',
    'fetcher',
    'openai',
    'openapi',
    'react',
    'storage',
  ]) {
    const manifest = JSON.parse(
      readFileSync(`${repository}packages/${name}/package.json`, 'utf8'),
    );
    assert.doesNotThrow(() => satisfies('v22.12.0', manifest.engines?.node));
  }
});

test('loads each entry the way its conditions allow', () => {
  assert.deepEqual(
    loadChecks({
      name: '@scope/pkg',
      exports: {
        '.': { import: './a.js', require: './a.cjs' },
        './esm': { import: './b.js' },
        './package.json': './package.json',
      },
    }),
    [
      { specifier: '@scope/pkg', mode: 'require' },
      { specifier: '@scope/pkg', mode: 'import' },
      { specifier: '@scope/pkg/esm', mode: 'import' },
    ],
  );
  assert.deepEqual(
    loadArguments({ specifier: '@scope/pkg', mode: 'require' }),
    ['-e', 'require("@scope/pkg")'],
  );
  assert.deepEqual(loadArguments({ specifier: '@scope/pkg', mode: 'import' }), [
    '--input-type=module',
    '-e',
    'await import("@scope/pkg")',
  ]);
});
