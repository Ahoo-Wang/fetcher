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
import type { CrossTabMessageHandler } from '@ahoo-wang/fetcher-eventbus';
import {
  BroadcastChannelMessenger,
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import {
  InMemoryStorage,
  KeyStorage,
  type Serializer,
  type StorageEvent,
} from '../src';

class Counter {
  constructor(private readonly value: number) {}
  read() {
    return this.value;
  }
}
const serializer: Serializer<string, Counter> = {
  serialize(value: Counter) {
    return String(value.read());
  },
  deserialize(value: string) {
    return new Counter(Number(value));
  },
};

function nextEvent(storage: KeyStorage<Counter>) {
  return new Promise<StorageEvent<Counter>>(resolve => {
    storage.addListener({ name: randomUUID(), once: true, handle: resolve });
  });
}

it('decodes an already posted message for direct subscribers after the last storage owner is destroyed', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  backing.setItem(key, '1');
  const senderMessenger = new BroadcastChannelMessenger(key);
  const create = (messenger = new BroadcastChannelMessenger(key)) => {
    const bus = new BroadcastTypedEventBus<StorageEvent<bigint>>({
      delegate: new SerialTypedEventBus(key),
      messenger,
    });
    const storage = new KeyStorage({
      key,
      storage: backing,
      serializer: { serialize: String, deserialize: BigInt },
      eventBus: bus,
    });
    return { storage, bus };
  };
  const sender = create(senderMessenger);
  const receiver = create();
  const received = new Promise<StorageEvent<bigint>>(resolve => {
    receiver.bus.on({ name: 'direct', once: true, handle: resolve });
  });
  const post = senderMessenger.postMessage.bind(senderMessenger);
  const posted = vi
    .spyOn(senderMessenger, 'postMessage')
    .mockImplementation(message => {
      post(message);
      receiver.storage.destroy();
    });
  try {
    sender.storage.set(2n);
    expect(await received).toEqual({ newValue: 2n, oldValue: 1n });
  } finally {
    posted.mockRestore();
    sender.storage.destroy();
    receiver.storage.destroy();
    sender.bus.destroy();
    receiver.bus.destroy();
  }
});

it('shares snapshots and keeps conversion after the final storage owner is destroyed', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  backing.setItem(key, '1');
  const bus = new BroadcastTypedEventBus<StorageEvent<Counter>>({
    delegate: new SerialTypedEventBus(key),
  });
  const first = new KeyStorage({
    key,
    storage: backing,
    serializer,
    eventBus: bus,
  });
  const second = new KeyStorage({
    key,
    storage: backing,
    serializer,
    eventBus: bus,
  });
  const receiver = new KeyStorage({
    key,
    storage: backing,
    serializer,
    eventBus: new BroadcastTypedEventBus<StorageEvent<Counter>>({
      delegate: new SerialTypedEventBus(key),
    }),
  });
  const transformer = bus.messageTransformer;
  try {
    const changed = nextEvent(receiver);
    second.set(new Counter(2));
    const event = await changed;
    expect(event.newValue).toBeInstanceOf(Counter);
    expect(event.newValue?.read()).toBe(2);
    first.destroy();
    first.destroy();
    expect(bus.messageTransformer).toBeDefined();
    const removed = nextEvent(receiver);
    second.remove();
    const removal = await removed;
    expect(removal.newValue).toBeNull();
    expect(removal.oldValue).toBeInstanceOf(Counter);
    expect(removal.oldValue?.read()).toBe(2);
    second.destroy();
    expect(bus.messageTransformer).toBe(transformer);
  } finally {
    first.destroy();
    second.destroy();
    receiver.destroy();
    bus.destroy();
    receiver.eventBus.destroy();
  }
});

