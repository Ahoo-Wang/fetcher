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
import { randomUUID } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import {
  BroadcastChannelMessenger,
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  type CrossTabMessageHandler,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

it.each([
  ['Date', new Date(0)],
  ['Map', new Map([['one', 1]])],
  ['NaN', NaN],
  ['undefined property', { present: undefined }],
])(
  'keeps native clone semantics for a legacy receiver: %s',
  async (_, value) => {
    const channel = randomUUID();
    const receiver = new BroadcastChannelMessenger(channel);
    const senderBus = new BroadcastTypedEventBus<StorageEvent<unknown>>({
      delegate: new SerialTypedEventBus(channel),
      messenger: new BroadcastChannelMessenger(channel),
    });
    const storage = new KeyStorage({
      key: channel,
      storage: new InMemoryStorage(),
      eventBus: senderBus,
      serializer: { serialize: () => 'snapshot', deserialize: () => value },
    });
    const received = new Promise<StorageEvent<unknown>>(resolve => {
      receiver.onmessage = resolve;
    });
    try {
      storage.set(value);
      const event = await received;
      expect(event.newValue).toStrictEqual(value);
    } finally {
      storage.destroy();
      senderBus.destroy();
      receiver.close();
    }
  },
);

it('retries an uncloneable wire value with only its prepared snapshot', async () => {
  let onmessage: CrossTabMessageHandler | undefined;
  const postMessage = vi.fn((value: unknown) => structuredClone(value));
  const bus = new BroadcastTypedEventBus<
    StorageEvent<{ value: number; method(): number }>
  >({
    delegate: new SerialTypedEventBus('uncloneable'),
    messenger: {
      postMessage,
      close() {},
      set onmessage(handler: CrossTabMessageHandler) {
        onmessage = handler;
      },
    },
  });
  const storage = new KeyStorage({
    key: 'uncloneable',
    storage: new InMemoryStorage(),
    eventBus: bus,
    serializer: {
      serialize: value => String(value.value),
      deserialize: value => ({
        value: Number(value),
        method: () => Number(value),
      }),
    },
  });
  const emitted = vi.spyOn(bus, 'emit');
  const value = {
    value: 1,
    method() {
      return this.value;
    },
  };
  storage.set(value);
  await expect(emitted.mock.results[0].value).resolves.toBeUndefined();
  expect(postMessage).toHaveBeenCalledTimes(2);
  const wire = postMessage.mock.results[1].value;
  expect(Object.keys(wire)).toEqual(['__fetcher_storage_snapshot__']);
  await onmessage?.(wire);
  expect(storage.get()?.method()).toBe(1);
  storage.destroy();
  bus.destroy();
});

it.each(['toJSON', 'getter'] as const)(
  'does not inspect %s before storage and local notification, and preserves native JSON keys',
  async kind => {
    const calls: string[] = [];
    const localCalls: string[][] = [];
    const value = { value: 1 };
    if (kind === 'toJSON') {
      Object.defineProperty(value, 'toJSON', {
        value(key: string) {
          calls.push(key);
          return { value: this.value, key };
        },
      });
    } else {
      Object.defineProperty(value, 'observed', {
        enumerable: true,
        get() {
          calls.push('getter');
          return true;
        },
      });
    }
    const postMessage = vi.fn((message: unknown) =>
      JSON.parse(JSON.stringify(message)),
    );
    const bus = new BroadcastTypedEventBus<StorageEvent<typeof value>>({
      delegate: new SerialTypedEventBus('json'),
      messenger: {
        postMessage,
        close() {},
        set onmessage(_: CrossTabMessageHandler) {},
      },
    });
    const backing = new InMemoryStorage();
    const storage = new KeyStorage({
      key: 'json',
      storage: backing,
      eventBus: bus,
      serializer: {
        serialize: entry => String(entry.value),
        deserialize: raw => ({ value: Number(raw) }),
      },
    });
    const emitted = vi.spyOn(bus, 'emit');
    storage.addListener({
      name: 'local',
      handle() {
        expect(backing.getItem('json')).toBe('1');
        localCalls.push([...calls]);
      },
    });
    storage.set(value);
    await emitted.mock.results[0].value;
    expect(localCalls).toEqual([[]]);
    expect(calls).toEqual([kind === 'toJSON' ? 'newValue' : 'getter']);
    if (kind === 'toJSON')
      expect(postMessage.mock.results[0].value.newValue.key).toBe('newValue');
    storage.destroy();
    bus.destroy();
  },
);

it('only restores legacy values when the serializer explicitly supports them', async () => {
  const make = (deserializeLegacy?: (value: unknown) => number) => {
    let incoming: CrossTabMessageHandler | undefined;
    const bus = new BroadcastTypedEventBus<StorageEvent<number>>({
      delegate: new SerialTypedEventBus('legacy'),
      messenger: {
        postMessage() {},
        close() {},
        set onmessage(handler: CrossTabMessageHandler) {
          incoming = handler;
        },
      },
    });
    const storage = new KeyStorage({
      key: 'legacy',
      storage: new InMemoryStorage(),
      eventBus: bus,
      serializer: { serialize: String, deserialize: Number, deserializeLegacy },
    });
    return { storage, bus, incoming: incoming! };
  };
  const plain = make();
  const hooked = make(value => {
    if (typeof value !== 'object' || !value || !('value' in value))
      throw new TypeError('legacy value');
    return Number(value.value);
  });
  const raw = { value: 2 };
  await plain.incoming({ newValue: raw });
  expect(plain.storage.get()).toBe(raw);
  await hooked.incoming({ newValue: raw, oldValue: 'unsupported' });
  expect(hooked.storage.get()).toBe(2);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await hooked.incoming({ newValue: 'unsupported' });
  expect(hooked.storage.get()).toBe(2);
  expect(warning).toHaveBeenCalledOnce();
  plain.storage.destroy();
  plain.bus.destroy();
  hooked.storage.destroy();
  hooked.bus.destroy();
});

it.each([
  'local',
  'caller transformer',
  'replaced transformer',
  'cleared transformer',
] as const)(
  'does not serialize optional old snapshots for a %s bus',
  async kind => {
    const delegate = new SerialTypedEventBus<StorageEvent<number>>('owned');
    const bus =
      kind === 'local'
        ? delegate
        : new BroadcastTypedEventBus({
            delegate,
            messenger: {
              postMessage() {},
              close() {},
              set onmessage(_: CrossTabMessageHandler) {},
            },
            messageTransformer:
              kind === 'caller transformer'
                ? {
                    serialize: event => event,
                    deserialize: message => message as StorageEvent<number>,
                  }
                : undefined,
          });
    const serialize = vi.fn(String);
    const storage = new KeyStorage({
      key: 'owned',
      eventBus: bus,
      storage: new InMemoryStorage(),
      defaultValue: 1,
      serializer: { serialize, deserialize: Number },
    });
    if (
      bus instanceof BroadcastTypedEventBus &&
      kind === 'replaced transformer'
    ) {
      bus.messageTransformer = {
        serialize: event => event,
        deserialize: message => message as StorageEvent<number>,
      };
    } else if (
      bus instanceof BroadcastTypedEventBus &&
      kind === 'cleared transformer'
    ) {
      bus.messageTransformer = undefined;
    }
    storage.set(2);
    expect(serialize.mock.calls).toEqual([[2]]);
    storage.remove();
    expect(serialize.mock.calls).toEqual([[2]]);
    storage.destroy();
    bus.destroy();
  },
);
