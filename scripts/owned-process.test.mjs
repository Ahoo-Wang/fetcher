/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { spawnOwned, stopOwned } from './owned-process.mjs';

const running = pid => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

test('cancelling an active verifier stops its owned descendant', async () => {
  const verifier = spawnOwned(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { spawn } from 'node:child_process';
       const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
       console.log(JSON.stringify({ verifier: process.pid, descendant: child.pid }));
       setInterval(() => {}, 1000);`,
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const [line] = await once(verifier.stdout, 'data');
  const pids = JSON.parse(line);

  await stopOwned(verifier, 1_000);

  assert.equal(running(pids.verifier), false);
  assert.equal(running(pids.descendant), false);
});

test(
  'cleanup kills the owned group when the leader exits before a stubborn descendant',
  { skip: process.platform === 'win32' },
  async () => {
    const verifier = spawnOwned(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { spawn } from 'node:child_process';
         const child = spawn(process.execPath, ['--input-type=module', '-e', "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)"], { stdio: ['ignore', 'pipe', 'ignore'] });
         child.stdout.once('data', () => console.log(JSON.stringify({ descendant: child.pid })));
         setInterval(() => {}, 1000);`,
      ],
      { stdio: ['ignore', 'pipe', 'inherit'] },
    );
    const [line] = await once(verifier.stdout, 'data');
    const { descendant } = JSON.parse(line);

    try {
      await stopOwned(verifier, 100);
      assert.equal(running(descendant), false);
    } finally {
      try {
        process.kill(-verifier.pid, 'SIGKILL');
      } catch {}
    }
  },
);

test(
  'SIGTERM during the package verifier stops the active verifier',
  { skip: process.platform === 'win32' },
  async () => {
    const artifacts = await mkdtemp(join(tmpdir(), 'fve-lifecycle-'));
    const runner = spawn(process.execPath, ['scripts/verify-view-engine.mjs'], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, VIEW_ENGINE_ARTIFACTS: artifacts },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const verifierPid = await new Promise((resolve, reject) => {
      runner.once('error', reject);
      runner.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/package pid (\d+)/);
        if (match) resolve(Number(match[1]));
      });
    });

    runner.kill('SIGTERM');
    const [, signal] = await once(runner, 'close');

    assert.equal(signal, 'SIGTERM');
    assert.equal(running(verifierPid), false);
    await rm(artifacts, { recursive: true, force: true });
  },
);
