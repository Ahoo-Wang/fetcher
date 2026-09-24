/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
test('compatibility jobs execute the same tests, compiler/type steps and timeouts', () => {
  const packages = new URL('../../packages/', import.meta.url);
  for (const name of readdirSync(packages)) {
    const pkg = JSON.parse(
      readFileSync(new URL(`${name}/package.json`, packages), 'utf8'),
    );
    assert.equal(
      pkg.scripts['test:no-coverage'],
      pkg.scripts.test.replace('--coverage', '--coverage.enabled=false'),
      name,
    );
  }
});

test('Combined coverage waits for the Node 24 jobs only, and they cover every suite', async () => {
  const { suites, shardedSuites } = await import('./ci-suite.mjs');
  const ci = readFileSync(
    new URL('../workflows/ci.yml', import.meta.url),
    'utf8',
  );
  const job = id => ci.split(`\n  ${id}:\n`)[1].split(/\n {2}[a-z0-9-]+:\n/)[0];
  const list = text => text.split(',').map(value => value.trim());
  // Node 22 compatibility runs every suite without coverage. Node 20 reached
  // end of life on 2026-04-30; the root `engines` asks for Node >=22.12.0.
  const compat = job('build-and-test');
  assert.deepEqual(list(compat.match(/node-version: \[([^\]]+)\]/)[1]), ['22']);
  const root = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  assert.equal(root.engines.node, '>=22.12.0');
  assert.deepEqual(list(compat.match(/suite: \[([^\]]+)\]/)[1]), suites);
  assert.match(compat, /COLLECT_COVERAGE: 'false'/);
  // Node 24 runs the unsharded suites with coverage; the sharded ones merge
  // in the `view-engine` job.
  const node24 = job('node24');
  assert.deepEqual(
    list(node24.match(/suite: \[([^\]]+)\]/)[1]),
    suites.filter(suite => !shardedSuites.includes(suite)),
  );
  assert.match(node24, /COLLECT_COVERAGE: 'true'/);
  assert.deepEqual(shardedSuites, ['view-engine']);
  assert.match(job('coverage'), /needs: \[changes, node24, view-engine\]/);
});
