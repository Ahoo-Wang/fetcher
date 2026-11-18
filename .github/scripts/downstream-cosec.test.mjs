/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  catalogs,
  failedPackages,
  packedVersions,
  peerRows,
  report,
  satisfies,
  summary,
} from './downstream-cosec.mjs';

// The shape of CoSec's typescript/pnpm-workspace.yaml.
const WORKSPACE = `# The workspace.
packages:
  - 'cosec-*'

allowBuilds:
  esbuild: true

minimumReleaseAge: 1440

catalogs:
  peers:
    # core's readProblemDetails is in 6.1.0.
    '@ahoo-wang/fetcher': ^6.1.0
    '@ahoo-wang/fetcher-storage': '^6.1.0 || ^7.0.0'
    react: ^19.0.0

catalog:
  '@ahoo-wang/fetcher': ^6.1.0
  nanoid: ^6.0.2 # inline comment
`;

function withTree(files, run) {
  const root = mkdtempSync(join(tmpdir(), 'downstream-cosec-'));
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(
        join(root, path),
        typeof content === 'string' ? content : JSON.stringify(content),
      );
    }
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('catalogs reads the default and the named catalogs', () => {
  assert.deepEqual(catalogs(WORKSPACE), {
    peers: {
      '@ahoo-wang/fetcher': '^6.1.0',
      '@ahoo-wang/fetcher-storage': '^6.1.0 || ^7.0.0',
      react: '^19.0.0',
    },
    default: { '@ahoo-wang/fetcher': '^6.1.0', nanoid: '^6.0.2' },
  });
});

test('catalogs refuses a flow-style catalog instead of misreading it', () => {
  assert.throws(
    () => catalogs("catalog: { react: '^19.0.0' }\n"),
    /not in block style/,
  );
});

test('satisfies reads caret, tilde, comparators and alternatives', () => {
  const cases = [
    ['6.1.0', '^6.1.0', true],
    ['6.9.3', '^6.1.0', true],
    ['6.0.9', '^6.1.0', false],
    ['7.0.0', '^6.1.0', false],
    ['7.0.0', '^6.1.0 || ^7.0.0', true],
    ['0.2.5', '^0.2.3', true],
    ['0.3.0', '^0.2.3', false],
    ['0.0.4', '^0.0.3', false],
    ['6.1.9', '~6.1.0', true],
    ['6.2.0', '~6.1.0', false],
    ['6.5.0', '^6', true],
    ['7.0.0', '>=6.1.0 <8', true],
    ['8.0.0', '>=6.1.0 <8', false],
    ['8.0.0', '>= 6.1.0', true],
    ['6.1.0', '6.1.0', true],
    ['6.1.4', '6.1', true],
    ['6.2.0', '6.1', false],
  ];
  for (const [version, range, expected] of cases)
    assert.equal(satisfies(version, range), expected, `${version} ${range}`);
});

test('a prerelease satisfies a range only through a prerelease of its own version', () => {
  assert.equal(satisfies('7.0.0-beta.1', '^6.1.0'), false);
  assert.equal(satisfies('7.0.0-beta.1', '^7.0.0'), false);
  assert.equal(satisfies('6.2.0-beta.1', '^6.1.0'), false);
  assert.equal(satisfies('7.0.0-beta.2', '^7.0.0-beta.1'), true);
  assert.equal(satisfies('7.0.0-alpha.1', '^7.0.0-beta.1'), false);
  assert.equal(satisfies('7.0.0-beta.2', '^6.1.0 || ^7.0.0-beta.1'), true);
});

test('satisfies leaves the forms it does not read undecided', () => {
  for (const range of ['*', '6.x', '1.0.0 - 2.0.0', '>6', 'latest', ''])
    assert.equal(satisfies('6.1.0', range), undefined, range);
});

