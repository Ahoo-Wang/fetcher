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

import { afterEach, describe, expect, it } from 'vitest';
import {
  BroadcastTypedEventBus,
  ParallelTypedEventBus,
  SerialTypedEventBus,
  type TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const close of cleanup.splice(0).reverse()) close();
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

async function until(predicate: () => boolean) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for broadcast');
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
}

function storage<T>(
  backend: Storage,
  eventBus: TypedEventBus<StorageEvent<T>>,
): KeyStorage<T> {
  const instance = new KeyStorage<T>({
    key: 'value',
    storage: backend,
    eventBus,
  });
  cleanup.push(() => instance.destroy());
  return instance;
}

function broadcastBus<T>(channel: string) {
  const bus = new BroadcastTypedEventBus<StorageEvent<T>>({
    delegate: new SerialTypedEventBus(channel),
  });
  cleanup.push(() => bus.destroy());
  return bus;
}

describe('remote caches behind a slow sender listener (#1994)', () => {
  function tabs() {
    const backend = new InMemoryStorage();
    const channel = `storage-order-${crypto.randomUUID()}`;
    const sender = storage<string>(backend, broadcastBus(channel));
    const receiver = storage<string>(backend, broadcastBus(channel));
    const received: (string | null | undefined)[] = [];
    receiver.addListener({
      name: 'observe',
      handle: event => {
        received.push(event.newValue);
      },
    });
    return { backend, channel, sender, receiver, received };
  }

  it('keeps the newer value when an older change arrives last', async () => {
    const { backend, sender, receiver, received } = tabs();
    const slow = gate();
    sender.addListener({
      name: 'async-work',
      handle: event => (event.newValue === 'older' ? slow.promise : undefined),
    });

    sender.set('older');
    sender.set('newer');
    await until(() => received.includes('newer'));
    slow.release();
    await until(() => received.includes('older'));

    expect(received).toEqual(['newer', 'older']);
    expect(backend.getItem('value')).toBe('"newer"');
    expect(sender.get()).toBe('newer');
    expect(receiver.get()).toBe('newer');
  });

  it('keeps the removal when an older set arrives after it', async () => {
    const { backend, sender, receiver, received } = tabs();
    const slow = gate();
    sender.addListener({
      name: 'async-work',
      handle: event => (event.newValue === 'older' ? slow.promise : undefined),
    });

    sender.set('older');
    sender.remove();
    await until(() => received.includes(null));
    slow.release();
    await until(() => received.includes('older'));

    expect(backend.getItem('value')).toBeNull();
    expect(receiver.get()).toBeNull();
  });

  it('keeps the value a listener set while re-entering', async () => {
    const { backend, sender, receiver, received } = tabs();
    const slow = gate();
    sender.addListener({
      name: 'normalize',
      handle: event => {
        if (event.newValue === 'draft') {
          sender.set('final');
          return slow.promise;
        }
      },
    });

    sender.set('draft');
    await until(() => received.includes('final'));
    slow.release();
    await until(() => received.includes('draft'));

    expect(received).toEqual(['final', 'draft']);
    expect(backend.getItem('value')).toBe('"final"');
    expect(sender.get()).toBe('final');
    expect(receiver.get()).toBe('final');
  });

  it('converges on the last write when several writers interleave', async () => {
    const { backend, channel, sender, receiver, received } = tabs();
    const other = storage<string>(backend, broadcastBus(channel));
    const slow = gate();
    sender.addListener({
      name: 'async-work',
      handle: event => (event.newValue === 'a1' ? slow.promise : undefined),
    });
    const otherSlow = gate();
    other.addListener({
      name: 'async-work',
      handle: event =>
        event.newValue === 'b1' ? otherSlow.promise : undefined,
    });

    sender.set('a1');
    other.set('b1');
    sender.set('a2');
    other.set('b2');
    await until(() => received.includes('a2') && received.includes('b2'));
    slow.release();
    otherSlow.release();
    await until(() => received.includes('a1') && received.includes('b1'));
    await flush();

    expect(backend.getItem('value')).toBe('"b2"');
    expect(receiver.get()).toBe('b2');
    expect(sender.get()).toBe('b2');
    expect(other.get()).toBe('b2');
  });

  it('keeps a slow remote change from overwriting a later write by another tab', async () => {
    const { backend, channel, sender, receiver, received } = tabs();
    const other = storage<string>(backend, broadcastBus(channel));
    const slow = gate();
    sender.addListener({
      name: 'async-work',
      handle: event => (event.newValue === 'first' ? slow.promise : undefined),
    });

    sender.set('first');
    await flush();
    other.set('second');
    await until(() => received.includes('second'));
    slow.release();
    await until(() => received.includes('first'));
    await flush();

    expect(backend.getItem('value')).toBe('"second"');
    expect(receiver.get()).toBe('second');
    expect(other.get()).toBe('second');
  });
});

describe('caches sharing a bus whose handlers ignore order (#2029)', () => {
  type Kind = 'serial' | 'parallel';
  function bus(kind: Kind) {
    return kind === 'parallel'
      ? new ParallelTypedEventBus<StorageEvent<number>>('count')
      : new SerialTypedEventBus<StorageEvent<number>>('count');
  }

  it.each([
    ['serial', true],
    ['parallel', true],
    ['serial', false],
    ['parallel', false],
  ] as [Kind, boolean][])(
    'agrees after a listener re-enters set (%s bus, listener before second instance: %s)',
    async (kind, listenerBeforeSecond) => {
      const backend = new InMemoryStorage();
      const eventBus = bus(kind);
      const first = storage<number>(backend, eventBus);
      const subscribe = () =>
        first.addListener({
          name: 'clamp-to-zero',
          handle: event => {
            if (typeof event.newValue === 'number' && event.newValue < 0) {
              first.set(0);
            }
          },
        });
      if (listenerBeforeSecond) subscribe();
      const second = storage<number>(backend, eventBus);
      if (!listenerBeforeSecond) subscribe();

      first.set(-1);
      await flush();

      expect(backend.getItem('value')).toBe('0');
      expect(first.get()).toBe(0);
      expect(second.get()).toBe(0);
    },
  );

  it('agrees after a listener re-enters remove on a parallel bus', async () => {
    const backend = new InMemoryStorage();
    const eventBus = bus('parallel');
    const first = storage<number>(backend, eventBus);
    first.addListener({
      name: 'drop-negative',
      handle: event => {
        if (typeof event.newValue === 'number' && event.newValue < 0) {
          first.remove();
        }
      },
    });
    const second = storage<number>(backend, eventBus);

    first.set(-1);
    await flush();

    expect(backend.getItem('value')).toBeNull();
    expect(first.get()).toBeNull();
    expect(second.get()).toBeNull();
  });

  it('agrees across three instances when the second one re-enters', async () => {
    const backend = new InMemoryStorage();
    const eventBus = bus('parallel');
    const first = storage<number>(backend, eventBus);
    const second = storage<number>(backend, eventBus);
    second.addListener({
      name: 'clamp-to-zero',
      handle: event => {
        if (typeof event.newValue === 'number' && event.newValue < 0) {
          second.set(0);
        }
      },
    });
    const third = storage<number>(backend, eventBus);

    first.set(-1);
    await flush();

    expect([first.get(), second.get(), third.get()]).toEqual([0, 0, 0]);
  });

  it('still applies events emitted straight to the bus', async () => {
    const backend = new InMemoryStorage();
    const eventBus = bus('serial');
    const first = storage<number>(backend, eventBus);
    first.set(1);
    await eventBus.emit({ newValue: 2, oldValue: 1 });
    expect(first.get()).toBe(2);
  });
});
