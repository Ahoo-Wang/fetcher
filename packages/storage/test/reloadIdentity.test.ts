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

import { describe, expect, it, vi } from 'vitest';
import { InMemoryStorage, KeyStorage, type Serializer } from '../src';

type Value = { count: number };

const versioned: Serializer<string, Value> = {
  serialize(value: Value) {
    return JSON.stringify({ version: 2, count: value.count });
  },
  deserialize(text: string) {
    const value = JSON.parse(text);
    if (
      (value.version !== 1 && value.version !== 2) ||
      typeof value.count !== 'number'
    ) {
      throw new Error('Unsupported persisted format');
    }
    return { count: value.count };
  },
};

function create(serialized: string, serializer?: Serializer<string, Value>) {
  const backend = new InMemoryStorage();
  backend.setItem('value', serialized);
  const store = new KeyStorage<Value>({
    key: 'value',
    storage: backend,
    serializer,
  });
  return { backend, store };
}

describe('reload keeps the cached object for unchanged stored text (#2041)', () => {
  it.each([
    ['default JSON, canonical', '{"count":1}', undefined],
    ['default JSON, whitespace', '{ "count": 1 }', undefined],
    ['custom serializer, current format', '{"version":2,"count":1}', versioned],
    [
      'custom serializer, supported old format',
      '{"version":1,"count":1}',
      versioned,
    ],
  ] as [string, string, Serializer<string, Value> | undefined][])(
    '%s',
    (_label, serialized, serializer) => {
      const { backend, store } = create(serialized, serializer);
      const initial = store.get();
      const reloaded = store.reload();
      const again = store.reload();
      expect(initial).toEqual({ count: 1 });
      expect(reloaded).toBe(initial);
      expect(again).toBe(initial);
      expect(backend.getItem('value')).toBe(serialized);
      store.destroy();
    },
  );

  it('picks up a real change to the stored text', () => {
    const { backend, store } = create('{ "count": 1 }');
    const initial = store.get();
    backend.setItem('value', '{ "count": 2 }');
    const reloaded = store.reload();
    expect(reloaded).not.toBe(initial);
    expect(reloaded).toEqual({ count: 2 });
    expect(store.reload()).toBe(reloaded);
    store.destroy();
  });

  it('replaces a cached object the caller mutated', () => {
    const { store } = create('{ "count": 1 }');
    const initial = store.get()!;
    initial.count = 5;
    const reloaded = store.reload();
    expect(reloaded).not.toBe(initial);
    expect(reloaded).toEqual({ count: 1 });
    store.destroy();
  });

  it('returns the default once the stored value is removed', () => {
    const backend = new InMemoryStorage();
    backend.setItem('value', '{ "count": 1 }');
    const store = new KeyStorage<Value>({
      key: 'value',
      storage: backend,
      defaultValue: { count: 0 },
    });
    store.get();
    backend.removeItem('value');
    expect(store.reload()).toEqual({ count: 0 });
    store.destroy();
  });

  it('removes unreadable stored text that replaced a cached value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { backend, store } = create('{ "count": 1 }');
    store.get();
    backend.setItem('value', '{broken');
    expect(store.reload()).toBeNull();
    expect(backend.getItem('value')).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    store.destroy();
  });

  it('deserializes the stored text once per reload when it changed', () => {
    const serializer = {
      serialize: vi.fn((value: Value) => JSON.stringify(value)),
      deserialize: vi.fn((text: string) => JSON.parse(text) as Value),
    };
    const backend = new InMemoryStorage();
    backend.setItem('value', '{"count":1}');
    const store = new KeyStorage<Value>({
      key: 'value',
      storage: backend,
      serializer,
    });
    store.get();
    backend.setItem('value', '{"count":2}');
    serializer.deserialize.mockClear();
    store.reload();
    expect(serializer.deserialize).toHaveBeenCalledOnce();
    store.destroy();
  });
});
