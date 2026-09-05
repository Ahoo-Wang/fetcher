// @vitest-environment jsdom
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
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  StorageMessenger,
  type TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { KeyStorage, type StorageEvent as KeyStorageEvent } from '../src';

it.each(['active', 'shared', 'destroyed'] as const)(
  'transfers BigInt and cyclic values through the real storage fallback (%s owner)',
  async ownership => {
    class Value {
      self = this;
      constructor(readonly count: bigint) {}
    }
    localStorage.clear();
    localStorage.setItem('data', '1');
    const createStorage = (eventBus?: TypedEventBus<KeyStorageEvent<Value>>) =>
      new KeyStorage<Value>({
        key: 'data',
        storage: localStorage,
        serializer: {
          serialize: value => String(value.count),
          deserialize: raw => new Value(BigInt(raw)),
        },
        eventBus:
          eventBus ??
          new BroadcastTypedEventBus({
            delegate: new SerialTypedEventBus<KeyStorageEvent<Value>>('data'),
            messenger: new StorageMessenger({ channelName: 'fallback' }),
          }),
      });
    const first = createStorage();
    const sender =
      ownership === 'shared' ? createStorage(first.eventBus) : first;
    if (ownership === 'shared') first.destroy();
    const receiver = createStorage();
    const emitted = vi.spyOn(sender.eventBus, 'emit');
    const local: KeyStorageEvent<Value>[] = [];
    sender.addListener({
      name: 'local',
      handle: event => {
        local.push(event);
      },
    });
    const received = new Promise<KeyStorageEvent<Value>>(resolve => {
      receiver.addListener({ name: 'remote', once: true, handle: resolve });
    });
    const directlyReceived = new Promise<KeyStorageEvent<Value>>(resolve => {
      receiver.eventBus.on({
        name: 'remote-direct',
        order: -1,
        once: true,
        handle: resolve,
      });
    });
    try {
      const value = new Value(2n);
      sender.set(value);
      if (ownership === 'destroyed') sender.destroy();
      await expect(emitted.mock.results[0].value).resolves.toBeUndefined();
      expect(local[0].newValue).toBe(value);
      const key = Array.from({ length: localStorage.length }, (_, index) =>
        localStorage.key(index)!,
      ).find(key => key !== 'data')!;
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          storageArea: localStorage,
          newValue: localStorage.getItem(key),
        }),
      );
      const [event, directEvent] = await Promise.all([
        received,
        directlyReceived,
      ]);
      expect(event.newValue?.count).toBe(2n);
      expect(event.oldValue?.count).toBe(1n);
      expect(event.newValue?.self).toBe(event.newValue);
      expect(receiver.get()).toBe(event.newValue);
      expect(Object.keys(directEvent).sort()).toEqual(['newValue', 'oldValue']);
      expect(directEvent.newValue).toBe(event.newValue);
      expect(directEvent.oldValue).toBe(event.oldValue);
    } finally {
      first.destroy();
      sender.destroy();
      receiver.destroy();
      sender.eventBus.destroy();
      receiver.eventBus.destroy();
      localStorage.clear();
    }
  },
);
