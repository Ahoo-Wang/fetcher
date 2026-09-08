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
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const stopping = new WeakMap();
const closed = Symbol('closed');

export const spawnOwned = (command, args, options) => {
  const child = spawn(command, args, {
    ...options,
    detached: process.platform !== 'win32',
  });
  child.once('close', () => {
    child[closed] = true;
  });
  return child;
};

export function stopOwned(child, timeout = 5_000) {
  if (!child || !child.pid || (process.platform === 'win32' && child[closed]))
    return Promise.resolve();
  if (stopping.has(child)) return stopping.get(child);
  const stopped = (async () => {
    if (process.platform === 'win32') {
      const exited = new Promise(resolve => child.once('close', resolve));
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f']);
      await Promise.race([
        new Promise(resolve => killer.once('close', resolve)),
        delay(timeout).then(() => killer.kill()),
      ]);
      await Promise.race([exited, delay(timeout)]);
      return;
    }
    const groupExists = () => {
      try {
        process.kill(-child.pid, 0);
        return true;
      } catch (error) {
        if (error.code === 'ESRCH') return false;
        if (error.code === 'EPERM') return true;
        throw error;
      }
    };
    const waitForGroup = async duration => {
      const deadline = Date.now() + duration;
      while (groupExists() && Date.now() < deadline) await delay(25);
      return !groupExists();
    };
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH' && error.code !== 'EPERM') throw error;
      return;
    }
    if (!(await waitForGroup(timeout))) {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH' && error.code !== 'EPERM') throw error;
      }
      await waitForGroup(1_000);
    }
  })();
  const tracked = stopped.finally(() => stopping.delete(child));
  stopping.set(child, tracked);
  return tracked;
}
