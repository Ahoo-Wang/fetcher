/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  requireSuccessfulRun,
  requireSuccessfulCheck,
} from './release-admission.mjs';
test('release requires exact SHA, latest completed workflow and non-PR execution', () => {
  const run = {
    id: 1,
    head_sha: 'target',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
  };
  assert.doesNotThrow(() => requireSuccessfulRun([run], 'target', 'CI'));
  for (const runs of [
    [],
    [{ ...run, head_sha: 'old' }],
    [{ ...run, event: 'pull_request' }],
    [run, { ...run, id: 2, conclusion: 'failure' }],
    [run, { ...run, id: 2, status: 'in_progress' }],
  ])
    assert.throws(() => requireSuccessfulRun(runs, 'target', 'CI'));
});
test('external check must come from the expected app and cannot reuse an old success', () => {
  const check = {
    id: 1,
    name: 'coverage',
    app: { slug: 'codecov' },
    status: 'completed',
    conclusion: 'success',
  };
  assert.doesNotThrow(() =>
    requireSuccessfulCheck([check], 'coverage', 'codecov'),
  );
  for (const checks of [
    [],
    [{ ...check, app: { slug: 'other' } }],
    [check, { ...check, id: 2, conclusion: 'failure' }],
  ])
    assert.throws(() => requireSuccessfulCheck(checks, 'coverage', 'codecov'));
});
