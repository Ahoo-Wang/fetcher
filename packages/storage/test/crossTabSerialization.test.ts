/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 */
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import {
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
