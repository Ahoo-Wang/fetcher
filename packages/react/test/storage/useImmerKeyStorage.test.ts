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

  describe('error handling', () => {
    it('should propagate errors from updater function', async () => {
      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      expect(() => {
        act(() => {
          result.current[1](() => {
            throw new Error('Updater error');
          });
        });
      }).toThrow('Updater error');
    });

    it('should propagate errors from draft modification', async () => {
      const initialValue = { count: 0, items: [] };
      keyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(keyStorage));

      expect(() => {
        act(() => {
          result.current[1](draft => {
            if (draft) {
              // This should work fine, but let's test error in modification
              throw new Error('Draft modification error');
            }
          });
        });
      }).toThrow('Draft modification error');
    });

    it('should handle errors when removing via null return', async () => {
      const errorStorage = Object.assign(new InMemoryStorage(), {
        removeItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage remove error');
        }),
      });

      const errorKeyStorage = new KeyStorage<{
        count: number;
        items: string[];
      }>({
        key: 'error-key',
        storage: errorStorage,
      });

      const initialValue = { count: 1, items: [] };
      errorKeyStorage.set(initialValue);

      const { result } = renderHook(() => useImmerKeyStorage(errorKeyStorage));

      expect(() => {
        act(() => {
          result.current[1](() => null);
        });
      }).toThrow('Storage remove error');

      errorKeyStorage.destroy();
    });
  });

  describe('concurrent operations', () => {
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

  describe('type safety', () => {
    it('should work with union types', async () => {
      const unionStorage = new KeyStorage<
        { type: 'string'; value: string } | { type: 'number'; value: number }
      >({
        key: 'union-key',
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(unionStorage));

      act(() => {
        result.current[1](() => ({ type: 'string', value: 'test' }));
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ type: 'string', value: 'test' });
      });

      act(() => {
        result.current[1](draft => {
          if (draft && draft.type === 'string') {
            draft.value = 'updated';
          }
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
        storage: storage,
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
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(readonlyStorage));

      const initialValue: ReadonlyObj = { id: 'fixed', mutable: 0 };

      act(() => {
        result.current[1](() => initialValue);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(initialValue);
      });

      // Immer allows modifying readonly properties in draft
      act(() => {
        result.current[1](draft => {
          if (draft) {
            draft.mutable = 10;
          }
        });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ id: 'fixed', mutable: 10 });
      });

      readonlyStorage.destroy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', async () => {
      const emptyStorage = new KeyStorage<Record<string, never>>({
        key: 'empty-key',
        storage: storage,
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
          if (draft) {
            // Add properties to empty object
            (draft as any).newProp = 'value';
          }
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
        storage: storage,
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

    it('should handle function properties (though not recommended)', async () => {
      type WithFunction = { data: string; callback: () => string };

      const functionStorage = new KeyStorage<WithFunction>({
        key: 'function-key',
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(functionStorage));

      const objWithFunction = {
        data: 'test',
        callback: () => 'callback result',
      };

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
          if (draft) {
            draft.data = 'updated';
          }
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
        storage: storage,
      });

      const { result } = renderHook(() => useImmerKeyStorage(dateStorage));

      const now = new Date();

      act(() => {
        result.current[1](() => ({ timestamp: now, data: 'test' }));
      });

      await waitFor(() => {
        expect(result.current[0]!.timestamp).toEqual(now);
        expect(result.current[0]!.data).toBe('test');
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
        expect(result.current[0]!.timestamp.getTime()).toBe(
          now.getTime() + 1000,
        );
        expect(result.current[0]!.data).toBe('updated');
      });

      dateStorage.destroy();
    });
  });
});