it('rejects a new serializer on an idle bus without losing pending messages', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  const bus = new BroadcastTypedEventBus<StorageEvent<Counter>>({
    delegate: new SerialTypedEventBus(key),
  });
  const first = new KeyStorage({
    key,
    storage: backing,
    eventBus: bus,
    serializer,
  });
  const sender = new BroadcastChannelMessenger(`_broadcast_:${key}`);
  const received = new Promise<StorageEvent<Counter>>(resolve => {
    bus.on({ name: 'direct', once: true, handle: resolve });
  });
  try {
    sender.postMessage({
      __fetcher_storage_snapshot__: { newValue: '2', oldValue: '1' },
    });
    first.destroy();
    expect(
      () =>
        new KeyStorage({
          key,
          storage: backing,
          eventBus: bus,
          serializer: {
            serialize: (value: Counter) => `v2:${value.read()}`,
            deserialize: (raw: string) => {
              if (!raw.startsWith('v2:'))
                throw new Error('Expected v2 counter');
              return new Counter(Number(raw.slice(3)));
            },
          },
        }),
    ).toThrow('same serializer instance');
    const event = await received;
    expect(event.newValue?.read()).toBe(2);
    expect(event.oldValue?.read()).toBe(1);
  } finally {
    first.destroy();
    sender.close();
    bus.destroy();
  }
});

it.each(['set', 'remove'] as const)(
  'finishes an in-flight %s after the storage owner is destroyed',
  async operation => {
    const key = randomUUID();
    const backing = new InMemoryStorage();
    backing.setItem(key, '1');
    const create = () =>
      new KeyStorage({
        key,
        storage: backing,
        serializer,
        eventBus: new BroadcastTypedEventBus<StorageEvent<Counter>>({
          delegate: new SerialTypedEventBus(key),
        }),
      });
    const sender = create();
    const receiver = create();
    try {
      const received = nextEvent(receiver);
      if (operation === 'set') sender.set(new Counter(2));
      else sender.remove();
      sender.destroy();
      const event = await received;
      expect(event.oldValue).toBeInstanceOf(Counter);
      expect(event.oldValue?.read()).toBe(1);
      if (operation === 'set') {
        expect(event.newValue).toBeInstanceOf(Counter);
        expect(event.newValue?.read()).toBe(2);
      } else expect(event.newValue).toBeNull();
    } finally {
      sender.destroy();
      receiver.destroy();
      sender.eventBus.destroy();
      receiver.eventBus.destroy();
    }
  },
);

it.each([
  [null, 7, 9],
  [undefined, 7, 9],
  [undefined, null, 9],
  [null, { count: 7 }, { count: 9 }],
  [undefined, { count: 7 }, { count: 9 }],
])(
  'keeps JSON events readable by new and legacy receivers (missing: %s, default: %j)',
  async (missing, defaultValue, value) => {
    const key = randomUUID();
    const backing = new InMemoryStorage();
    const getItem = backing.getItem.bind(backing);
    Object.defineProperty(backing, 'getItem', {
      value: (name: string) => getItem(name) ?? missing,
    });
    const create = () =>
      new KeyStorage({
        key,
        storage: backing,
        defaultValue,
        eventBus: new BroadcastTypedEventBus<StorageEvent<unknown>>({
          delegate: new SerialTypedEventBus(key),
        }),
      });
    const sender = create();
    const receiver = create();
    // A legacy receiver has no snapshot transformer and reads the standard fields directly.
    const legacy = new BroadcastTypedEventBus<StorageEvent<unknown>>({
      delegate: new SerialTypedEventBus(key),
    });
    let legacyCache: unknown = defaultValue;
    const legacyReceived = new Promise<StorageEvent<unknown>>(resolve => {
      legacy.on({
        name: 'legacy-cache',
        once: true,
        handle: event => {
          legacyCache = event.newValue ?? null;
          resolve(event);
        },
      });
    });
    const received = new Promise<StorageEvent<unknown>>(resolve => {
      receiver.addListener({
        name: 'new-receiver',
        once: true,
        handle: resolve,
      });
    });
    try {
      sender.set(value);
      const [event, oldProtocolEvent] = await Promise.all([
        received,
        legacyReceived,
      ]);
      expect(event).toEqual({ newValue: value, oldValue: defaultValue });
      expect(receiver.get()).toEqual(value);
      expect(legacyCache).toEqual(value);
      expect(oldProtocolEvent.newValue).toEqual(value);
      expect(oldProtocolEvent.oldValue).toEqual(defaultValue);
    } finally {
      sender.destroy();
      receiver.destroy();
      sender.eventBus.destroy();
      receiver.eventBus.destroy();
      legacy.destroy();
    }
  },
);

