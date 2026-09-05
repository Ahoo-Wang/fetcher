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
import {
  KeyStorage,
  InMemoryStorage,
  jsonSerializer,
  type StorageEvent,
} from '../src';

function createBus() {
  return new BroadcastTypedEventBus<StorageEvent<number>>({
    delegate: new SerialTypedEventBus('modules'),
    messenger: {
      postMessage() {},
      set onmessage(_handler: CrossTabMessageHandler) {},
      close() {},
    },
  });
}
async function otherModule() {
  vi.resetModules();
  return import('../src');
}
const serializer = { serialize: String, deserialize: Number };

it('enforces the key and explicit serializer identity across storage module copies', async () => {
  const other = await otherModule();
  const bus = createBus();
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  try {
    expect(
      () => new other.KeyStorage({ key: 'other', eventBus: bus, serializer }),
    ).toThrow('same storage key');
    expect(
      () =>
        new other.KeyStorage({
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

it('uses the same prepared snapshot table across storage module copies', async () => {
  const other = await otherModule();
  const bus = createBus();
  const codec = { serialize: vi.fn(String), deserialize: Number };
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer: codec });
  const second = new other.KeyStorage({
    key: 'k',
    eventBus: bus,
    serializer: codec,
    storage: new InMemoryStorage(),
  });
  const emitted = vi.spyOn(bus, 'emit');
  try {
    second.set(2);
    await emitted.mock.results[0].value;
    expect(codec.serialize).toHaveBeenCalledTimes(1);
  } finally {
    first.destroy();
    second.destroy();
    bus.destroy();
  }
});

it('reuses only the known default JSON serializer when both copies omit one', async () => {
  const other = await otherModule();
  const bus = createBus();
  const first = new KeyStorage<number>({ key: 'k', eventBus: bus });
  const localSerialize = vi.spyOn(jsonSerializer, 'serialize');
  const otherSerialize = vi.spyOn(other.jsonSerializer, 'serialize');
  const second = new other.KeyStorage<number>({
    key: 'k',
    eventBus: bus,
    storage: new InMemoryStorage(),
  });
  const emitted = vi.spyOn(bus, 'emit');
  try {
    second.set(2);
    await emitted.mock.results[0].value;
    expect(localSerialize).toHaveBeenCalledTimes(1);
    expect(otherSerialize).not.toHaveBeenCalled();
  } finally {
    localSerialize.mockRestore();
    otherSerialize.mockRestore();
    first.destroy();
    second.destroy();
    bus.destroy();
  }
});

it('preserves caller-preconfigured ownership and key restrictions across module copies', async () => {
  const other = await otherModule();
  const bus = createBus();
  bus.messageTransformer = {
    serialize: event => event,
    deserialize: event => event as StorageEvent<number>,
  };
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  bus.messageTransformer = undefined;
  const second = new other.KeyStorage({ key: 'k', eventBus: bus, serializer });
  try {
    expect(bus.messageTransformer).toBeUndefined();
    expect(
      () => new other.KeyStorage({ key: 'other', eventBus: bus, serializer }),
    ).toThrow('same storage key');
  } finally {
    first.destroy();
    second.destroy();
    bus.destroy();
  }
});

it('retains shared automatic state across caller clear and restore in another copy', async () => {
  const other = await otherModule();
  const bus = createBus();
  const codec = { serialize: vi.fn(String), deserialize: Number };
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer: codec });
  const original = bus.messageTransformer;
  bus.messageTransformer = undefined;
  const second = new other.KeyStorage({
    key: 'k',
    eventBus: bus,
    serializer: codec,
    storage: new InMemoryStorage(),
  });
  const emitted = vi.spyOn(bus, 'emit');
  try {
    expect(bus.messageTransformer).toBeUndefined();
    bus.messageTransformer = original;
    second.set(2);
    await emitted.mock.results[0].value;
    expect(codec.serialize).toHaveBeenCalledTimes(1);
  } finally {
    first.destroy();
    second.destroy();
    bus.destroy();
  }
});

it('preserves a frozen caller-configured bus without adding ownership properties', async () => {
  const other = await otherModule();
  const bus = createBus();
  bus.messageTransformer = {
    serialize: event => event,
    deserialize: event => event as StorageEvent<number>,
  };
  Object.freeze(bus);
  const keys = Reflect.ownKeys(bus);
  const first = new KeyStorage({ key: 'k', eventBus: bus, serializer });
  const second = new other.KeyStorage({ key: 'k', eventBus: bus, serializer });
  try {
    expect(Reflect.ownKeys(bus)).toEqual(keys);
    expect(
      () => new other.KeyStorage({ key: 'other', eventBus: bus, serializer }),
    ).toThrow('same storage key');
  } finally {
    first.destroy();
    second.destroy();
    bus.destroy();
  }
});
