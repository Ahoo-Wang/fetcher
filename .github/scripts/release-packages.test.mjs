/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  compareVersions,
  distTag,
  parseVersion,
  publishPlan,
  releaseVersion,
} from '../../scripts/release-version.mjs';

/** A workspace at a temporary path with the given versions. */
function workspace(versions) {
  const dir = mkdtempSync(join(tmpdir(), 'fetcher-release-'));
  for (const [path, version] of Object.entries(versions)) {
    mkdirSync(join(dir, path), { recursive: true });
    writeFileSync(
      join(dir, path, 'package.json'),
      JSON.stringify({
        name: path.startsWith('packages/')
          ? `@ahoo-wang/${path.endsWith('react') ? 'fetcher-react' : 'fetcher'}`
          : 'workspace',
        version,
      }),
    );
  }
  return dir;
}

/**
 * Fake `pnpm` (logs its arguments) and `npm`: `npm view <name>
 * dist-tags.latest` answers from NPM_LATEST (a JSON map), `npm view
 * <name>@<version> version` from NPM_PUBLISHED (a JSON list of specs), E404
 * otherwise; a name listed in NPM_FAIL fails like an unreachable registry.
 * With `readsStdin`, `pnpm` first reads its standard input to the end, the
 * way npm does when it prompts for a one-time password. With `drainsFd3` it
 * reads the inherited plan descriptor, which ends the publish loop early.
 */
function fakeTools(dir, { readsStdin = false, drainsFd3 = false } = {}) {
  mkdirSync(join(dir, 'bin'));
  writeFileSync(
    join(dir, 'bin/pnpm'),
    '#!/bin/sh\n' +
      (readsStdin ? 'cat > /dev/null\n' : '') +
      (drainsFd3 ? 'cat <&3 > /dev/null\n' : '') +
      'printf "%s\\n" "$*" >> "$PUBLISH_LOG"\n',
    { mode: 0o755 },
  );
  writeFileSync(
    join(dir, 'bin/npm'),
    '#!/usr/bin/env node\n' +
      'const [, , , spec, field] = process.argv;\n' +
      'const [, name, version] = /^(@[^/]+\\/[^@]+)(?:@(.+))?$/.exec(spec);\n' +
      'if (JSON.parse(process.env.NPM_FAIL || "[]").includes(name)) {\n' +
      '  console.error("npm error code ETIMEDOUT"); process.exit(1);\n' +
      '}\n' +
      'const answer = field === "version"\n' +
      '  ? JSON.parse(process.env.NPM_PUBLISHED || "[]").includes(spec) && version\n' +
      '  : JSON.parse(process.env.NPM_LATEST || "{}")[name];\n' +
      'if (answer) console.log(answer);\n' +
      'else { console.error("npm error code E404"); process.exit(1); }\n',
    { mode: 0o755 },
  );
}

function publish(dir, env = {}) {
  const log = join(dir, 'published');
  const stdout = execFileSync('bash', [resolve('scripts/publish-npm.sh')], {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
      PUBLISH_LOG: log,
      NPM_DIST_TAG: '',
      RELEASE_TAG: '',
      RELEASE_PRERELEASE: '',
      NPM_LATEST: '',
      NPM_PUBLISHED: '',
      NPM_FAIL: '',
      ...env,
    },
  });
  publish.stdout = String(stdout);
  return existsSync(log) ? readFileSync(log, 'utf8') : '';
}

const PATHS = ['', 'integration-test', 'packages/fetcher', 'packages/react'];
const aligned = version =>
  Object.fromEntries(PATHS.map(path => [path, version]));