it('preserves and uses a caller transformer during storage use and after destroy', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  backing.setItem(key, '1');
  const serializedEvents: StorageEvent<Counter>[] = [];
  const transformer = {
    serialize(event: StorageEvent<Counter>) {
      serializedEvents.push(event);
      return JSON.stringify([event.newValue?.read(), event.oldValue?.read()]);
    },
    deserialize(message: unknown): StorageEvent<Counter> {
      const [newValue, oldValue] = JSON.parse(String(message));
      return {
        newValue: new Counter(newValue),
        oldValue: new Counter(oldValue),
      };
    },
  };
  const create = () => {
    const bus = new BroadcastTypedEventBus<StorageEvent<Counter>>({
      delegate: new SerialTypedEventBus(key),
      messageTransformer: transformer,
    });
    const storage = new KeyStorage({
      key,
      storage: backing,
      serializer,
      eventBus: bus,
    });
    return { bus, storage };
  };
  const sender = create();
  const receiver = create();
  try {
    const value = new Counter(2);
    const received = nextEvent(receiver.storage);
    sender.storage.set(value);
    const event = await received;
    expect(serializedEvents).toHaveLength(1);
    expect(serializedEvents[0].newValue).toBe(value);
    expect(Object.keys(serializedEvents[0]).sort()).toEqual([
      'newValue',
      'oldValue',
    ]);
    expect(event.newValue?.read()).toBe(2);
    expect(event.oldValue?.read()).toBe(1);
    for (const side of [sender, receiver]) {
      expect(side.bus.messageTransformer).toBe(transformer);
      side.storage.destroy();
      expect(side.bus.messageTransformer).toBe(transformer);
    }
  } finally {
    sender.storage.destroy();
    receiver.storage.destroy();
    sender.bus.destroy();
    receiver.bus.destroy();
  }
});

it.each([false, true])(
  'retains the automatic transformer and preserves a caller replacement on destroy (replaced: %s)',
  replaced => {
    const bus = new BroadcastTypedEventBus<StorageEvent<number>>({
      delegate: new SerialTypedEventBus(randomUUID()),
    });
    const storage = new KeyStorage({
      key: 'owned-transformer',
      storage: new InMemoryStorage(),
      eventBus: bus,
    });
    const replacement = {
      serialize: (event: StorageEvent<number>) => JSON.stringify(event),
      deserialize: (message: unknown): StorageEvent<number> =>
        JSON.parse(String(message)),
    };
    try {
      const transformer = bus.messageTransformer;
      expect(transformer).toBeDefined();
      if (replaced) bus.messageTransformer = replacement;
      storage.destroy();
      expect(bus.messageTransformer).toBe(replaced ? replacement : transformer);
      if (replaced) {
        const next = new KeyStorage({
          key: 'owned-transformer',
          storage: new InMemoryStorage(),
          eventBus: bus,
        });
        try {
          expect(bus.messageTransformer).toBe(replacement);
        } finally {
          next.destroy();
        }
      }
    } finally {
      storage.destroy();
      bus.destroy();
    }
  },
);

it.each([false, true])(
  'keeps subscriptions on the supplied bus before and after construction (broadcast: %s)',
  async broadcast => {
    const key = randomUUID();
    const backing = new InMemoryStorage();
    backing.setItem(key, '1');
    const create = () => {
      const bus = broadcast
        ? new BroadcastTypedEventBus<StorageEvent<Counter>>({
            delegate: new SerialTypedEventBus(key),
          })
        : new SerialTypedEventBus<StorageEvent<Counter>>(key);
      const events: StorageEvent<Counter>[] = [];
      bus.on({
        name: 'before-construction',
        order: -5,
        handle: event => {
          events.push(event);
        },
      });
      const storage = new KeyStorage({
        key,
        storage: backing,
        serializer,
        eventBus: bus,
      });
      bus.on({
        name: 'after-construction',
        handle: event => {
          events.push(event);
        },
      });
      storage.addListener({
        name: 'storage-listener',
        handle: event => {
          events.push(event);
        },
      });
      return { bus, storage, events };
    };
    const sender = create();
    const receiver = broadcast ? create() : sender;
    const received = nextEvent(receiver.storage);
    try {
      const value = new Counter(2);
      sender.storage.set(value);
      await received;
      expect(sender.events[0].newValue).toBe(value);
      for (const side of new Set([sender, receiver])) {
        expect(side.events).toHaveLength(3);
        for (const event of side.events) {
          expect(Object.keys(event).sort()).toEqual(['newValue', 'oldValue']);
          expect({ ...event }).toEqual({
            newValue: new Counter(2),
            oldValue: new Counter(1),
          });
          expect(JSON.parse(JSON.stringify(event))).toEqual({
            newValue: { value: 2 },
            oldValue: { value: 1 },
          });
          expect(event.newValue).toBe(side.events[0].newValue);
        }
      }
    } finally {
      for (const side of new Set([sender, receiver])) {
        side.storage.destroy();
        side.bus.destroy();
      }
    }
  },
);

