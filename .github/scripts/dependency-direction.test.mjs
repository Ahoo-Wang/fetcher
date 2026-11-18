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

test('this repository depends on no Wow or CoSec package', () => {
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

test('a CoSec client or the removed fetcher-cosec is refused, examples included', () => {
  const root = workspace({
    'package.json': {
      name: 'workspace',
      devDependencies: { '@ahoo-wang/fetcher-cosec': 'workspace:*' },
    },
    'pnpm-workspace.yaml':
      "packages:\n  - packages/*\n  - 'integration-test'\n\ncatalog:\n  '@ahoo-wang/cosec-fetcher': ^8.0.0\n",
    'README.md':
      "```ts\nimport { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';\n```\n",
    'packages/react/package.json': {
      name: '@ahoo-wang/fetcher-react',
      peerDependencies: { '@ahoo-wang/cosec-react': '^8' },
    },
    'packages/react/README.zh-CN.md':
      "```tsx\nimport { RouteGuard } from '@ahoo-wang/cosec-react';\n```\n",
    'integration-test/src/auth.ts':
      "export * from '@ahoo-wang/fetcher-cosec/internal';\n",
    'wiki/guides/auth.md':
      "```ts\nimport { TokenStorage } from '@ahoo-wang/cosec-fetcher';\n```\n",
    'wiki/examples/http/auth.ts':
      "const cosec = await import('@ahoo-wang/cosec-fetcher');\n",
    'stories/react/Guard.stories.tsx':
      "import { SecurityProvider } from '@ahoo-wang/cosec-react';\n",
    'skills/auth/SKILL.md':
      "```ts\nconst { TokenStorage } = require('@ahoo-wang/fetcher-cosec');\n```\n",
  });
  try {
    assert.deepEqual(violations(root).sort(), [
      'README.md imports @ahoo-wang/fetcher-cosec',
      'integration-test/src/auth.ts imports @ahoo-wang/fetcher-cosec/internal',
      'package.json devDependencies: @ahoo-wang/fetcher-cosec',
      'packages/react/README.zh-CN.md imports @ahoo-wang/cosec-react',
      'packages/react/package.json peerDependencies: @ahoo-wang/cosec-react',
      'pnpm-workspace.yaml catalog: @ahoo-wang/cosec-fetcher',
      'skills/auth/SKILL.md imports @ahoo-wang/fetcher-cosec',
      'stories/react/Guard.stories.tsx imports @ahoo-wang/cosec-react',
      'wiki/examples/http/auth.ts imports @ahoo-wang/cosec-fetcher',
      'wiki/guides/auth.md imports @ahoo-wang/cosec-fetcher',
    ]);
    assert.throws(
      () => execFileSync(process.execPath, [script, root], { stdio: 'pipe' }),
      /CoSec → fetcher/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('prose, migration guides, release history and build output are not examples', () => {
  const root = workspace({
    'wiki/guides/auth.md':
      'CoSec moved: install `@ahoo-wang/cosec-fetcher` (see https://cosec.ahoo.me).\n',
    'skills/fetcher-v6-migration/SKILL.md':
      "```ts\nimport { QueryClient } from '@ahoo-wang/wow-client';\n```\n",
    'docs/releases/v6.0.0.md':
      "```ts\nimport { TokenStorage } from '@ahoo-wang/fetcher-cosec';\n```\n",
    'wiki/.vitepress/dist/assets/app.js':
      "import('@ahoo-wang/cosec-fetcher');\n",
    'wiki/node_modules/x/index.js': "require('@ahoo-wang/fetcher-cosec');\n",
  });
  try {
    assert.deepEqual(violations(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('only a 5.x page or a migration guide may install the removed fetcher-cosec', () => {
  const root = workspace({
    'README.md':
      '```bash\npnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec\n```\n',
    'packages/react/package.json': { name: '@ahoo-wang/fetcher-react' },
    'packages/react/README.md':
      '```bash\npnpm add @ahoo-wang/fetcher-react@^6.0.0 \\\n  @ahoo-wang/fetcher-cosec@^6.0.0 \\\n  react\n```\n',
    'wiki/reference/react/index.md':
      '```sh\nnpm install @ahoo-wang/fetcher-cosec\n```\n',
    'skills/auth/SKILL.md': 'Run `yarn add @ahoo-wang/fetcher-cosec`.\n',
    // Allowed: a 5.x-only page, a migration guide, prose, look-alike names.
    'wiki/reference/viewer/index.md':
      '::: warning 5.x only\nThis page applies to 5.x.\n:::\n\n```sh\npnpm add @ahoo-wang/fetcher-cosec\n```\n',
    'wiki/zh/reference/viewer/index.md':
      '::: warning 已弃用（仅适用于 5.x）\n:::\n\n```sh\npnpm add @ahoo-wang/fetcher-cosec\n```\n',
    'skills/fetcher-v6-migration/SKILL.md':
      '```sh\npnpm add @ahoo-wang/fetcher-cosec@6\n```\n',
    'wiki/guides/auth.md':
      'Was `@ahoo-wang/fetcher-cosec`; now run `pnpm add @ahoo-wang/cosec-fetcher@beta`.\n\n```sh\npnpm add @ahoo-wang/fetcher-cosecure\n```\n',
  });
  try {
    assert.deepEqual(violations(root).sort(), [
      'README.md installs @ahoo-wang/fetcher-cosec',
      'packages/react/README.md installs @ahoo-wang/fetcher-cosec',
      'skills/auth/SKILL.md installs @ahoo-wang/fetcher-cosec',
      'wiki/reference/react/index.md installs @ahoo-wang/fetcher-cosec',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fetcher packages and look-alike names are allowed', () => {
  const root = workspace({
    'packages/react/package.json': {
      name: '@ahoo-wang/fetcher-react',
      peerDependencies: { '@ahoo-wang/fetcher': 'workspace:^' },
      devDependencies: {
        'wow-client': '1.0.0',
        '@other/wow-client': '1',
        '@other/fetcher-cosec': '1',
        '@ahoo-wang/fetcher-cosecure': '1',
      },
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
