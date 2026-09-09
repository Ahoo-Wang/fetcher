/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scopes } from './ci-scope.mjs';

test('shared source, configuration and unknown paths run every gate', () => {
  for (const path of [
    'packages/wow/src/index.ts',
    'pnpm-lock.yaml',
    '.github/workflows/ci.yml',
    'scripts/build.mjs',
    'skills/generator/eval.json',
    'docs/check.mjs',
    'new-package/index.ts',
  ])
    assert.ok(Object.values(scopes([path])).every(Boolean), path);
});
test('isolated changes retain their relevant validation', () => {
  assert.deepEqual(scopes(['wiki/en/index.md']), {
    code: false,
    storybook: false,
    integration: false,
    generator: false,
    wiki: true,
  });
  assert.deepEqual(scopes(['stories/order.tsx']), {
    code: false,
    storybook: true,
    integration: false,
    generator: false,
    wiki: true,
  });
  assert.equal(scopes(['integration-test/package.json']).integration, true);
  assert.ok(Object.values(scopes(['README.md'])).every(value => !value));
  assert.ok(
    Object.values(scopes(['wiki/index.md', 'package.json'])).every(Boolean),
  );
});

test('a source file moved into documentation still requires code tests', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const directory = mkdtempSync(join(tmpdir(), 'ci-scope-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  try {
    git('init', '-q');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'test');
    mkdirSync(join(directory, 'packages'), { recursive: true });
    mkdirSync(join(directory, 'docs'));
    writeFileSync(
      join(directory, 'packages/source.ts'),
      'export const value = 1;\n',
    );
    git('add', '.');
    git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    git('mv', 'packages/source.ts', 'docs/example.md');
    git('commit', '-qm', 'move');
    const output = join(directory, 'output');
    execFileSync(
      process.execPath,
      [new URL('./ci-scope.mjs', import.meta.url).pathname],
      {
        cwd: directory,
        env: {
          ...process.env,
          BASE_SHA: base,
          HEAD_SHA: git('rev-parse', 'HEAD'),
          GITHUB_OUTPUT: output,
        },
      },
    );
    assert.match(readFileSync(output, 'utf8'), /code=true/);
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [new URL('./ci-scope.mjs', import.meta.url).pathname],
        {
          cwd: directory,
          env: {
            ...process.env,
            BASE_SHA: 'missing-revision',
            HEAD_SHA: 'HEAD',
            GITHUB_OUTPUT: output,
          },
          stdio: 'pipe',
        },
      ),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
