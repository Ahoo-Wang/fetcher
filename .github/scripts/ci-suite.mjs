/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export const suites = ['core', 'view-engine', 'viewer'];
export function filters(suite, dependencies = false) {
  assert.ok(suites.includes(suite), `Unknown suite: ${suite}`);
  return suite === 'core'
    ? [
        '--filter',
        './packages/*',
        '--filter',
        '!@ahoo-wang/fetcher-view-engine',
        '--filter',
        '!@ahoo-wang/fetcher-viewer',
      ]
    : ['--filter', `@ahoo-wang/fetcher-${suite}${dependencies ? '...' : ''}`];
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const action = process.argv[2];
  assert.ok(['build', 'test'].includes(action));
  if (action === 'test')
    assert.ok(['true', 'false'].includes(process.env.COLLECT_COVERAGE));
  const script =
    action === 'build'
      ? 'build'
      : process.env.COLLECT_COVERAGE === 'true'
        ? 'test'
        : 'test:no-coverage';
  const result = spawnSync(
    'pnpm',
    ['-r', ...filters(process.env.CI_SUITE, action === 'build'), 'run', script],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
