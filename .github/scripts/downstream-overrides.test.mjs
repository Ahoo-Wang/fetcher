/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  overrideTarget,
  overrides,
  tarballName,
  withOverrides,
} from './downstream-overrides.mjs';

test('every public package maps to the tarball pnpm pack writes for it', () => {
  const root = mkdtempSync(join(tmpdir(), 'downstream-overrides-'));
  try {
    const manifests = {
      fetcher: { name: '@ahoo-wang/fetcher', version: '6.0.0' },
      react: { name: '@ahoo-wang/fetcher-react', version: '6.0.0' },
      internal: { name: 'internal', version: '1.0.0', private: true },
    };
    mkdirSync(join(root, 'packs'));
    for (const [directory, pkg] of Object.entries(manifests)) {
      mkdirSync(join(root, 'packages', directory), { recursive: true });
      writeFileSync(
        join(root, 'packages', directory, 'package.json'),
        JSON.stringify(pkg),
      );
    }
    assert.equal(
      tarballName(manifests.react),
      'ahoo-wang-fetcher-react-6.0.0.tgz',
    );
    assert.throws(
      () => overrides(join(root, 'packages'), join(root, 'packs')),
      /Not packed/,
    );
    for (const pkg of [manifests.fetcher, manifests.react])
      writeFileSync(join(root, 'packs', tarballName(pkg)), '');
    assert.deepEqual(overrides(join(root, 'packages'), join(root, 'packs')), {
      '@ahoo-wang/fetcher': `file:${join(root, 'packs', 'ahoo-wang-fetcher-6.0.0.tgz')}`,
      '@ahoo-wang/fetcher-react': `file:${join(root, 'packs', 'ahoo-wang-fetcher-react-6.0.0.tgz')}`,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('overrides are appended when the Wow workspace declares none', () => {
  const yaml = 'packages:\n  - typescript/*\n\ncatalog:\n  react: ^19.3.0\n';
  assert.equal(
    withOverrides(yaml, { '@ahoo-wang/fetcher': 'file:/tmp/a.tgz' }),
    "packages:\n  - typescript/*\n\ncatalog:\n  react: ^19.3.0\n\noverrides:\n  '@ahoo-wang/fetcher': 'file:/tmp/a.tgz'\n",
  );
});

test("overrides are merged into Wow's own, keeping its entries and comments", () => {
  const yaml = [
    'packages:',
    '  - typescript/*',
    '',
    '# Security overrides.',
    'overrides:',
    '    # vitepress pins vite 5.',
    "    'vitepress>vite': ^6.4.6",
    '',
    "    'dompurify@<3.4.17': ^3.4.17",
    '',
    '# Next section.',
    'catalog:',
    '  react: ^19.3.0',
    '',
  ].join('\n');
  assert.equal(
    withOverrides(yaml, {
      '@ahoo-wang/fetcher': 'file:/tmp/a.tgz',
      '@ahoo-wang/fetcher-react': 'file:/tmp/b.tgz',
    }),
    [
      'packages:',
      '  - typescript/*',
      '',
      '# Security overrides.',
      'overrides:',
      '    # Packed builds of this fetcher commit (downstream-wow.yml).',
      "    '@ahoo-wang/fetcher': 'file:/tmp/a.tgz'",
      "    '@ahoo-wang/fetcher-react': 'file:/tmp/b.tgz'",
      '    # vitepress pins vite 5.',
      "    'vitepress>vite': ^6.4.6",
      '',
      "    'dompurify@<3.4.17': ^3.4.17",
      '',
      '# Next section.',
      'catalog:',
      '  react: ^19.3.0',
      '',
    ].join('\n'),
  );
});

test('a Wow override of a packed package fails instead of being replaced', () => {
  const entries = { '@ahoo-wang/fetcher': 'file:/tmp/a.tgz' };
  for (const key of [
    "'@ahoo-wang/fetcher'",
    '"@ahoo-wang/fetcher@<6"',
    "'wow-client>@ahoo-wang/fetcher'",
  ])
    assert.throws(
      () => withOverrides(`overrides:\n  ${key}: ^6.0.0\n`, entries),
      /Wow already overrides @ahoo-wang\/fetcher /,
      key,
    );
  // A package whose name merely starts with a packed one is not a conflict.
  assert.doesNotThrow(() =>
    withOverrides("overrides:\n  '@ahoo-wang/fetcher-wow': 1.0.0\n", entries),
  );
  assert.throws(
    () => withOverrides('overrides: { a: 1 }\n', entries),
    /flow style/,
  );
});

test('override keys resolve to the package they target', () => {
  assert.equal(overrideTarget('react'), 'react');
  assert.equal(overrideTarget('zod@>=4.0.0 <4.6.6'), 'zod');
  assert.equal(overrideTarget('@scope/a@^1'), '@scope/a');
  assert.equal(overrideTarget('vitepress>vite'), 'vite');
  assert.equal(overrideTarget('a@1>@scope/b@<2'), '@scope/b');
});

test('a > inside a version range is not a parent separator', () => {
  assert.equal(overrideTarget('body-parser@>=2.0.0 <2.4.0'), 'body-parser');
  assert.equal(overrideTarget('a@>2>b'), 'b');
  assert.equal(overrideTarget('a@>2'), 'a');
});
