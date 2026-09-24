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
export const CODACY_CHECK = 'Codacy Static Code Analysis';
export const CODACY_APP = 'codacy-production';

/**
 * The head commit of the pull request that this commit squashes, when there is
 * exactly one.
 *
 * Codacy analyses pull request heads, not pushes to the default branch, so a
 * release tagged on a merge commit has no Codacy Check Run of its own. The
 * check for the very tree being released lives on the pull request head
 * instead. The fallback stays tied to that tree: the pull request must be
 * merged, and merged AS this commit, so no other branch's analysis can stand
 * in for it. More than one candidate is refused rather than guessed at.
 */
export function mergedPullRequestHead(sha, pulls) {
  const candidates = pulls.filter(
    pull =>
      pull.merged_at &&
      pull.merge_commit_sha === sha &&
      /^[a-f0-9]{40}$/.test(pull.head?.sha ?? ''),
  );
  return candidates.length === 1 ? candidates[0].head.sha : undefined;
}

export function requireSuccessfulCodecov(checks, statuses) {
  const name = 'codecov/project';
  if (
    checks.some(check => check.name === name && check.app?.slug === 'codecov')
  ) {
    requireSuccessfulCheck(checks, name, 'codecov');
    return;
  }
  const latest = statuses
    .filter(
      status =>
        status.context === name &&
        status.creator?.login === 'codecov[bot]' &&
        status.creator?.type === 'Bot',
    )
    .sort((a, b) => b.id - a.id)[0];
  assert.ok(
    latest?.state === 'success',
    `${name}: latest trusted Codecov status must complete successfully`,
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
  if (checks.some(check => check.name === CODACY_CHECK)) {
    requireSuccessfulCheck(checks, CODACY_CHECK, CODACY_APP);
  } else {
    const pulls = pages(
      `repos/${repo}/commits/${sha}/pulls?per_page=100`,
    ).flat();
    const head = mergedPullRequestHead(sha, pulls);
    assert.ok(
      head,
      `${CODACY_CHECK}: absent on ${sha}, and no single pull request was merged as that commit`,
    );
    const headChecks = pages(
      `repos/${repo}/commits/${head}/check-runs?filter=all&per_page=100`,
    ).flatMap(page => page.check_runs);
    requireSuccessfulCheck(headChecks, CODACY_CHECK, CODACY_APP);
    console.log(`${CODACY_CHECK}: admitted from pull request head ${head}`);
  }
  const statuses = pages(
    `repos/${repo}/commits/${sha}/statuses?per_page=100`,
  ).flat();
  requireSuccessfulCodecov(checks, statuses);
  console.log(`Release admitted for ${sha}`);
}