test('peer rows resolve catalog references and skip unpacked peers', () => {
  withTree(
    {
      'pnpm-workspace.yaml': WORKSPACE,
      'cosec-fetcher/package.json': {
        name: '@ahoo-wang/cosec-fetcher',
        peerDependencies: {
          '@ahoo-wang/fetcher': 'catalog:peers',
          '@ahoo-wang/fetcher-storage': 'catalog:peers',
          '@ahoo-wang/fetcher-eventbus': '>=6.1.0',
        },
      },
      'cosec-react/package.json': {
        name: '@ahoo-wang/cosec-react',
        peerDependencies: {
          '@ahoo-wang/cosec-fetcher': 'workspace:~',
          react: 'catalog:peers',
        },
      },
      'test-host/package.json': {
        name: 'host',
        private: true,
        peerDependencies: { '@ahoo-wang/fetcher': '^5.0.0' },
      },
    },
    root => {
      const packed = {
        '@ahoo-wang/fetcher': '7.0.0',
        '@ahoo-wang/fetcher-eventbus': '7.0.0',
        '@ahoo-wang/fetcher-storage': '7.0.0',
      };
      assert.deepEqual(peerRows(root, packed), [
        {
          package: '@ahoo-wang/cosec-fetcher',
          peer: '@ahoo-wang/fetcher',
          range: '^6.1.0',
          version: '7.0.0',
          satisfied: false,
        },
        {
          package: '@ahoo-wang/cosec-fetcher',
          peer: '@ahoo-wang/fetcher-storage',
          range: '^6.1.0 || ^7.0.0',
          version: '7.0.0',
          satisfied: true,
        },
        {
          package: '@ahoo-wang/cosec-fetcher',
          peer: '@ahoo-wang/fetcher-eventbus',
          range: '>=6.1.0',
          version: '7.0.0',
          satisfied: true,
        },
      ]);
    },
  );
});

test('a peer referencing a missing catalog entry fails', () => {
  withTree(
    {
      'pnpm-workspace.yaml': WORKSPACE,
      'cosec-fetcher/package.json': {
        name: '@ahoo-wang/cosec-fetcher',
        peerDependencies: { '@ahoo-wang/fetcher-eventbus': 'catalog:peers' },
      },
    },
    root =>
      assert.throws(
        () => peerRows(root, { '@ahoo-wang/fetcher-eventbus': '6.1.0' }),
        /not in a catalog/,
      ),
  );
});

test('packed versions skip private packages', () => {
  withTree(
    {
      'fetcher/package.json': { name: '@ahoo-wang/fetcher', version: '6.1.0' },
      'internal/package.json': { name: 'internal', private: true },
      'notes/README.md': '',
    },
    root =>
      assert.deepEqual(packedVersions(root), { '@ahoo-wang/fetcher': '6.1.0' }),
  );
});

test('failed packages come from a pnpm --report-summary file', () => {
  withTree(
    {
      'test.json': {
        executionStatus: {
          '/w/typescript/cosec-fetcher': { status: 'failure' },
          '/w/typescript/cosec-react': { status: 'passed' },
        },
      },
    },
    root => {
      assert.deepEqual(failedPackages(join(root, 'test.json')), [
        'cosec-fetcher',
      ]);
      assert.deepEqual(failedPackages(join(root, 'missing.json')), []);
    },
  );
});

test('the summary names the commit, the pnpm, the peer verdicts and the failed step', () => {
  const text = summary({
    ref: 'main',
    sha: 'aa6e9c8',
    node: '24.22.2',
    pnpm: { used: '11.28.11', pinned: 'pnpm@11.28.11' },
    peers: [
      {
        package: '@ahoo-wang/cosec-fetcher',
        peer: '@ahoo-wang/fetcher',
        range: '^6.1.0',
        version: '7.0.0',
        satisfied: false,
      },
    ],
    steps: {
      install: { outcome: 'success' },
      typecheck: { outcome: 'failure' },
      test: { outcome: 'failure' },
    },
    failures: { test: ['cosec-react'], typecheck: { error: 'bad JSON' } },
  });
  assert.match(text, /CoSec `main` at `aa6e9c8`/);
  assert.match(text, /Node 24\.22\.2/);
  assert.match(text, /pnpm: 11\.28\.11 \(CoSec pins 11\.28\.11\)/);
  assert.match(
    text,
    /\| `@ahoo-wang\/cosec-fetcher` \| `@ahoo-wang\/fetcher` \| `\^6\.1\.0` \| 7\.0\.0 \| \*\*no\*\* \|/,
  );
  assert.match(text, /CoSec widens the range/);
  assert.match(
    text,
    /- Type-check \(its per-package report not read: bad JSON\)/,
  );
  assert.match(text, /- Package tests: `cosec-react`/);
});

test('a passing run with satisfied peers says so and nothing more', () => {
  const text = summary({
    ref: 'main',
    sha: 'aa6e9c8',
    node: '22.23.4',
    pnpm: { used: '11.28.11', pinned: 'pnpm@11.28.11' },
    peers: [
      {
        package: '@ahoo-wang/cosec-fetcher',
        peer: '@ahoo-wang/fetcher',
        range: '^6.1.0',
        version: '6.1.0',
        satisfied: true,
      },
    ],
    steps: { install: { outcome: 'success' }, test: { outcome: 'success' } },
    failures: {},
  });
  assert.match(text, /Every step passed\./);
  assert.doesNotMatch(text, /widens|Failed|not read|\*\*not\*\*/);
});

