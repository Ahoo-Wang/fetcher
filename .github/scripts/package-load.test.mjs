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
  const cosec = '^20.19.0 || >=22.12.0';
  assert.equal(satisfies('v18.20.8', cosec), false);
  assert.equal(satisfies('v20.18.3', cosec), false);
  assert.equal(satisfies('v20.19.0', cosec), true);
  assert.equal(satisfies('v21.7.3', cosec), false);
  assert.equal(satisfies('v22.11.0', cosec), false);
  assert.equal(satisfies('v22.12.0', cosec), true);
  assert.equal(satisfies('v26.0.0', cosec), true);
  assert.equal(satisfies('v18.0.0', undefined), true);
  assert.throws(() => satisfies('v20.0.0', '~20.1.0'), /Unsupported/);
});

test('every published engines range is one satisfies understands', () => {
  for (const name of [
    'cosec',
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

test('the CoSec CommonJS entry is not claimed where require(esm) is missing', () => {
  const manifest = JSON.parse(
    readFileSync(`${repository}packages/cosec/package.json`, 'utf8'),
  );
  // nanoid is ES modules only: require() needs Node 20.19+ or 22.12+.
  assert.equal(satisfies('v18.20.8', manifest.engines.node), false);
  assert.equal(satisfies('v22.11.0', manifest.engines.node), false);
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
