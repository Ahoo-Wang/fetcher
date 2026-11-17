/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// `pnpm run init` runs this command; the test runs it the same way, with a
// stub `pnpm` on PATH that records each call and fails the chosen step.
const entry = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).scripts.init;
const steps = ['install', 'format', 'lint', 'run build', 'run test'];
const success = 'Fetcher project initialized successfully!';

function runInit(failing) {
  const project = mkdtempSync(join(tmpdir(), 'fetcher-init-'));
  try {
    mkdirSync(join(project, 'scripts'));
    mkdirSync(join(project, 'bin'));
    copyFileSync(
      new URL('../../scripts/init.sh', import.meta.url),
      join(project, 'scripts/init.sh'),
    );
    const log = join(project, 'commands.log');
    writeFileSync(
      join(project, 'bin/pnpm'),
      `#!/bin/sh
printf '%s\\n' "$*" >> "$INIT_LOG"
if [ "$*" = "$INIT_FAIL" ]; then
  echo "simulated $* failure" >&2
  exit 42
fi
`,
      { mode: 0o755 },
    );
    const result = spawnSync('sh', ['-c', entry], {
      cwd: project,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${join(project, 'bin')}:${process.env.PATH}`,
        INIT_LOG: log,
        INIT_FAIL: failing ?? '',
      },
    });
    const commands = existsSync(log)
      ? readFileSync(log, 'utf8').trimEnd().split('\n')
      : [];
    return { ...result, commands };
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
}

test('init runs through sh', () => {
  assert.equal(entry, 'sh ./scripts/init.sh');
});

test('init runs every step and reports success when all pass', () => {
  const result = runInit();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.commands, steps);
  assert.match(result.stdout, new RegExp(success));
});

for (const [index, step] of steps.entries()) {
  test(`init stops with the failing exit code when "pnpm ${step}" fails`, () => {
    const result = runInit(step);
    assert.equal(result.status, 42);
    assert.deepEqual(result.commands, steps.slice(0, index + 1));
    assert.doesNotMatch(result.stdout, new RegExp(success));
  });
}