test('versioning and publishing cover every scoped workspace package', () => {
  const dir = workspace(aligned('5.0.0'));
  try {
    execFileSync('bash', [resolve('scripts/update-all-versions.sh'), '5.1.0'], {
      cwd: dir,
    });
    for (const path of PATHS) {
      assert.equal(
        JSON.parse(readFileSync(join(dir, path, 'package.json'))).version,
        '5.1.0',
      );
    }
    fakeTools(dir);
    assert.equal(
      publish(dir, {
        NPM_LATEST: JSON.stringify({ '@ahoo-wang/fetcher': '5.0.0' }),
      }),
      'publish packages/fetcher/ --access public --no-git-checks --tag latest\n' +
        'publish packages/react/ --access public --no-git-checks --tag latest\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a prerelease is published under its word, never latest', () => {
  const dir = workspace(aligned('8.0.0-rc.1'));
  try {
    fakeTools(dir);
    assert.equal(
      publish(dir, {
        NPM_LATEST: JSON.stringify({ '@ahoo-wang/fetcher': '6.1.1' }),
        RELEASE_TAG: 'v8.0.0-rc.1',
        RELEASE_PRERELEASE: 'true',
      }),
      'publish packages/fetcher/ --access public --no-git-checks --tag rc\n' +
        'publish packages/react/ --access public --no-git-checks --tag rc\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a maintenance release below npm latest does not take latest back', () => {
  const dir = workspace(aligned('6.1.2'));
  try {
    fakeTools(dir);
    // fetcher has 8.0.0 on latest; fetcher-react is not on npm at all here,
    // the way fetcher-cosec has no 8.x: it keeps latest.
    assert.equal(
      publish(dir, {
        NPM_LATEST: JSON.stringify({ '@ahoo-wang/fetcher': '8.0.0' }),
      }),
      'publish packages/fetcher/ --access public --no-git-checks --tag latest-6\n' +
        'publish packages/react/ --access public --no-git-checks --tag latest\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('nothing is published when the versions or the release disagree', () => {
  const cases = [
    [{ ...aligned('8.0.0-rc.1'), 'packages/react': '6.1.0' }, {}],
    [aligned('8.0.0-RC1'), {}],
    [aligned('8.0.0-rc.1'), { RELEASE_TAG: 'v8.0.0-rc.2' }],
    [aligned('8.0.0-rc.1'), { RELEASE_PRERELEASE: 'false' }],
    [aligned('8.0.0'), { RELEASE_PRERELEASE: 'true' }],
    [aligned('8.0.0-rc.1'), { NPM_DIST_TAG: 'latest' }],
  ];
  for (const [versions, env] of cases) {
    const dir = workspace(versions);
    try {
      fakeTools(dir);
      assert.throws(() => publish(dir, env), JSON.stringify([versions, env]));
      assert.equal(existsSync(join(dir, 'published')), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('release versions are lowercase MAJOR.MINOR.PATCH[-word.n]', () => {
  for (const version of ['8.0.0', '8.0.0-rc.1', '8.0.0-beta.10', '0.1.0'])
    assert.doesNotThrow(() => parseVersion(version), version);
  for (const version of [
    '8.0.0-RC1',
    '8.0.0-RC.1',
    '8.0.0-rc1',
    '8.0.0-rc',
    '8.0.0-rc.01',
    '08.0.0',
    'v8.0.0',
    '8.0',
    '8.0.0+build.1',
    '',
    undefined,
  ])
    assert.throws(() => parseVersion(version), /lowercase/, String(version));
});

test('dist-tags follow from the version', () => {
  assert.equal(distTag('8.0.0-rc.1', null), 'rc');
  assert.equal(distTag('8.0.0-beta.9', '6.1.1'), 'beta');
  assert.equal(distTag('8.0.0-rc.1', '9.0.0'), 'rc');
  assert.equal(distTag('8.0.0', '6.1.1'), 'latest');
  assert.equal(distTag('8.0.0', '8.0.0-rc.1'), 'latest');
  assert.equal(distTag('8.0.0', null), 'latest');
  assert.equal(distTag('6.1.2', '8.0.0'), 'latest-6');
  assert.equal(distTag('8.0.1', '8.1.0'), 'latest-8');
  assert.equal(distTag('6.1.2', '6.1.1'), 'latest');
  assert.equal(distTag('6.1.2', '0.0.0'), 'latest');
  assert.equal(distTag('6.1.2', '8.0.0', 'maintenance'), 'maintenance');
  assert.equal(distTag('8.0.0', '6.1.1', 'latest'), 'latest');
  assert.throws(() => distTag('8.0.0-rc.1', null, 'latest'), /latest/);
  for (const tag of ['6.x', 'v6', 'Latest', '1', 'rc tag'])
    assert.throws(() => distTag('8.0.0-rc.1', null, tag), /NPM_DIST_TAG/, tag);
});

test('versions compare by semver precedence', () => {
  const ordered = [
    '6.1.1',
    '8.0.0-RC1',
    '8.0.0-alpha.1',
    '8.0.0-beta.2',
    '8.0.0-beta.10',
    '8.0.0-rc.1',
    '8.0.0',
    '8.0.1',
    '8.1.0',
    '10.0.0',
  ];
  for (let i = 0; i < ordered.length - 1; i++) {
    assert.ok(compareVersions(ordered[i], ordered[i + 1]) < 0, ordered[i]);
    assert.ok(compareVersions(ordered[i + 1], ordered[i]) > 0, ordered[i]);
  }
  assert.equal(compareVersions('8.0.0', '8.0.0'), 0);
});

test('releaseVersion names every disagreeing manifest', () => {
  const dir = workspace({
    ...aligned('8.0.0-rc.1'),
    'packages/react': '6.1.0',
  });
  const other = workspace(aligned('8.0.0-rc.1'));
  try {
    assert.throws(
      () => releaseVersion(dir),
      error =>
        /packages\/react\/package\.json: 6\.1\.0/.test(error.message) &&
        /integration-test\/package\.json: 8\.0\.0-rc\.1/.test(error.message),
    );
    assert.throws(
      () =>
        releaseVersion(other, {
          releaseTag: '8.0.0-rc.1',
        }),
      /expected v8\.0\.0-rc\.1/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  }
});

test('the release workflow checks the version and hands the release to the publisher', () => {
  const workflow = readFileSync('.github/workflows/release.yml', 'utf8');
  const steps = workflow.split(/\n\s+- name: /).slice(1);
  const check = steps.find(step => step.startsWith('Check release version'));
  const build = steps.findIndex(step => step.startsWith('Build'));
  const publish = steps.find(step => step.startsWith('Publish to NPM'));
  assert.ok(check, 'a Check release version step');
  assert.ok(
    steps.indexOf(check) < build,
    'the version is checked before building',
  );
  assert.match(check, /node scripts\/release-version\.mjs check/);
  for (const step of [check, publish]) {
    assert.match(
      step,
      /RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/,
    );
    assert.match(
      step,
      /RELEASE_PRERELEASE: \$\{\{ github\.event\.release\.prerelease \}\}/,
    );
  }
  assert.match(
    readFileSync('scripts/publish-npm.sh', 'utf8'),
    /pnpm publish "\$package" --access public --no-git-checks --tag "\$tag"/,
  );
});

test('a rerun publishes only the packages npm does not have yet', () => {
  const dir = workspace(aligned('8.0.0-rc.1'));
  try {
    fakeTools(dir);
    assert.equal(
      publish(dir, {
        NPM_PUBLISHED: JSON.stringify(['@ahoo-wang/fetcher@8.0.0-rc.1']),
      }),
      'publish packages/react/ --access public --no-git-checks --tag rc\n',
    );
    assert.match(
      publish.stdout,
      /Skipping @ahoo-wang\/fetcher@8\.0\.0-rc\.1: already on npm/,
    );
    rmSync(join(dir, 'published'));
    assert.equal(
      publish(dir, {
        NPM_PUBLISHED: JSON.stringify([
          '@ahoo-wang/fetcher@8.0.0-rc.1',
          '@ahoo-wang/fetcher-react@8.0.0-rc.1',
        ]),
      }),
      '',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed npm lookup for any package stops the release before the first publish', () => {
  // packages/fetcher is published first; the lookup that fails is the second
  // package's, so passing means every lookup ran before any publish.
  for (const [version, env] of [
    ['8.0.0-rc.1', {}],
    [
      '8.0.0',
      { NPM_LATEST: JSON.stringify({ '@ahoo-wang/fetcher': '6.1.1' }) },
    ],
    ['8.0.0', { NPM_DIST_TAG: 'latest' }],
  ]) {
    const dir = workspace(aligned(version));
    try {
      fakeTools(dir);
      assert.throws(
        () =>
          publish(dir, {
            ...env,
            NPM_FAIL: JSON.stringify(['@ahoo-wang/fetcher-react']),
          }),
        error => /ETIMEDOUT/.test(String(error.stderr)),
        version,
      );
      assert.equal(existsSync(join(dir, 'published')), false, version);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('publishPlan decides every tag and published state up front', () => {
  const dir = workspace(aligned('6.1.2'));
  try {
    const asked = [];
    const plan = publishPlan(dir, '6.1.2', undefined, {
      latest: name => (
        asked.push(['latest', name]),
        name === '@ahoo-wang/fetcher' ? '8.0.0' : '6.1.1'
      ),
      has: (name, version) => (
        asked.push(['has', name, version]),
        name === '@ahoo-wang/fetcher-react'
      ),
    });
    assert.deepEqual(plan, [
      {
        directory: 'packages/fetcher/',
        name: '@ahoo-wang/fetcher',
        tag: 'latest-6',
        published: false,
      },
      {
        directory: 'packages/react/',
        name: '@ahoo-wang/fetcher-react',
        tag: 'latest',
        published: true,
      },
    ]);
    assert.equal(asked.length, 4);
    assert.throws(
      () =>
        publishPlan(dir, '6.1.2', undefined, {
          latest: () => '6.1.1',
          has: name => {
            if (name.endsWith('react')) throw new Error('registry down');
            return false;
          },
        }),
      /registry down/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a publisher that reads standard input does not swallow the rest of the plan', () => {
  const dir = workspace(aligned('8.0.0-rc.1'));
  try {
    fakeTools(dir, { readsStdin: true });
    assert.equal(
      publish(dir),
      'publish packages/fetcher/ --access public --no-git-checks --tag rc\n' +
        'publish packages/react/ --access public --no-git-checks --tag rc\n',
    );
    assert.match(publish.stdout, /Published 2, skipped 0 of 2 packages/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the publisher fails when the loop ends before the plan does', () => {
  const dir = workspace(aligned('8.0.0-rc.1'));
  try {
    fakeTools(dir, { drainsFd3: true });
    assert.throws(
      () => publish(dir),
      error =>
        /Expected 2 packages to be published or skipped/.test(
          String(error.stderr),
        ) && /Published 1, skipped 0 of 2/.test(String(error.stdout)),
    );
    assert.equal(
      readFileSync(join(dir, 'published'), 'utf8'),
      'publish packages/fetcher/ --access public --no-git-checks --tag rc\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
