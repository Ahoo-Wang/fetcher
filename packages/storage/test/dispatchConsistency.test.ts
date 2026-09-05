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

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const close of cleanup.splice(0)) close();
});

function pair() {
  const channel = `storage-dispatch-${crypto.randomUUID()}`;
  const backing = new InMemoryStorage();
  const buses = [0, 1].map(
    () =>
      new BroadcastTypedEventBus<StorageEvent<number>>({
        delegate: new SerialTypedEventBus(channel),
      }),
  );
  const [sender, receiver] = buses.map(
    eventBus =>
      new KeyStorage<number>({
        key: 'count',
        storage: backing,
        eventBus,
      }),
  );
  const local: StorageEvent<number>[] = [];
  const remote: StorageEvent<number>[] = [];
  sender.addListener({
    name: 'local-events',
    handle: event => {
      local.push(event);
    },
  });
  receiver.addListener({
    name: 'remote-events',
    handle: event => {
      remote.push(event);
    },
  });
  cleanup.push(() => {
    sender.destroy();
    receiver.destroy();
    for (const bus of buses) bus.destroy();
  });
  return { sender, receiver, backing, local, remote };
}

describe('KeyStorage dispatch consistency', () => {
  it.each(['set', 'remove'] as const)(
    'handles rejected broadcast conversion from %s',
    async operation => {
      const failure = new Error('encoder rejected the storage event');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const backing = new InMemoryStorage();
      backing.setItem('count', '1');
      const bus = new BroadcastTypedEventBus<StorageEvent<number>>({
        delegate: new SerialTypedEventBus(
          `storage-rejection-${crypto.randomUUID()}`,
        ),
        messageTransformer: {
          serialize: () => {
            throw failure;
          },
          deserialize: message => message as StorageEvent<number>,
        },
      });
      const storage = new KeyStorage<number>({
        key: 'count',
        storage: backing,
        eventBus: bus,
      });
      cleanup.push(() => {
        storage.destroy();
        bus.destroy();
      });
      const local = vi.fn();
      storage.addListener({ name: 'record-local', handle: local });
      if (operation === 'set') storage.set(2);
      else storage.remove();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(local).toHaveBeenCalledOnce();
      expect(backing.getItem('count')).toBe(operation === 'set' ? '2' : null);
      expect(warn).toHaveBeenCalledWith(
        'Storage event error for count:',
        failure,
      );
    },
  );

  it('uses the current public fields when a retained local event is emitted again', async () => {
    const { sender, receiver, local, remote } = pair();
    sender.set(1);
    await vi.waitFor(() => expect(remote).toHaveLength(1));
    const retained = local[0];
    retained.oldValue = 9;
    retained.newValue = 2;
    await sender.eventBus.emit(retained);
    await vi.waitFor(() => expect(remote).toHaveLength(2));
    expect(local[1]).toEqual({ oldValue: 9, newValue: 2 });
    expect(remote[1]).toEqual(local[1]);
    expect(receiver.get()).toBe(2);
  });

  it.each(['set', 'remove'] as const)(
    'keeps one oldValue for local and remote %s after backing storage drift',
    async operation => {
      const { sender, backing, local, remote } = pair();
      sender.set(1);
      await vi.waitFor(() => expect(remote).toHaveLength(1));
      backing.setItem('count', '2');
      expect(sender.get()).toBe(1);
      if (operation === 'set') sender.set(3);
      else sender.remove();
      await vi.waitFor(() => expect(remote).toHaveLength(2));
      expect(local[1].oldValue).toBe(1);
      expect(remote[1]).toEqual(local[1]);
    },
  );
});