it('keeps the cached old value when backing storage becomes unreadable', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  backing.setItem(key, '1');
  const strictSerializer: Serializer<string, Counter> = {
    serialize: serializer.serialize,
    deserialize(raw) {
      if (!/^\d+$/.test(raw)) throw new Error('Invalid stored counter');
      return new Counter(Number(raw));
    },
  };
  const create = () =>
    new KeyStorage({
      key,
      storage: backing,
      serializer: strictSerializer,
      eventBus: new BroadcastTypedEventBus<StorageEvent<Counter>>({
        delegate: new SerialTypedEventBus(key),
      }),
    });
  const sender = create();
  const receiver = create();
  const events: StorageEvent<Counter>[] = [];
  receiver.addListener({
    name: 'valid-new-value',
    handle: event => {
      events.push(event);
    },
  });
  try {
    expect(sender.get()?.read()).toBe(1);
    expect(receiver.get()?.read()).toBe(1);
    backing.setItem(key, 'unreadable');
    const received = nextEvent(receiver);
    sender.set(new Counter(2));
    await received;
    expect(receiver.get()?.read()).toBe(2);
    expect(events).toHaveLength(1);
    expect(events[0].newValue?.read()).toBe(2);
    expect(events[0].oldValue?.read()).toBe(1);
  } finally {
    sender.destroy();
    receiver.destroy();
    sender.eventBus.destroy();
    receiver.eventBus.destroy();
  }
});

it('reports an invalid new snapshot without changing the cache', async () => {
  let receive!: (message: unknown) => void;
  const bus = new BroadcastTypedEventBus<StorageEvent<Counter>>({
    delegate: new SerialTypedEventBus('invalid-new'),
    messenger: {
      postMessage() {},
      set onmessage(handler: CrossTabMessageHandler) {
        receive = handler;
      },
      close() {},
    },
  });
  const backing = new InMemoryStorage();
  backing.setItem('invalid-new', '1');
  const storage = new KeyStorage({
    key: 'invalid-new',
    storage: backing,
    eventBus: bus,
    serializer: {
      serialize: serializer.serialize,
      deserialize(raw: string) {
        if (!/^\d+$/.test(raw)) throw new Error('Invalid current counter');
        return new Counter(Number(raw));
      },
    },
  });
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(storage.get()?.read()).toBe(1);
    await receive({
      __fetcher_storage_snapshot__: { newValue: 'invalid', oldValue: '1' },
    });
    expect(warn).toHaveBeenCalledWith(
      'Broadcast message error for invalid-new:',
      new Error('Invalid current counter'),
    );
    expect(storage.get()?.read()).toBe(1);
  } finally {
    storage.destroy();
    bus.destroy();
    warn.mockRestore();
  }
});

it('restores custom class semantics in cross-tab caches and both listener values', async () => {
  const key = randomUUID();
  const storage = new InMemoryStorage();
  storage.setItem(key, '1');
  const createStorage = () =>
    new KeyStorage<Counter>({
      key,
      storage,
      serializer,
      eventBus: new BroadcastTypedEventBus({
        delegate: new SerialTypedEventBus(key),
      }),
    });
  const a = createStorage();
  const b = createStorage();
  const localEvents: StorageEvent<Counter>[] = [];
  a.addListener({
    name: 'local',
    handle: event => {
      localEvents.push(event);
    },
  });
  try {
    const initial = a.get();
    const value = new Counter(2);
    const received = nextEvent(b);
    a.set(value);
    const event = await received;
    expect(
      [event.newValue, event.oldValue].map(value => value?.constructor),
    ).toEqual([Counter, Counter]);
    expect(event.newValue?.read()).toBe(2);
    expect(event.oldValue?.read()).toBe(1);
    expect(b.get()).toBe(event.newValue);
    expect(a.get()).toBe(value);
    expect(localEvents[0]).toEqual({ newValue: value, oldValue: initial });
    expect(localEvents[0].newValue).toBe(value);
    expect(Object.keys(event).sort()).toEqual(['newValue', 'oldValue']);

    const changedBack = nextEvent(a);
    b.set(new Counter(3));
    const back = await changedBack;
    expect(back.oldValue?.read()).toBe(2);
    expect(back.newValue?.read()).toBe(3);
    expect(a.get()?.read()).toBe(3);

    const removed = nextEvent(b);
    a.remove();
    const removal = await removed;
    expect(removal.newValue).toBeNull();
    expect(removal.oldValue?.read()).toBe(3);
    expect(b.get()).toBeNull();
  } finally {
    a.destroy();
    b.destroy();
    a.eventBus.destroy();
    b.eventBus.destroy();
  }
});

