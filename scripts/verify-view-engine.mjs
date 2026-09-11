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
import { appendFileSync, createWriteStream, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { spawnOwned, stopOwned } from './owned-process.mjs';

const root = new URL('../', import.meta.url);
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit']);
const readinessBrowsers =
  process.env.VIEW_ENGINE_BROWSERS !== undefined
    ? process.env.VIEW_ENGINE_BROWSERS.split(',').map(value => value.trim())
    : [process.env.VIEW_ENGINE_BROWSER ?? 'chromium'];
if (
  readinessBrowsers.some(browser => !supportedBrowsers.has(browser)) ||
  new Set(readinessBrowsers).size !== readinessBrowsers.length
)
  throw new Error(
    `VIEW_ENGINE_BROWSERS must be a unique comma-separated subset of chromium,firefox,webkit: ${readinessBrowsers.join(',')}`,
  );
let storybook;
let storybookError;
let activeVerifier;
let cancellation;
const artifacts = process.env.VIEW_ENGINE_ARTIFACTS
  ? resolve(process.env.VIEW_ENGINE_ARTIFACTS)
  : undefined;
if (artifacts) mkdirSync(artifacts, { recursive: true });

const start = (stage, command, args, env = process.env) => {
  const log = artifacts
    ? createWriteStream(join(artifacts, `${stage}.log`))
    : undefined;
  const child = spawnOwned(command, args, {
    cwd: root,
    env,
    stdio: log ? ['inherit', 'pipe', 'pipe'] : 'inherit',
  });
  console.log(`[verify:view-engine] ${stage} pid ${child.pid}`);
  if (log) {
    child.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      log.write(chunk);
    });
    child.stderr.on('data', chunk => {
      process.stderr.write(chunk);
      log.write(chunk);
    });
    child.once('close', () => log.end());
  }
  return child;
};

const run = (stage, command, args, env = process.env) => {
  const child = start(stage, command, args, env);
  activeVerifier = child;
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (activeVerifier === child) activeVerifier = undefined;
      if (code === 0) resolve();
      else
        reject(
          Object.assign(new Error(`${args[0]} failed (${signal ?? code})`), {
            exitCode: code ?? 1,
          }),
        );
    });
  });
};

const availablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => (error ? reject(error) : resolve(port)));
    });
  });

async function waitFor(url, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (storybookError) throw storybookError;
    if (storybook.exitCode !== null || storybook.signalCode)
      throw new Error(
        `Storybook exited before becoming ready (${storybook.signalCode ?? storybook.exitCode})`,
      );
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Storybook did not become ready within ${timeout}ms: ${url}`);
}

for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    cancellation = signal;
    await stopOwned(activeVerifier);
    await stopOwned(storybook);
    process.kill(process.pid, signal);
  });

try {
  await run('package', process.execPath, [
    'packages/view-engine/scripts/verify-package.mjs',
  ]);
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  storybook = start('storybook', pnpm, [
    'exec',
    'storybook',
    'dev',
    '--docs',
    '--ci',
    '-p',
    String(port),
    '--no-open',
  ]);
  storybook.once('error', error => {
    storybookError = error;
  });
  await waitFor(`${baseUrl}/index.json`);
  const env = { ...process.env, VIEW_ENGINE_E2E_BASE_URL: baseUrl };
  for (const script of [
    'packages/view-engine/scripts/verify-view-host.mjs',
    'packages/view-engine/scripts/verify-http-view-host.mjs',
  ])
    await run(
      script.split('/').at(-1).replace('.mjs', ''),
      process.execPath,
      [script],
      env,
    );
  await stopOwned(storybook);
  await run('storybook-build', pnpm, ['build-storybook'], {
    ...process.env,
    VIEW_ENGINE_ACCEPTANCE: 'true',
  });
  storybook = start('storybook-preview', pnpm, [
    'exec',
    'vite',
    'preview',
    '--host',
    '127.0.0.1',
    '--outDir',
    'storybook-static',
    '--port',
    String(port),
    '--strictPort',
  ]);
  storybook.once('error', error => {
    storybookError = error;
  });
  await waitFor(`${baseUrl}/index.json`);
  for (const browser of readinessBrowsers)
    await run(
      `verify-readiness-${browser}`,
      process.execPath,
      ['packages/view-engine/scripts/verify-readiness.mjs'],
      { ...env, VIEW_ENGINE_BROWSER: browser },
    );
} catch (error) {
  if (!cancellation) {
    console.error(error);
    if (artifacts)
      appendFileSync(
        join(artifacts, 'runner.log'),
        `${error.stack ?? error}\n`,
      );
    process.exitCode = error.exitCode ?? 1;
  }
} finally {
  await stopOwned(activeVerifier);
  await stopOwned(storybook);
}
