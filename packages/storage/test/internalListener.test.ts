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

import { afterEach, expect, it, vi } from 'vitest';
import {
  nameGenerator,
  SerialTypedEventBus,
  type TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage, KeyStorage, type StorageEvent } from '../src';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
});

// Two copies of the package (its ES module and CommonJS builds, say) each
// count names from zero, so their internal listeners get the same name.
function collidingNames() {
  vi.spyOn(nameGenerator, 'generate')
    .mockReturnValueOnce('KeyStorage_1')
    .mockReturnValueOnce('KeyStorage_1');
}

it('registers its own cache listener when another copy took the name (#2007)', async () => {
  const backend = new InMemoryStorage();
  const bus = new SerialTypedEventBus<StorageEvent<string>>('dual-runtime');
  const options = { key: 'value', storage: backend, eventBus: bus };
  collidingNames();
  const esm = new KeyStorage<string>(options);
  const cjs = new KeyStorage<string>(options);

  esm.set('initial');
  await flush();
  expect(cjs.get()).toBe('initial');
  esm.set('newer');
  await flush();

  const names = bus.handlers.map(handler => handler.name);
  expect(names).toHaveLength(2);
  expect(new Set(names).size).toBe(2);
  expect(esm.get()).toBe('newer');
  expect(cjs.get()).toBe('newer');

  cjs.destroy();
  expect(bus.handlers).toHaveLength(1);
  esm.set('latest');
  await flush();
  expect(esm.get()).toBe('latest');
  esm.destroy();
  expect(bus.handlers).toHaveLength(0);
});

it('removes only its own cache listener on destroy, even when names collide', () => {
  const bus = new SerialTypedEventBus<StorageEvent<string>>('owner');
  vi.spyOn(nameGenerator, 'generate').mockReturnValueOnce('KeyStorage_1');
  const user = { name: 'KeyStorage_1', handle() {} };
  bus.on(user);
  const storage = new KeyStorage<string>({
    key: 'value',
    storage: new InMemoryStorage(),
    eventBus: bus,
  });
  expect(bus.handlers).toHaveLength(2);
  storage.destroy();
  expect(bus.handlers).toEqual([user]);
  storage.destroy();
  expect(bus.handlers).toEqual([user]);
});

it('warns when the bus refuses its cache listener for a reason other than the name', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const bus = new SerialTypedEventBus<StorageEvent<string>>('refusing');
  bus.on = () => false;
  const storage = new KeyStorage<string>({
    key: 'value',
    storage: new InMemoryStorage(),
    eventBus: bus as TypedEventBus<StorageEvent<string>>,
  });
  expect(warn).toHaveBeenCalledOnce();
  const off = vi.spyOn(bus, 'off');
  storage.destroy();
  expect(off).not.toHaveBeenCalled();
});
