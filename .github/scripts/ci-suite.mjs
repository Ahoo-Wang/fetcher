/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
// One suite since the Wow packages moved to the Wow repository (migration
// step 3′); the matrix keeps the suite axis so a split stays a one-line change.
export const suites = ['core'];
export function filters(suite) {
  assert.ok(suites.includes(suite), `Unknown suite: ${suite}`);
  return ['--filter', './packages/*'];
}
function run(args) {
  const result = spawnSync('pnpm', ['-r', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const action = process.argv[2];
  assert.ok(['build', 'test'].includes(action));
  const suite = process.env.CI_SUITE;
  if (action === 'test')
    assert.ok(['true', 'false'].includes(process.env.COLLECT_COVERAGE));
  const script =
    action === 'build'
      ? 'build'
      : process.env.COLLECT_COVERAGE === 'true'
        ? 'test'
        : 'test:no-coverage';
  run([...filters(suite), 'run', script]);
  process.exit(0);
}
