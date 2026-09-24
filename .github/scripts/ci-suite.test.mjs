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
test('suite filters cover each workspace exactly once', () => {
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
  }
  assert.deepEqual(selected.sort(), expected);
  assert.throws(() => filters('unknown'));
});

test('no package test reads Markdown, so package Markdown is documentation only', () => {
  // ci-scope.mjs skips every gate for a Markdown-only change inside a package.
  // A test that reads its package's Markdown would make that change code.
  for (const name of readdirSync('packages')) {
    const root = `packages/${name}`;
    const tests = readdirSync(`${root}/test`, { recursive: true })
      .filter(file => /\.test\.tsx?$/.test(file))
      .filter(file =>
        /\.md['"`]/.test(
          readFileSync(`${root}/test/${file}`, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, ''),
        ),
      );
    assert.deepEqual(tests, [], `${root} tests read Markdown`);
  }
});
