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
