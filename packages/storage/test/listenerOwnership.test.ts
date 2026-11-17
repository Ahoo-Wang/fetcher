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
import { describe, expect, it, vi } from 'vitest';
import {
  type EventHandler,
  ParallelTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

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

describe('a handler object registered again (#2049)', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  it.each([
    ['serial', () => new SerialTypedEventBus<StorageEvent<string>>('reuse')],
    [
      'parallel',
      () => new ParallelTypedEventBus<StorageEvent<string>>('reuse'),
    ],
  ])(
    'keeps the new registration when the once remover runs late (%s bus)',
    async (_kind, createBus) => {
      const storage = new KeyStorage<string>({
        key: 'value',
        storage: new InMemoryStorage(),
        eventBus: createBus(),
      });
      const received: (string | null | undefined)[] = [];
      const handler: EventHandler<StorageEvent<string>> = {
        name: 'view',
        once: true,
        handle: event => {
          received.push(event.newValue);
        },
      };
      const removeOld = storage.addListener(handler);
      storage.set('first');
      await flush();

      const removeNew = storage.addListener(handler);
      removeOld();
      expect(storage.eventBus.handlers).toContain(handler);

      storage.set('second');
      await flush();
      expect(received).toEqual(['first', 'second']);
      removeNew();
      storage.destroy();
    },
  );

  it('keeps the new registration when the old one was removed explicitly', () => {
    const storage = new KeyStorage<string>({
      key: 'value',
      storage: new InMemoryStorage(),
    });
    const handler = { name: 'view', handle() {} };
    const removeOld = storage.addListener(handler);
    removeOld();
    const removeNew = storage.addListener(handler);
    removeOld();
    expect(storage.eventBus.handlers).toContain(handler);
    removeNew();
    expect(storage.eventBus.handlers).not.toContain(handler);
    storage.destroy();
  });

  it('keeps a registration made through another instance on the same bus', () => {
    const eventBus = new SerialTypedEventBus<StorageEvent<string>>('shared');
    const backend = new InMemoryStorage();
    const first = new KeyStorage<string>({
      key: 'value',
      storage: backend,
      eventBus,
    });
    const second = new KeyStorage<string>({
      key: 'value',
      storage: backend,
      eventBus,
    });
    const handler = { name: 'view', handle() {} };
    const removeOld = first.addListener(handler);
    removeOld();
    second.addListener(handler);
    removeOld();
    expect(eventBus.handlers).toContain(handler);
    first.destroy();
    second.destroy();
  });

  it('still removes the current registration through its own remover', () => {
    const storage = new KeyStorage<string>({
      key: 'value',
      storage: new InMemoryStorage(),
    });
    const handler = { name: 'view', handle() {} };
    const remove = storage.addListener(handler);
    remove();
    expect(storage.eventBus.handlers).not.toContain(handler);
    storage.destroy();
  });
});