test('a pnpm other than the one CoSec pins is called out', () => {
  const text = summary({
    ref: 'main',
    sha: 'aa6e9c8',
    node: '24.22.2',
    pnpm: { used: '11.28.11', pinned: 'pnpm@11.30.0' },
    peers: [],
    steps: {},
    failures: {},
  });
  assert.match(
    text,
    /pnpm: 11\.28\.11, \*\*not\*\* the 11\.30\.0 CoSec pins\./,
  );
});

const PACKAGES = {
  'packages/fetcher/package.json': {
    name: '@ahoo-wang/fetcher',
    version: '6.1.0',
  },
};

const COSEC = {
  'cosec/package.json': { packageManager: 'pnpm@11.28.11' },
  'cosec/cosec-fetcher/package.json': {
    name: '@ahoo-wang/cosec-fetcher',
    peerDependencies: { '@ahoo-wang/fetcher': 'catalog:peers' },
  },
};

test('report reads a CoSec workspace and the per-package reports', () => {
  withTree(
    {
      ...PACKAGES,
      ...COSEC,
      'cosec/pnpm-workspace.yaml': WORKSPACE,
      'reports/test.json': {
        executionStatus: { '/w/cosec-fetcher': { status: 'failure' } },
      },
    },
    root => {
      const text = report({
        workspaceDir: join(root, 'cosec'),
        reportsDir: join(root, 'reports'),
        packagesDir: join(root, 'packages'),
        env: {
          COSEC_REF: 'main',
          COSEC_SHA: 'aa6e9c8',
          NODE_VERSION: '24.22.2',
          PNPM_VERSION: '11.28.11',
          STEPS: JSON.stringify({ test: { outcome: 'failure' } }),
        },
      });
      assert.match(text, /pnpm: 11\.28\.11 \(CoSec pins 11\.28\.11\)/);
      assert.match(text, /\| `\^6\.1\.0` \| 6\.1\.0 \| yes \|/);
      assert.match(text, /- Package tests: `cosec-fetcher`/);
    },
  );
});

test('report does not throw when CoSec writes its catalogs in a form it cannot read', () => {
  withTree(
    {
      ...PACKAGES,
      ...COSEC,
      'cosec/pnpm-workspace.yaml':
        "catalogs: { peers: { '@ahoo-wang/fetcher': '^6.1.0' } }\n",
      'reports/build.json': '{ not json',
    },
    root => {
      const text = report({
        workspaceDir: join(root, 'cosec'),
        reportsDir: join(root, 'reports'),
        packagesDir: join(root, 'packages'),
        env: {
          COSEC_REF: 'main',
          NODE_VERSION: '22.23.4',
          STEPS: JSON.stringify({
            build: { outcome: 'failure' },
            test: { outcome: 'skipped' },
          }),
        },
      });
      assert.match(
        text,
        /Peer ranges not read: catalogs is not in block style/,
      );
      assert.doesNotMatch(text, /\| CoSec package \|/);
      assert.match(text, /- Build \(its per-package report not read: /);
      assert.match(text, /pnpm: unknown \(CoSec pins 11\.28\.11\)/);
    },
  );
});

test('report survives a missing workspace and unreadable step outcomes', () => {
  withTree(PACKAGES, root => {
    const text = report({
      workspaceDir: join(root, 'missing'),
      reportsDir: join(root, 'missing-reports'),
      packagesDir: join(root, 'packages'),
      env: { COSEC_REF: 'main', NODE_VERSION: '24.22.2', STEPS: '{' },
    });
    assert.match(text, /Peer ranges not read: ENOENT/);
    assert.match(text, /CoSec's pin not read: ENOENT/);
    assert.match(text, /Step outcomes not read: /);
    assert.doesNotMatch(text, /Every step passed/);
  });
});

test('the library functions still throw on what they cannot read', () => {
  withTree(
    {
      'cosec/pnpm-workspace.yaml': "catalog: { react: '^19.0.0' }\n",
      'reports/test.json': '{ not json',
    },
    root => {
      assert.throws(() => peerRows(join(root, 'cosec'), {}), /block style/);
      assert.throws(() => failedPackages(join(root, 'reports', 'test.json')));
    },
  );
});
