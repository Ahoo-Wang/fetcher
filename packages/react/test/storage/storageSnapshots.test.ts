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

import { act, renderHook } from '@testing-library/react';
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { useImmerKeyStorage, useKeyStorage } from '../../src';

class Counter {
  #count: number;
  constructor(count: number) {
    this.#count = count;
  }
  get count() {
    return this.#count;
  }
}

interface Cyclic {
  self: Cyclic;
  count: number;
}
function cyclic(count: number): Cyclic {
  // `self` first: a deep comparison reaches the cycle before `count`.
  const value = {} as Cyclic;
  value.self = value;
  value.count = count;
  return value;
}

const storages: KeyStorage<any>[] = [];
function counterStorage(key: string) {
  const storage = new KeyStorage<Counter>({
    key,
    storage: new InMemoryStorage(),
    serializer: {
      serialize: counter => String(counter.count),
      deserialize: raw => new Counter(Number(raw)),
    },
  });
  storages.push(storage);
  return storage;
}
function cyclicStorage(key: string, eventBus?: SerialTypedEventBus<any>) {
  const storage = new KeyStorage<Cyclic>({
    key,
    storage: new InMemoryStorage(),
    eventBus,
    serializer: {
      serialize: value => String(value.count),
      deserialize: raw => cyclic(Number(raw)),
    },
  });
  storages.push(storage);
  return storage;
}
afterEach(() => {
  for (const storage of storages.splice(0)) storage.destroy();
});

describe('values restored by a custom serializer reach the hook (#2010)', () => {
  it('a class with private fields', async () => {
    const storage = counterStorage('counter');
    storage.set(new Counter(1));
    const { result } = renderHook(() => useKeyStorage(storage));
    await act(async () => {
      storage.set(new Counter(2));
    });
    expect(storage.get()?.count).toBe(2);
    expect(result.current[0]?.count).toBe(2);
  });

  it('a cyclic value', async () => {
    const storage = cyclicStorage('cyclic');
    storage.set(cyclic(1));
    const { result } = renderHook(() => useKeyStorage(storage));
    await act(async () => {
      storage.set(cyclic(2));
    });
    expect(result.current[0]?.count).toBe(2);
  });

  it('a cyclic value received from the bus', async () => {
    const bus = new SerialTypedEventBus<any>('cyclic-bus');
    const writer = cyclicStorage('shared-cyclic', bus);
    const reader = new KeyStorage<Cyclic>({
      key: 'shared-cyclic',
      storage: new InMemoryStorage(),
      eventBus: bus,
      serializer: {
        serialize: value => String(value.count),
        deserialize: raw => cyclic(Number(raw)),
      },
    });
    storages.push(reader);
    const { result } = renderHook(() => useKeyStorage(reader));
    await act(async () => {
      writer.set(cyclic(1));
    });
    expect(result.current[0]?.count).toBe(1);
    await act(async () => {
      writer.set(cyclic(3));
    });
    expect(result.current[0]?.count).toBe(3);
  });

  it('a class through useImmerKeyStorage', async () => {
    const storage = counterStorage('immer-counter');
    storage.set(new Counter(1));
    const { result } = renderHook(() =>
      useImmerKeyStorage(storage, new Counter(0)),
    );
    // Immer cannot draft a class with private fields; write it directly.
    await act(async () => {
      storage.set(new Counter(5));
    });
    expect(result.current[0].count).toBe(5);
  });

  it('keeps an inline default stable across renders', () => {
    const storage = new KeyStorage<{ theme: string }>({
      key: 'inline-default',
      storage: new InMemoryStorage(),
    });
    storages.push(storage);
    const { result, rerender } = renderHook(() =>
      useKeyStorage(storage, { theme: 'light' }),
    );
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });
});

describe('an undefined default leaves the value nullable (#2035)', () => {
  type State = { count: number } | undefined;
  function stateStorage(key: string) {
    const storage = new KeyStorage<State>({
      key,
      storage: new InMemoryStorage(),
    });
    storages.push(storage);
    return storage;
  }

  it('useKeyStorage returns null for an empty storage', () => {
    const storage = stateStorage('optional-plain');
    const { result } = renderHook(() => {
      const fallback: State = undefined;
      const [value] = useKeyStorage(storage, fallback);
      return value != null ? value.count : 0;
    });
    expect(result.current).toBe(0);
  });

  it('useImmerKeyStorage passes null to the updater', async () => {
    const storage = stateStorage('optional-immer');
    const { result } = renderHook(() => {
      const fallback: State = undefined;
      return useImmerKeyStorage(storage, fallback);
    });
    expect(result.current[0]).toBeNull();
    await act(async () =>
      result.current[1](draft => {
        if (draft != null) draft.count += 1;
        else return { count: 1 };
      }),
    );
    expect(result.current[0]).toEqual({ count: 1 });
  });
});