it('continues accepting ordinary events from a custom local bus', async () => {
  const bus = new SerialTypedEventBus<StorageEvent<Counter>>('local');
  const storage = new KeyStorage({
    key: 'local',
    storage: new InMemoryStorage(),
    serializer,
    eventBus: bus,
  });
  const value = new Counter(4);
  const changed = nextEvent(storage);
  await bus.emit({ newValue: value, oldValue: null });
  expect(await changed).toEqual({ newValue: value, oldValue: null });
  expect(storage.get()).toBe(value);
  storage.destroy();
  bus.destroy();
});

it('preserves class listener names and removal when wrapping event delivery', async () => {
  const bus = new SerialTypedEventBus<StorageEvent<Counter>>('listener');
  const storage = new KeyStorage({
    key: 'listener',
    storage: new InMemoryStorage(),
    serializer,
    eventBus: bus,
  });
  class Listener {
    values: number[] = [];
    get name() {
      return 'class-listener';
    }
    handle(event: StorageEvent<Counter>) {
      this.values.push(event.newValue!.read());
    }
  }
  const listener = new Listener();
  const remove = storage.addListener(listener);
  await bus.emit({ newValue: new Counter(1) });
  remove();
  await bus.emit({ newValue: new Counter(2) });
  expect(listener.values).toEqual([1]);
  storage.destroy();
  bus.destroy();
});

it.each([
  ['set', true],
  ['remove', true],
  ['set', false],
  ['remove', false],
] as const)(
  'can %s a readable legacy value that cannot be reserialized (stored: %s)',
  async (operation, stored) => {
    const underlying = new InMemoryStorage();
    if (stored) underlying.setItem('legacy', 'legacy:1');
    const storage = new KeyStorage<string | number>({
      key: 'legacy',
      storage: underlying,
      defaultValue: 'legacy:1',
      serializer: {
        serialize(value) {
          if (typeof value === 'string') throw new Error('legacy is read-only');
          return String(value);
        },
        deserialize(value) {
          return value.startsWith('legacy:') ? value : Number(value);
        },
      },
    });
    const received = new Promise<StorageEvent<string | number>>(resolve => {
      storage.addListener({
        name: 'legacy-update',
        once: true,
        handle: resolve,
      });
    });
    try {
      expect(storage.get()).toBe('legacy:1');
      expect(() =>
        operation === 'set' ? storage.set(2) : storage.remove(),
      ).not.toThrow();
      expect(underlying.getItem('legacy')).toBe(
        operation === 'set' ? '2' : null,
      );
      expect(await received).toEqual({
        oldValue: 'legacy:1',
        newValue: operation === 'set' ? 2 : null,
      });
    } finally {
      storage.destroy();
      storage.eventBus.destroy();
    }
  },
);

it.each(['set', 'remove'] as const)(
  'can %s a cached value when only backing reads fail',
  async operation => {
    const underlying = new InMemoryStorage();
    underlying.setItem('cached', '1');
    const readStored = underlying.getItem.bind(underlying);
    const storage = new KeyStorage<Counter>({
      key: 'cached',
      storage: underlying,
      serializer,
    });
    const uncached = new KeyStorage<Counter>({
      key: 'cached',
      storage: underlying,
      serializer,
    });
    const oldValue = storage.get();
    underlying.getItem = () => {
      throw new Error('backing reads unavailable');
    };
    const received = nextEvent(storage);
    const value = new Counter(2);
    try {
      expect(storage.get()).toBe(oldValue);
      expect(() =>
        operation === 'set' ? storage.set(value) : storage.remove(),
      ).not.toThrow();
      expect(readStored('cached')).toBe(operation === 'set' ? '2' : null);
      const event = await received;
      expect(event.oldValue).toBe(oldValue);
      expect(event.newValue).toBe(operation === 'set' ? value : null);
      expect(() => uncached.get()).toThrow('backing reads unavailable');
    } finally {
      storage.destroy();
      storage.eventBus.destroy();
      uncached.destroy();
      uncached.eventBus.destroy();
    }
  },
);

