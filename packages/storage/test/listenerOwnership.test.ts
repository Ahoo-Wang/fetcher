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
import { expect, it, vi } from 'vitest';
import { InMemoryStorage, KeyStorage } from '../src';

it('does not let a duplicate-name remover remove the listener that holds the name', async () => {
  const storage = new KeyStorage<string>({
    key: 'duplicate',
    storage: new InMemoryStorage(),
  });
  const first = vi.fn();
  const second = vi.fn();
  storage.addListener({ name: 'listener', handle: first });
  const removeSecond = storage.addListener({
    name: 'listener',
    handle: second,
  });
  removeSecond();
  storage.set('value');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(first).toHaveBeenCalledOnce();
  expect(second).not.toHaveBeenCalled();
  storage.destroy();
});

it('does not let a stale remover remove a later listener with the same name', () => {
  const storage = new KeyStorage<string>({
    key: 'stale',
    storage: new InMemoryStorage(),
  });
  const removeFirst = storage.addListener({ name: 'listener', handle() {} });
  removeFirst();
  const later = { name: 'listener', handle() {} };
  storage.addListener(later);
  removeFirst();
  expect(storage.eventBus.handlers).toContain(later);
  storage.destroy();
});

it('never moves the cache back to an older value behind a slow listener', async () => {
  const storage = new KeyStorage<string>({
    key: 'ordered',
    storage: new InMemoryStorage(),
  });
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  storage.addListener({
    name: 'slow',
    order: -1,
    handle: event => (event.newValue === 'older' ? gate : undefined),
  });
  storage.set('older');
  storage.set('newer');
  expect(storage.get()).toBe('newer');
  release();
  await gate;
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(storage.get()).toBe('newer');
  storage.destroy();
});
