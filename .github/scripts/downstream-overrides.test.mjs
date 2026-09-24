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

test('overrides are appended to the Wow workspace, never merged over its own', () => {
  const yaml = 'packages:\n  - typescript/*\n\ncatalog:\n  react: ^19.3.0\n';
  assert.equal(
    withOverrides(yaml, { '@ahoo-wang/fetcher': 'file:/tmp/a.tgz' }),
    "packages:\n  - typescript/*\n\ncatalog:\n  react: ^19.3.0\n\noverrides:\n  '@ahoo-wang/fetcher': 'file:/tmp/a.tgz'\n",
  );
  assert.throws(
    () => withOverrides(`${yaml}overrides:\n  a: 1\n`, {}),
    /already declares overrides/,
  );
});
