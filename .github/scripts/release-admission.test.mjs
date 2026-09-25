/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  mergedPullRequestHead,
  requiredWorkflows,
  requireSuccessfulRun,
  requireSuccessfulCodecov,
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

test('Codecov accepts trusted commit statuses without bypassing failed check runs', () => {
  const status = {
    id: 1,
    context: 'codecov/project',
    creator: { login: 'codecov[bot]', type: 'Bot' },
    state: 'success',
  };
  assert.doesNotThrow(() => requireSuccessfulCodecov([], [status]));
  for (const statuses of [
    [],
    [{ ...status, creator: { login: 'other', type: 'Bot' } }],
    [{ ...status, creator: { login: 'codecov[bot]', type: 'User' } }],
    [{ ...status, context: 'codecov/patch' }],
    [status, { ...status, id: 2, state: 'pending' }],
    [status, { ...status, id: 2, state: 'failure' }],
  ])
    assert.throws(() => requireSuccessfulCodecov([], statuses));
  const check = {
    id: 1,
    name: 'codecov/project',
    app: { slug: 'codecov' },
    status: 'completed',
    conclusion: 'success',
  };
  assert.doesNotThrow(() => requireSuccessfulCodecov([check], []));
  assert.throws(() =>
    requireSuccessfulCodecov([{ ...check, conclusion: 'failure' }], [status]),
  );
});

test('Codacy may fall back only to the head of the pull request merged as this commit', () => {
  const head = 'a'.repeat(40);
  const pull = {
    merged_at: '2026-09-20T00:00:00Z',
    merge_commit_sha: 'target',
    head: { sha: head },
  };
  assert.equal(mergedPullRequestHead('target', [pull]), head);
  for (const pulls of [
    [],
    [{ ...pull, merged_at: null }],
    [{ ...pull, merge_commit_sha: 'another' }],
    [{ ...pull, head: { sha: 'not-a-sha' } }],
    [{ ...pull, head: undefined }],
    [pull, { ...pull, head: { sha: 'b'.repeat(40) } }],
  ])
    assert.equal(mergedPullRequestHead('target', pulls), undefined);
});

test('release admission requires exactly the workflows this repository runs on push', () => {
  const workflows = new URL('../workflows/', import.meta.url);
  for (const workflow of requiredWorkflows)
    assert.ok(existsSync(new URL(workflow, workflows)), workflow);
  // generator-test.yml moved to the Wow repository (migration step 3′); a
  // required workflow that no longer exists would block every release.
  assert.ok(!readdirSync(workflows).includes('generator-test.yml'));
  assert.deepEqual(requiredWorkflows, [
    'ci.yml',
    'quality.yml',
    'build-storybook.yml',
    'integration-test.yml',
  ]);
});

test('the required integration run reaches no host outside the CI job', () => {
  const root = new URL('../../', import.meta.url);
  const read = path => readFileSync(new URL(path, root), 'utf8');
  // Public-internet cases live in integration-test/test/external/ and run in
  // the advisory integration-external.yml, which admission must not require.
  assert.ok(!requiredWorkflows.includes('integration-external.yml'));
  assert.ok(
    existsSync(new URL('.github/workflows/integration-external.yml', root)),
  );
  const scripts = JSON.parse(read('integration-test/package.json')).scripts;
  assert.match(scripts.test, /--project required\b/);
  assert.match(scripts['test:external'], /--project external\b/);
  // The required run has cases again (the JSONPlaceholder suites, against a
  // local server), so an empty run must fail rather than pass.
  assert.doesNotMatch(scripts.test, /--passWithNoTests/);
  const vitestConfig = read('integration-test/vitest.config.ts');
  assert.match(vitestConfig, /'test\/external\/\*\*'/);
  assert.match(vitestConfig, /'test\/jsonplaceholder\/globalSetup\.ts'/);
  for (const suite of [
    'fetcher/typicodeFetcher.test.ts',
    'decorator/typicodePostService.test.ts',
    'decorator/typicodeUserService.test.ts',
    'decorator/resultExtractorService.test.ts',
  ]) {
    assert.ok(existsSync(new URL(`integration-test/test/${suite}`, root)));
  }
  // Only the external workflow points them at the live site.
  assert.doesNotMatch(
    read('.github/workflows/integration-test.yml'),
    /JSONPLACEHOLDER_BASE_URL/,
  );
  // The live-provider credentials go only to the advisory run.
  assert.doesNotMatch(
    read('.github/workflows/integration-test.yml'),
    /secrets\./,
  );
  assert.match(
    read('.github/workflows/integration-external.yml'),
    /pnpm test:it:external/,
  );
});
