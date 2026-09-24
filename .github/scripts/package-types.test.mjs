/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  IGNORED,
  classify,
  describe,
  publishedPackages,
} from './package-types.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));

// Problems as attw 0.18 reports them for the 5.1.3 packages.
const falseEsm = {
  kind: 'FalseESM',
  typesFileName: '/node_modules/@ahoo-wang/fetcher/dist/index.d.ts',
  implementationFileName: '/node_modules/@ahoo-wang/fetcher/dist/index.umd.cjs',
};
const cjsToEsm = {
  kind: 'CJSResolvesToESM',
  entrypoint: '.',
  resolutionKind: 'node16-cjs',
};
const internal = {
  kind: 'InternalResolutionError',
  resolutionOption: 'node16',
  fileName: '/node_modules/@ahoo-wang/fetcher-openapi/dist/index.d.ts',
  moduleSpecifier: './info',
};
const subpath = entrypoint => ({
  kind: 'NoResolution',
  entrypoint,
  resolutionKind: 'node16-cjs',
});

test('every problem fails unless a rule accepts it', () => {
  const { unexpected, accepted } = classify({
    packageName: '@ahoo-wang/fetcher',
    problems: [falseEsm, cjsToEsm, internal],
  });
  assert.deepEqual(unexpected, [falseEsm, cjsToEsm, internal]);
  assert.deepEqual(accepted, []);
});

test('only the ES-module-only react subpaths may fail to resolve from CommonJS', () => {
  const react = classify({
    packageName: '@ahoo-wang/fetcher-react',
    problems: [subpath('./core'), subpath('./fetcher'), subpath('.')],
  });
  assert.deepEqual(react.accepted, [subpath('./core'), subpath('./fetcher')]);
  assert.deepEqual(react.unexpected, [subpath('.')]);
  // Nor anywhere else, and never for ES module or bundler resolution.
  assert.deepEqual(
    classify({
      packageName: '@ahoo-wang/fetcher',
      problems: [subpath('./core')],
    }).accepted,
    [],
  );
  assert.deepEqual(
    classify({
      packageName: '@ahoo-wang/fetcher-react',
      problems: [{ ...subpath('./core'), resolutionKind: 'bundler' }],
    }).accepted,
    [],
  );
});

test('every ignore rule gives its reason', () => {
  for (const rule of IGNORED) assert.ok(rule.reason?.length > 20, rule.kind);
});

test('problems are described by file and specifier', () => {
  assert.equal(
    describe(internal),
    "InternalResolutionError node16 dist/index.d.ts imports './info'",
  );
  assert.equal(describe(cjsToEsm), 'CJSResolvesToESM . node16-cjs');
  assert.equal(describe(falseEsm), 'FalseESM dist/index.d.ts');
});

test('private packages are not checked', () => {
  const root = mkdtempSync(join(tmpdir(), 'package-types-'));
  for (const [name, manifest] of [
    ['public', { name: 'public' }],
    ['private', { name: 'private', private: true }],
  ]) {
    mkdirSync(join(root, 'packages', name), { recursive: true });
    writeFileSync(
      join(root, 'packages', name, 'package.json'),
      JSON.stringify(manifest),
    );
  }
  mkdirSync(join(root, 'packages', 'empty'));
  assert.deepEqual(publishedPackages(root), [join(root, 'packages', 'public')]);
});

test('this repository checks its published packages', () => {
  const checked = publishedPackages(repository);
  for (const name of ['fetcher', 'react'])
    assert.ok(checked.includes(join(repository, 'packages', name)), name);
});
