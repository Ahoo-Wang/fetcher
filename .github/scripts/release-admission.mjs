/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const requiredWorkflows = [
  'ci.yml',
  'quality.yml',
  'build-storybook.yml',
  'integration-test.yml',
  'generator-test.yml',
];
export function requireSuccessfulRun(runs, sha, workflow) {
  const latest = runs
    .filter(
      run =>
        run.head_sha === sha &&
        ['push', 'workflow_dispatch'].includes(run.event),
    )
    .sort((a, b) => b.id - a.id)[0];
  assert.ok(
    latest && latest.status === 'completed' && latest.conclusion === 'success',
    `${workflow}: latest run for ${sha} must complete successfully`,
  );
}
export function requireSuccessfulCheck(checks, name, app) {
  const latest = checks
    .filter(check => check.name === name && check.app?.slug === app)
    .sort((a, b) => b.id - a.id)[0];
  assert.ok(
    latest && latest.status === 'completed' && latest.conclusion === 'success',
    `${name}: latest trusted check must complete successfully`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const repo = process.env.GITHUB_REPOSITORY;
  assert.match(sha, /^[a-f0-9]{40}$/);
  assert.match(repo ?? '', /^[\w.-]+\/[\w.-]+$/);
  const pages = path =>
    JSON.parse(
      execFileSync('gh', ['api', '--paginate', '--slurp', path], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      }),
    );
  for (const workflow of requiredWorkflows) {
    const runs = pages(
      `repos/${repo}/actions/workflows/${workflow}/runs?head_sha=${sha}&per_page=100`,
    ).flatMap(page => page.workflow_runs);
    requireSuccessfulRun(runs, sha, workflow);
  }
  const checks = pages(
    `repos/${repo}/commits/${sha}/check-runs?filter=all&per_page=100`,
  ).flatMap(page => page.check_runs);
  requireSuccessfulCheck(
    checks,
    'Codacy Static Code Analysis',
    'codacy-production',
  );
  requireSuccessfulCheck(checks, 'codecov/project', 'codecov');
  console.log(`Release admitted for ${sha}`);
}
