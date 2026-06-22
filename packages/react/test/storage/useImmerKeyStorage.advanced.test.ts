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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImmerKeyStorage } from '../../src';
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// Split from useImmerKeyStorage.test.ts — error handling, concurrent ops,
// type safety, and edge cases. Core behavior (without/with default, function
// stability) remains in useImmerKeyStorage.test.ts.

describe('useImmerKeyStorage — error handling', () => {
  let storage: InMemoryStorage;
  let keyStorage: KeyStorage<{ count: number; items: string[] }>;

  beforeEach(() => {
    storage = new InMemoryStorage();
    keyStorage = new KeyStorage({ key: 'test-key', storage });
  });
  afterEach(() => {
    storage.clear();
    keyStorage.destroy();
  });

  it('should propagate errors from updater function', () => {
    const { result } = renderHook(() => useImmerKeyStorage(keyStorage));
    expect(() => {
      act(() => {
        result.current[1](() => {
          throw new Error('Updater error');
        });
      });
    }).toThrow('Updater error');
  });

  it('should propagate errors from draft modification', () => {
    keyStorage.set({ count: 0, items: [] });
    const { result } = renderHook(() => useImmerKeyStorage(keyStorage));
    expect(() => {
      act(() => {
        result.current[1](draft => {
          if (draft) throw new Error('Draft modification error');
        });
      });
    }).toThrow('Draft modification error');
  });

  it('should handle errors when removing via null return', () => {
    const errorStorage = Object.assign(new InMemoryStorage(), {
      removeItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage remove error');
      }),
    });
    const errorKeyStorage = new KeyStorage<{ count: number; items: string[] }>({
      key: 'error-key',
      storage: errorStorage,
    });
    errorKeyStorage.set({ count: 1, items: [] });
    const { result } = renderHook(() => useImmerKeyStorage(errorKeyStorage));
    expect(() => {
      act(() => {
        result.current[1](() => null);
      });
    }).toThrow('Storage remove error');
    errorKeyStorage.destroy();
  });
});

describe('useImmerKeyStorage — concurrent operations', () => {
  let storage: InMemoryStorage;
  let keyStorage: KeyStorage<{ count: number; items: string[] }>;

  beforeEach(() => {
    storage = new InMemoryStorage();
    keyStorage = new KeyStorage({ key: 'test-key', storage });
  });
  afterEach(() => {
    storage.clear();
    keyStorage.destroy();
  });

  it('should handle updates from external sources', async () => {
    const { result } = renderHook(() => useImmerKeyStorage(keyStorage));
    act(() => {
      keyStorage.set({ count: 100, items: ['external'] });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 100, items: ['external'] });
    });
  });

  it('should handle mixed immer and direct storage updates', async () => {
    const { result } = renderHook(() => useImmerKeyStorage(keyStorage));
    act(() => {
      result.current[1](() => ({ count: 5, items: [] }));
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 5, items: [] });
    });
    act(() => {
      keyStorage.set({ count: 10, items: ['direct'] });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 10, items: ['direct'] });
    });
  });
});

describe('useImmerKeyStorage — type safety', () => {
  let storage: InMemoryStorage;
  beforeEach(() => {
    storage = new InMemoryStorage();
  });
  afterEach(() => {
    storage.clear();
  });

  it('should work with union types', async () => {
    const unionStorage = new KeyStorage<
      { type: 'string'; value: string } | { type: 'number'; value: number }
    >({ key: 'union-key', storage });
    const { result } = renderHook(() => useImmerKeyStorage(unionStorage));
    act(() => {
      result.current[1](() => ({ type: 'string', value: 'test' }));
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ type: 'string', value: 'test' });
    });
    act(() => {
      result.current[1](draft => {
        if (draft && draft.type === 'string') draft.value = 'updated';
      });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ type: 'string', value: 'updated' });
    });
    unionStorage.destroy();
  });

  it('should work with optional properties', async () => {
    type OptionalObj = {
      required: string;
      optional?: number;
      nested?: { prop: string };
    };
    const optionalStorage = new KeyStorage<OptionalObj>({
      key: 'optional-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(optionalStorage));
    act(() => {
      result.current[1](() => ({ required: 'test' }));
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ required: 'test' });
    });
    act(() => {
      result.current[1](draft => {
        if (draft) {
          draft.optional = 42;
          draft.nested = { prop: 'added' };
        }
      });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({
        required: 'test',
        optional: 42,
        nested: { prop: 'added' },
      });
    });
    optionalStorage.destroy();
  });

  it('should handle readonly properties correctly', async () => {
    type ReadonlyObj = { readonly id: string; mutable: number };
    const readonlyStorage = new KeyStorage<ReadonlyObj>({
      key: 'readonly-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(readonlyStorage));
    act(() => {
      result.current[1](() => ({ id: 'fixed', mutable: 0 }));
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ id: 'fixed', mutable: 0 });
    });
    act(() => {
      result.current[1](draft => {
        if (draft) draft.mutable = 10;
      });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ id: 'fixed', mutable: 10 });
    });
    readonlyStorage.destroy();
  });
});

