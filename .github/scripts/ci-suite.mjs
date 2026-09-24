/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export const suites = ['core', 'view-engine', 'viewer'];
// Suites whose Node 24 coverage run is split across runners, then merged.
export const shardedSuites = ['view-engine'];
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
/**
 * One shard of a sharded suite's `test` script, and the merge that finishes
 * it: together they run `vitest run --coverage && pnpm test:type`, with the
 * coverage thresholds held once, on the merged report.
 */
export function shardSteps(suite, shard) {
  assert.ok(shardedSuites.includes(suite), `Unsharded suite: ${suite}`);
  assert.match(shard, /^[1-9]\d*\/[1-9]\d*$/, `Bad shard: ${shard}`);
  return [
    [
      ...filters(suite),
      'exec',
      'vitest',
      'run',
      '--coverage',
      `--shard=${shard}`,
      '--reporter=blob',
      '--reporter=default',
    ],
  ];
}
export function mergeSteps(suite) {
  assert.ok(shardedSuites.includes(suite), `Unsharded suite: ${suite}`);
  return [
    [
      ...filters(suite),
      'exec',
      'vitest',
      'run',
      '--merge-reports',
      '--coverage',
    ],
    [...filters(suite), 'run', 'test:type'],
  ];
}
/** Packages with tests that read their own Markdown (`test:docs`). */
export function docsPackages(
  root = new URL('../../packages/', import.meta.url),
) {
  return readdirSync(root)
    .map(name =>
      JSON.parse(readFileSync(new URL(`${name}/package.json`, root), 'utf8')),
    )
    .filter(pkg => pkg.scripts?.['test:docs'])
    .map(pkg => pkg.name);
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
  assert.ok(['build', 'test', 'shard', 'merge', 'docs'].includes(action));
  const suite = process.env.CI_SUITE;
  if (action === 'shard') shardSteps(suite, process.env.CI_SHARD).forEach(run);
  else if (action === 'merge') mergeSteps(suite).forEach(run);
  else if (action === 'docs') {
    const names = docsPackages();
    assert.ok(names.length > 0, 'No package declares test:docs');
    const selected = names.flatMap(name => ['--filter', name]);
    run([...names.flatMap(name => ['--filter', `${name}...`]), 'run', 'build']);
    run([...selected, 'run', 'test:docs']);
  } else {
    if (action === 'test')
      assert.ok(['true', 'false'].includes(process.env.COLLECT_COVERAGE));
    const script =
      action === 'build'
        ? 'build'
        : process.env.COLLECT_COVERAGE === 'true'
          ? 'test'
          : 'test:no-coverage';
    run([...filters(suite, action === 'build'), 'run', script]);
  }
  process.exit(0);
}
