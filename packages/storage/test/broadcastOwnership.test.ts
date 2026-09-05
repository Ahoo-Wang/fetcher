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
import type { CrossTabMessageHandler } from '@ahoo-wang/fetcher-eventbus';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

class Counter {
  constructor(public value: number) {}
  read() {
    return this.value;
  }
}
const serializer = {
  serialize: (value: Counter) => String(value.read()),
  deserialize: (raw: string) => new Counter(Number(raw)),
};
function createBus() {
  const messenger = {
    onmessage: () => {},
    postMessage: vi.fn(),
    close() {},
  };
  const bus = new BroadcastTypedEventBus<StorageEvent<Counter>>({
    delegate: new SerialTypedEventBus('ownership'),
    messenger,
  });
  return { bus, messenger };
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

it('installs a codec for a compatible bus from another evaluated package instance', async () => {
  vi.resetModules();
  const other = await import('@ahoo-wang/fetcher-eventbus');
  const bus = new other.BroadcastTypedEventBus<StorageEvent<Counter>>({
    delegate: new other.SerialTypedEventBus('other'),
    messenger: {
      postMessage() {},
      set onmessage(_handler: CrossTabMessageHandler) {},
      close() {},
    },
  });
  expect(bus).not.toBeInstanceOf(BroadcastTypedEventBus);
  const storage = new KeyStorage({
    key: 'k',
    storage: new InMemoryStorage(),
    eventBus: bus,
    serializer,
  });
  expect(bus.messageTransformer).toBeDefined();
  storage.destroy();
  bus.destroy();
});

it.each([false, true])(
  'binds a provided bus to one key (caller codec: %s)',
  callerCodec => {
    const { bus } = createBus();
    if (callerCodec)
      bus.messageTransformer = {
        serialize: value => value,
        deserialize: value => value as StorageEvent<Counter>,
      };
    const first = new KeyStorage({
      key: 'a',
      storage: new InMemoryStorage(),
      eventBus: bus,
      serializer,
    });
    try {
      expect(
        () => new KeyStorage({ key: 'b', eventBus: bus, serializer }),
      ).toThrow('same storage key');
      expect(bus.handlers).toHaveLength(1);
    } finally {
      first.destroy();
      bus.destroy();
    }
  },
);

it('rejects a distinct serializer object even while the first owner is active', () => {
  const { bus } = createBus();
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  try {
    expect(
      () =>
        new KeyStorage({
          key: 'k',
          eventBus: bus,
          serializer: { ...serializer },
        }),
    ).toThrow('same serializer instance');
  } finally {
    first.destroy();
    bus.destroy();
  }
});

it.each(['clear', 'replace'] as const)(
  'does not automatically reacquire a caller-%s codec',
  async change => {
    const { bus, messenger } = createBus();
    const backing = new InMemoryStorage();
    const first = new KeyStorage({
      key: 'k',
      storage: backing,
      eventBus: bus,
      serializer,
    });
    const original = bus.messageTransformer;
    const replacement =
      change === 'clear'
        ? undefined
        : {
            serialize: (event: StorageEvent<Counter>) => [
              'caller',
              event.newValue?.read(),
            ],
            deserialize: (event: unknown) => event as StorageEvent<Counter>,
          };
    bus.messageTransformer = replacement;
    const second = new KeyStorage({
      key: 'k',
      storage: backing,
      eventBus: bus,
      serializer,
    });
    try {
      expect(bus.messageTransformer).toBe(replacement);
      bus.messageTransformer = original;
      first.set(new Counter(1));
      await flush();
      second.set(new Counter(2));
      await flush();
      expect(
        messenger.postMessage.mock.calls.map(
          ([event]) => event.__fetcher_storage_snapshot__.newValue,
        ),
      ).toEqual(['1', '2']);
    } finally {
      first.destroy();
      second.destroy();
      bus.destroy();
    }
  },
);

it('does not take over a cleared caller-preconfigured codec', () => {
  const { bus } = createBus();
  bus.messageTransformer = {
    serialize: value => value,
    deserialize: value => value as StorageEvent<Counter>,
  };
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  bus.messageTransformer = undefined;
  const second = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  expect(bus.messageTransformer).toBeUndefined();
  first.destroy();
  second.destroy();
  bus.destroy();
});

it('encodes current fields when a retained event is dispatched again', async () => {
  const { bus, messenger } = createBus();
  const storage = new KeyStorage({
    key: 'k',
    eventBus: bus,
    storage: new InMemoryStorage(),
    serializer,
  });
  let retained: StorageEvent<Counter> | undefined;
  storage.addListener({
    name: 'retain',
    handle: event => {
      retained = event;
    },
  });
  try {
    storage.set(new Counter(1));
    await flush();
    const event = retained!;
    event.newValue = new Counter(2);
    await bus.emit(event);
    expect(messenger.postMessage.mock.calls[0][0]).toHaveProperty(
      '__fetcher_storage_snapshot__',
    );
    expect(
      messenger.postMessage.mock.calls[1][0].__fetcher_storage_snapshot__
        .newValue,
    ).toBe('2');
    expect(messenger.postMessage.mock.calls[1][0].newValue.read()).toBe(2);
  } finally {
    storage.destroy();
    bus.destroy();
  }
});

it('falls back only for DataCloneError with a complete serialized snapshot', () => {
  const { bus } = createBus();
  const storage = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  const fallback = bus.messageTransformer!.fallbackSerialize!;
  const error = new DOMException('Uncloneable value', 'DataCloneError');
  const snapshot = { newValue: '2', oldValue: '1' };
  try {
    expect(
      fallback(
        { newValue: () => 2, __fetcher_storage_snapshot__: snapshot },
        error,
      ),
    ).toEqual({ __fetcher_storage_snapshot__: snapshot });
    const oldOnly = { newValue: undefined, oldValue: '1' };
    expect(fallback({ __fetcher_storage_snapshot__: oldOnly }, error)).toEqual({
      __fetcher_storage_snapshot__: oldOnly,
    });
    for (const event of [
      { newValue: () => 2 },
      { __fetcher_storage_snapshot__: {} },
      { __fetcher_storage_snapshot__: { newValue: 2 } },
    ]) {
      expect(() => fallback(event, error)).toThrow(error);
    }
    const transportFailure = new Error('Transport closed');
    expect(() =>
      fallback({ __fetcher_storage_snapshot__: snapshot }, transportFailure),
    ).toThrow(transportFailure);
  } finally {
    storage.destroy();
    bus.destroy();
  }
});