describe('useImmerKeyStorage — edge cases', () => {
  let storage: InMemoryStorage;
  beforeEach(() => {
    storage = new InMemoryStorage();
  });
  afterEach(() => {
    storage.clear();
  });

  it('should handle empty objects', async () => {
    const emptyStorage = new KeyStorage<Record<string, never>>({
      key: 'empty-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(emptyStorage));
    act(() => {
      result.current[1](() => ({}));
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({});
    });
    act(() => {
      result.current[1](draft => {
        if (draft) (draft as any).newProp = 'value';
      });
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual({ newProp: 'value' });
    });
    emptyStorage.destroy();
  });

  it('should handle large objects', async () => {
    const largeObj = {
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item${i}`,
      })),
      metadata: { total: 1000, page: 1 },
    };
    const largeStorage = new KeyStorage<typeof largeObj>({
      key: 'large-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(largeStorage));
    act(() => {
      result.current[1](() => largeObj);
    });
    await waitFor(() => {
      expect(result.current[0]).toEqual(largeObj);
    });
    act(() => {
      result.current[1](draft => {
        if (draft) {
          draft.metadata.page = 2;
          draft.data[0].value = 'updated';
        }
      });
    });
    await waitFor(() => {
      expect(result.current[0]!.metadata.page).toBe(2);
      expect(result.current[0]!.data[0].value).toBe('updated');
    });
    largeStorage.destroy();
  });

  it('should handle function properties', async () => {
    type WithFunction = { data: string; callback: () => string };
    const functionStorage = new KeyStorage<WithFunction>({
      key: 'function-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(functionStorage));
    const objWithFunction = { data: 'test', callback: () => 'callback result' };
    act(() => {
      result.current[1](() => objWithFunction);
    });
    await waitFor(() => {
      expect(result.current[0]!.data).toBe('test');
      expect(typeof result.current[0]!.callback).toBe('function');
      expect(result.current[0]!.callback()).toBe('callback result');
    });
    act(() => {
      result.current[1](draft => {
        if (draft) draft.data = 'updated';
      });
    });
    await waitFor(() => {
      expect(result.current[0]!.data).toBe('updated');
      expect(result.current[0]!.callback()).toBe('callback result');
    });
    functionStorage.destroy();
  });

  it('should handle Date objects', async () => {
    type WithDate = { timestamp: Date; data: string };
    const dateStorage = new KeyStorage<WithDate>({
      key: 'date-key',
      storage,
    });
    const { result } = renderHook(() => useImmerKeyStorage(dateStorage));
    const now = new Date();
    act(() => {
      result.current[1](() => ({ timestamp: now, data: 'test' }));
    });
    await waitFor(() => {
      expect(result.current[0]!.timestamp).toEqual(now);
    });
    act(() => {
      result.current[1](draft => {
        if (draft) {
          draft.timestamp = new Date(draft.timestamp.getTime() + 1000);
          draft.data = 'updated';
        }
      });
    });
    await waitFor(() => {
      expect(result.current[0]!.timestamp.getTime()).toBe(now.getTime() + 1000);
      expect(result.current[0]!.data).toBe('updated');
    });
    dateStorage.destroy();
  });
});
