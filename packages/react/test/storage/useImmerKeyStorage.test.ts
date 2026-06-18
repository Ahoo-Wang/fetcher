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

// Core behavior tests. Error handling, concurrent ops, type safety, and edge
// cases are in useImmerKeyStorage.advanced.test.ts.

describe('useImmerKeyStorage', () => {
  let storage: InMemoryStorage;
  let keyStorage: KeyStorage<{ count: number; items: string[] }>;

  beforeEach(() => {
    storage = new InMemoryStorage();
    keyStorage = new KeyStorage<{ count: number; items: string[] }>({
      key: 'test-key',
      storage: storage,
    });
  });

  afterEach(() => {
    storage.clear();
    keyStorage.destroy();
  });

  describe('without default value', () => {
    it('should return initial value as null when no value is set', () => {
      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      expect(result.current[0]).toBeNull();
    });

    it('should return the current value from storage', () => {
      const initialValue = { count: 5, items: ['a', 'b'] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      expect(result.current[0]).toEqual(initialValue);
    });

    it('should update the value by modifying draft', async () => {
      const initialValue = { count: 0, items: [] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.count = 10;
            draft.items.push('new-item');
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 10, items: ['new-item'] });
      });
    });

    it('should update the value by returning new value', async () => {
      const initialValue = { count: 0, items: [] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      act(() => {
        result.current[1](draft => ({
          count: draft!.count + 1,
          items: [...draft!.items, 'added'],
        }));
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 1, items: ['added'] });
      });
    });

    it('should remove the value when updater returns null', async () => {
      const initialValue = { count: 5, items: ['a'] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      act(() => {
        result.current[1](() => null);
      });

      await waitFor(() => {
        expect(result.current[0]).toBeNull();
      });
    });

    it('should handle void return from updater (no changes)', async () => {
      const initialValue = { count: 5, items: ['a'] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.count += 1;
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 6, items: ['a'] });
      });
    });

    it('should sync between multiple hooks using the same KeyStorage', async () => {
      const { result: result1 } = renderHook(() =>
        useImmerKeyStorage(keyStorage),
      );
      const { result: result2 } = renderHook(() =>
        useImmerKeyStorage(keyStorage),
      );

      act(() => {
        result1.current[1](() => ({ count: 42, items: [] }));
      });

      await waitFor(() => {
        expect(result1.current[0]).toEqual({ count: 42, items: [] });
        expect(result2.current[0]).toEqual({ count: 42, items: [] });
      });
    });

    it('should handle complex nested objects', async () => {
      const nestedStorage = new KeyStorage<{
        user: {
          name: string;
          settings: { theme: string; notifications: boolean };
        };
        data: number[];
      }>({
        key: 'nested-key',
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(nestedStorage));

      const initialValue = {
        user: {
          name: 'John',
          settings: { theme: 'dark', notifications: true },
        },
        data: [1, 2, 3],
      };

      act(() => {
        result.current[1](() => initialValue);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(initialValue);
      });

      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.user.settings.theme = 'light';
            draft.data.push(4);
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({
          user: {
            name: 'John',
            settings: { theme: 'light', notifications: true },
          },
          data: [1, 2, 3, 4],
        });
      });

      nestedStorage.destroy();
    });

    it('should handle array operations', async () => {
      const arrayStorage = new KeyStorage<{ list: number[] }>({
        key: 'array-key',
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(arrayStorage));

      act(() => {
        result.current[1](() => ({ list: [1, 2, 3] }));
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ list: [1, 2, 3] });
      });

      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.list.splice(1, 1); // remove index 1
            draft.list.unshift(0); // add to beginning
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ list: [0, 1, 3] });
      });

      arrayStorage.destroy();
    });

    it('should handle null values in draft', async () => {
      const nullableStorage = new KeyStorage<{ value: string | null }>({
        key: 'nullable-key',
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(nullableStorage));

      act(() => {
        result.current[1](() => ({ value: 'initial' }));
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ value: 'initial' });
      });

      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.value = null;
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ value: null });
      });

      nullableStorage.destroy();
    });
  });

  describe('with default value', () => {
    const defaultValue = { count: 0, items: [] };

    it('should return default value when no value is set', () => {
      const { result } = renderHook(() =>
        useImmerKeyStorage(keyStorage, defaultValue),
      );

      expect(result.current[0]).toEqual(defaultValue);
    });

    it('should return stored value over default value', () => {
      const storedValue = { count: 10, items: ['stored'] };
      keyStorage.set(storedValue);

      const { result } = renderHook(() =>
        useImmerKeyStorage(keyStorage, defaultValue),
      );

      expect(result.current[0]).toEqual(storedValue);
    });

    it('should return default value after removing stored value', async () => {
      const storedValue = { count: 10, items: ['stored'] };
      keyStorage.set(storedValue);

      const { result } = renderHook(() =>
        useImmerKeyStorage(keyStorage, defaultValue),
      );

      act(() => {
        result.current[2](); // remove
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(defaultValue);
      });
    });

    it('should update default value with immer', async () => {
      const { result } = renderHook(() =>
        useImmerKeyStorage(keyStorage, defaultValue),
      );

      act(() => {
        result.current[1](draft => {
          draft.count = 5;
          draft.items.push('updated');
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 5, items: ['updated'] });
      });
    });

    it('should handle default value with null return from updater', async () => {
      const { result } = renderHook(() =>
        useImmerKeyStorage(keyStorage, defaultValue),
      );

      act(() => {
        result.current[1](() => null);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(defaultValue);
      });
    });
  });

  describe('function stability', () => {
    it('should return stable updateImmer function reference', () => {
      const { result, rerender } = renderHook(() =>
        useImmerKeyStorage(keyStorage),
      );

      const initialUpdater = result.current[1];

      rerender();

      expect(result.current[1]).toBe(initialUpdater);
    });

    it('should return stable remover function reference', () => {
      const { result, rerender } = renderHook(() =>
        useImmerKeyStorage(keyStorage),
      );

      const initialRemover = result.current[2];

      rerender();

      expect(result.current[2]).toBe(initialRemover);
    });

    it('should update functions when keyStorage changes', () => {
      const { result, rerender } = renderHook(
        ({ storage }) => useImmerKeyStorage(storage),
        { initialProps: { storage: keyStorage } },
      );

      const initialUpdater = result.current[1];
      const newKeyStorage = new KeyStorage<{ count: number; items: string[] }>({
        key: 'new-key',
        storage: storage,
      });

      rerender({ storage: newKeyStorage });

      expect(result.current[1]).not.toBe(initialUpdater);

      newKeyStorage.destroy();
    });
  });
});