it('gives direct subscribers standard enumerable local and remote events', async () => {
  const key = randomUUID();
  const underlying = new InMemoryStorage();
  underlying.setItem(key, '1');
  const create = () =>
    new KeyStorage<Counter>({
      key,
      storage: underlying,
      serializer,
      eventBus: new BroadcastTypedEventBus({
        delegate: new SerialTypedEventBus(key),
      }),
    });
  const sender = create();
  const receiver = create();
  const direct = new Promise<StorageEvent<Counter>>(resolve => {
    receiver.eventBus.on({
      name: 'direct',
      order: -1,
      once: true,
      handle: resolve,
    });
  });
  const local = new Promise<StorageEvent<Counter>>(resolve => {
    sender.eventBus.on({ name: 'local-direct', once: true, handle: resolve });
  });
  try {
    const value = new Counter(2);
    sender.set(value);
    const [event, localEvent] = await Promise.all([direct, local]);
    expect(event.newValue?.read()).toBe(2);
    expect(event.oldValue?.read()).toBe(1);
    expect(localEvent.newValue).toBe(value);
    for (const observed of [event, localEvent]) {
      expect(Object.keys(observed).sort()).toEqual(['newValue', 'oldValue']);
      expect({ ...observed }).toEqual({
        newValue: new Counter(2),
        oldValue: new Counter(1),
      });
      expect(JSON.parse(JSON.stringify(observed))).toEqual({
        newValue: { value: 2 },
        oldValue: { value: 1 },
      });
    }
  } finally {
    sender.destroy();
    receiver.destroy();
    sender.eventBus.destroy();
    receiver.eventBus.destroy();
  }
});

it('transfers the sender default as the old value when storage is empty', async () => {
  const key = randomUUID();
  const underlying = new InMemoryStorage();
  const create = (defaultValue: number) =>
    new KeyStorage<number>({
      key,
      storage: underlying,
      defaultValue,
      eventBus: new BroadcastTypedEventBus({
        delegate: new SerialTypedEventBus(key),
      }),
    });
  const sender = create(7);
  const receiver = create(99);
  const received = new Promise<StorageEvent<number>>(resolve => {
    receiver.addListener({ name: 'default', once: true, handle: resolve });
  });
  try {
    sender.set(9);
    expect(await received).toEqual({ oldValue: 7, newValue: 9 });
  } finally {
    sender.destroy();
    receiver.destroy();
    sender.eventBus.destroy();
    receiver.eventBus.destroy();
  }
});

it('preserves class snapshots for both dispatches when a once listener immediately re-emits the event', async () => {
  const key = randomUUID();
  const backing = new InMemoryStorage();
  const create = () =>
    new KeyStorage({
      key,
      storage: backing,
      serializer,
      eventBus: new BroadcastTypedEventBus<StorageEvent<Counter>>({
        delegate: new SerialTypedEventBus(key),
      }),
    });
  const sender = create();
  const receiver = create();
  sender.addListener({
    name: 'forward-once',
    once: true,
    handle: event => sender.eventBus.emit(event),
  });
  const events: StorageEvent<Counter>[] = [];
  const received = new Promise<void>(resolve => {
    receiver.addListener({
      name: 'receive-both',
      handle: event => {
        events.push(event);
        if (events.length === 2) resolve();
      },
    });
  });
  try {
    sender.set(new Counter(2));
    await received;
    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(event.newValue).toBeInstanceOf(Counter);
      expect(event.newValue?.read()).toBe(2);
    }
    expect(receiver.get()).toBeInstanceOf(Counter);
  } finally {
    sender.destroy();
    receiver.destroy();
    sender.eventBus.destroy();
    receiver.eventBus.destroy();
  }
});
