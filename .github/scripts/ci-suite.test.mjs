/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { suites, filters } from './ci-suite.mjs';
test('suite filters cover each workspace exactly once and builds include dependencies', () => {
  const expected = readdirSync('packages')
    .map(
      name =>
        JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8')).name,
    )
    .sort();
  const selected = [];
  for (const suite of suites) {
    const names = JSON.parse(
      execFileSync(
        'pnpm',
        [...filters(suite), 'list', '--depth', '-1', '--json'],
        { encoding: 'utf8' },
      ),
    ).map(pkg => pkg.name);
    assert.ok(names.length > 0);
    selected.push(...names);
    const built = JSON.parse(
      execFileSync(
        'pnpm',
        [...filters(suite, true), 'list', '--depth', '-1', '--json'],
        { encoding: 'utf8' },
      ),
    ).map(pkg => pkg.name);
    assert.ok(names.every(name => built.includes(name)));
  }
  assert.deepEqual(selected.sort(), expected);
  assert.throws(() => filters('unknown'));
});

test('a sharded suite runs its whole test script across the shards and the merge', async () => {
  const { shardedSuites, shardSteps, mergeSteps } =
    await import('./ci-suite.mjs');
  for (const suite of shardedSuites) {
    const pkg = JSON.parse(
      readFileSync(`packages/${suite}/package.json`, 'utf8'),
    );
    // shardSteps + mergeSteps spell out exactly this script; a new step here
    // must be added there, or the sharded Node 24 run silently drops it.
    assert.equal(pkg.scripts.test, 'vitest run --coverage && pnpm test:type');
    const [shard] = shardSteps(suite, '2/3');
    for (const arg of ['run', '--coverage', '--shard=2/3', '--reporter=blob'])
      assert.ok(shard.includes(arg), arg);
    const [merge, types] = mergeSteps(suite);
    for (const arg of ['--merge-reports', '--coverage'])
      assert.ok(merge.includes(arg), arg);
    assert.deepEqual(types.slice(-2), ['run', 'test:type']);
    // Thresholds are skipped per shard and held on the merged report.
    const config = readFileSync(`packages/${suite}/vitest.config.ts`, 'utf8');
    assert.match(config, /startsWith\('--shard'\)/);
  }
  assert.throws(() => shardSteps('core', '1/3'));
  assert.throws(() => shardSteps('view-engine', 'all'));
});

test('every test that reads Markdown runs in its package test:docs', async () => {
  const { docsPackages } = await import('./ci-suite.mjs');
  const withDocs = [];
  for (const name of readdirSync('packages')) {
    const root = `packages/${name}`;
    const pkg = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'));
    const tests = readdirSync(`${root}/test`, { recursive: true })
      .filter(file => /\.test\.tsx?$/.test(file))
      .filter(file =>
        /\.md['"`]/.test(
          readFileSync(`${root}/test/${file}`, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, ''),
        ),
      )
      .map(file => `test/${file}`)
      .sort();
    const listed = (pkg.scripts['test:docs'] ?? '')
      .split(/\s+/)
      .filter(arg => arg.startsWith('test/'))
      .sort();
    assert.deepEqual(listed, tests, `${pkg.name} test:docs`);
    if (tests.length > 0) withDocs.push(pkg.name);
  }
  assert.deepEqual(docsPackages().sort(), withDocs.sort());
});
