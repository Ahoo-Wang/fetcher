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
  legacyUmdProblems,
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

test('the wow locale subpaths may fail to resolve only under node10', () => {
  const locale = resolutionKind => ({
    kind: 'NoResolution',
    entrypoint: './query/locale/zh_CN',
    resolutionKind,
  });
  const { accepted, unexpected } = classify({
    packageName: '@ahoo-wang/fetcher-wow',
    problems: [locale('node10'), locale('node16-cjs')],
  });
  assert.deepEqual(accepted, [locale('node10')]);
  assert.deepEqual(unexpected, [locale('node16-cjs')]);
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

test('private and unpublished packages are not checked', () => {
  const root = mkdtempSync(join(tmpdir(), 'package-types-'));
  for (const [name, manifest] of [
    ['public', { name: 'public' }],
    ['private', { name: 'private', private: true }],
    ['view-engine', { name: '@ahoo-wang/fetcher-view-engine' }],
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
  for (const name of ['fetcher', 'react', 'wow', 'generator', 'viewer'])
    assert.ok(checked.includes(join(repository, 'packages', name)), name);
});

test('5.x packs the old dist/index.umd.js as a copy nothing resolves to', () => {
  const bundle = Buffer.from('(function(){})();');
  const manifest = {
    name: '@ahoo-wang/fetcher-cosec',
    main: './dist/index.umd.cjs',
    exports: {
      '.': {
        require: {
          types: './dist/index.d.cts',
          default: './dist/index.umd.cjs',
        },
      },
    },
  };
  const packed = files => path => files[path];
  const both = {
    'dist/index.umd.cjs': bundle,
    'dist/index.umd.js': Buffer.from(bundle),
  };
  assert.deepEqual(legacyUmdProblems(manifest, packed(both)), []);
  assert.deepEqual(
    legacyUmdProblems(manifest, packed({ 'dist/index.umd.cjs': bundle })),
    ['dist/index.umd.js is not packed'],
  );
  assert.deepEqual(
    legacyUmdProblems(
      manifest,
      packed({ ...both, 'dist/index.umd.js': Buffer.from('other') }),
    ),
    ['dist/index.umd.js differs from dist/index.umd.cjs'],
  );
  assert.deepEqual(
    legacyUmdProblems(
      { ...manifest, main: './dist/index.umd.js' },
      packed(both),
    ),
    ['main or exports reference dist/index.umd.js'],
  );
  // Packages that never had the old path are not checked.
  assert.deepEqual(
    legacyUmdProblems({ name: '@ahoo-wang/fetcher' }, packed({})),
    [],
  );
});
