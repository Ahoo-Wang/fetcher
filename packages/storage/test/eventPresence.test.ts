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
import { expect, it } from 'vitest';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  type CrossTabMessageHandler,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

it.each([
  { newValue: 1 },
  { oldValue: 1 },
  { newValue: undefined },
  { oldValue: undefined },
])(
  'preserves own optional fields through BroadcastChannel: %j',
  async event => {
    const channel = randomUUID();
    const sender = new BroadcastTypedEventBus<StorageEvent<number>>({
      delegate: new SerialTypedEventBus(channel),
    });
    const receiver = new BroadcastTypedEventBus<StorageEvent<number>>({
      delegate: new SerialTypedEventBus(channel),
    });
    const stores = [sender, receiver].map(
      eventBus =>
        new KeyStorage({
          key: channel,
          storage: new InMemoryStorage(),
          eventBus,
        }),
    );
    const received = new Promise<StorageEvent<number>>(resolve =>
      receiver.on({ name: 'remote', once: true, handle: resolve }),
    );
    try {
      await sender.emit(event);
      expect(await received).toStrictEqual(event);
    } finally {
      stores.forEach(storage => storage.destroy());
      sender.destroy();
      receiver.destroy();
    }
  },
);

it('keeps native JSON omission while legacy old-value decode failures stay explicit', () => {
  const bus = new BroadcastTypedEventBus<StorageEvent<number>>({
    delegate: new SerialTypedEventBus(randomUUID()),
    messenger: {
      postMessage() {},
      close() {},
      set onmessage(_: CrossTabMessageHandler) {},
    },
  });
  const storage = new KeyStorage({
    key: 'json',
    eventBus: bus,
    storage: new InMemoryStorage(),
    serializer: {
      serialize: String,
      deserialize(raw) {
        if (raw === 'invalid') throw new Error('invalid old');
        return Number(raw);
      },
    },
  });
  const codec = bus.messageTransformer!;
  try {
    const event = { newValue: undefined, oldValue: 1 };
    const wire = JSON.parse(JSON.stringify(codec.serialize(event)));
    expect(codec.deserialize(wire)).toStrictEqual(
      JSON.parse(JSON.stringify(event)),
    );
    expect(
      codec.deserialize({
        __fetcher_storage_snapshot__: { newValue: '2', oldValue: 'invalid' },
      }),
    ).toStrictEqual({ newValue: 2, oldValue: undefined });
  } finally {
    storage.destroy();
    bus.destroy();
  }
});

it('allows old-only clone fallback and rejects an empty fabricated snapshot', async () => {
  class Value {
    method = () => this.value;
    constructor(readonly value: number) {}
  }
  const posts: unknown[] = [];
  const bus = new BroadcastTypedEventBus<StorageEvent<Value>>({
    delegate: new SerialTypedEventBus(randomUUID()),
    messenger: {
      postMessage(message: unknown) {
        posts.push(structuredClone(message));
      },
      close() {},
      set onmessage(_: CrossTabMessageHandler) {},
    },
  });
  const storage = new KeyStorage({
    key: 'fallback',
    eventBus: bus,
    storage: new InMemoryStorage(),
    serializer: {
      serialize: value => String(value.value),
      deserialize: raw => new Value(Number(raw)),
    },
  });
  try {
    await bus.emit({ oldValue: new Value(3) });
    const received = bus.messageTransformer!.deserialize(posts[0]);
    expect(Object.keys(received)).toEqual(['oldValue']);
    expect(received.oldValue?.method()).toBe(3);
    const error = new DOMException('uncloneable', 'DataCloneError');
    expect(() =>
      bus.messageTransformer!.fallbackSerialize!(
        { __fetcher_storage_snapshot__: {} },
        error,
      ),
    ).toThrow(error);
  } finally {
    storage.destroy();
    bus.destroy();
  }
});
