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
import { useKeyStorage } from '../../src';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

describe('useKeyStorage', () => {
  let storage: InMemoryStorage;
  let keyStorage: KeyStorage<string>;

  beforeEach(() => {
    storage = new InMemoryStorage();
    keyStorage = new KeyStorage<string>({
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
      const { result } = renderHook(() => useKeyStorage(keyStorage));

      expect(result.current[0]).toBeNull();
    });

    it('should return the current value from storage', () => {
      keyStorage.set('test-value');

      const { result } = renderHook(() => useKeyStorage(keyStorage));

      expect(result.current[0]).toBe('test-value');
    });

    it('should update the value when setter is called', async () => {
      const { result } = renderHook(() => useKeyStorage(keyStorage));

      act(() => {
        result.current[1]('new-value');
      });

      await waitFor(() => {
        expect(result.current[0]).toBe('new-value');
      });
    });

    it('should remove the value when remover is called', async () => {
      keyStorage.set('test-value');
      const { result } = renderHook(() => useKeyStorage(keyStorage));

      act(() => {
        result.current[2](); // remove
      });

      await waitFor(() => {
        expect(result.current[0]).toBeNull();
      });
    });

    it('should sync between multiple hooks using the same KeyStorage', async () => {
      const { result: result1 } = renderHook(() => useKeyStorage(keyStorage));
      const { result: result2 } = renderHook(() => useKeyStorage(keyStorage));

      act(() => {
        result1.current[1]('shared-value');
      });

      await waitFor(() => {
        expect(result1.current[0]).toBe('shared-value');
        expect(result2.current[0]).toBe('shared-value');
      });
    });

    it('should handle complex object types', async () => {
      const objectStorage = new KeyStorage<{ name: string; age: number }>({
        key: 'object-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(objectStorage));

      const testObject = { name: 'John', age: 30 };

      act(() => {
        result.current[1](testObject);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(testObject);
      });

      objectStorage.destroy();
    });

    it('should handle array types', async () => {
      const arrayStorage = new KeyStorage<number[]>({
        key: 'array-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(arrayStorage));

      const testArray = [1, 2, 3, 4, 5];

      act(() => {
        result.current[1](testArray);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(testArray);
      });

      arrayStorage.destroy();
    });

    it('should handle null values explicitly set', async () => {
      const nullableStorage = new KeyStorage<string | null>({
        key: 'nullable-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(nullableStorage));

      act(() => {
        result.current[1](null);
      });

      await waitFor(() => {
        expect(result.current[0]).toBeNull();
      });

      nullableStorage.destroy();
    });
  });

  describe('with default value', () => {
    it('should return default value when no value is set', () => {
      const { result } = renderHook(() =>
        useKeyStorage(keyStorage, 'default-value'),
      );

      expect(result.current[0]).toBe('default-value');
    });

    it('should return stored value over default value', () => {
      keyStorage.set('stored-value');

      const { result } = renderHook(() =>
        useKeyStorage(keyStorage, 'default-value'),
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('should return default value after removing stored value', async () => {
      keyStorage.set('stored-value');
      const { result } = renderHook(() =>
        useKeyStorage(keyStorage, 'default-value'),
      );

      act(() => {
        result.current[2](); // remove
      });

      await waitFor(() => {
        expect(result.current[0]).toBe('default-value');
      });
    });

    it('should handle complex default objects', () => {
      const defaultObj = { theme: 'light', lang: 'en' };
      const { result } = renderHook(() =>
        useKeyStorage(
          new KeyStorage<typeof defaultObj>({
            key: 'complex-key',
            storage: storage,
          }),
          defaultObj,
        ),
      );

      expect(result.current[0]).toEqual(defaultObj);
    });

    it('should handle default value of zero', () => {
      const numberStorage = new KeyStorage<number>({
        key: 'zero-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(numberStorage, 0));

      expect(result.current[0]).toBe(0);

      numberStorage.destroy();
    });

    it('should handle default value of false', () => {
      const boolStorage = new KeyStorage<boolean>({
        key: 'false-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(boolStorage, false));

      expect(result.current[0]).toBe(false);

      boolStorage.destroy();
    });

    it('should handle default value of empty string', () => {
      const { result } = renderHook(() => useKeyStorage(keyStorage, ''));

      expect(result.current[0]).toBe('');
    });
  });

  describe('function stability', () => {
    it('should return stable setter function reference', () => {
      const { result, rerender } = renderHook(() => useKeyStorage(keyStorage));

      const initialSetter = result.current[1];

      rerender();

      expect(result.current[1]).toBe(initialSetter);
    });

    it('should return stable remover function reference', () => {
      const { result, rerender } = renderHook(() => useKeyStorage(keyStorage));

      const initialRemover = result.current[2];

      rerender();

      expect(result.current[2]).toBe(initialRemover);
    });

    it('should update functions when keyStorage changes', () => {
      const { result, rerender } = renderHook(
        ({ storage }) => useKeyStorage(storage),
        { initialProps: { storage: keyStorage } },
      );

      const initialSetter = result.current[1];
      const newKeyStorage = new KeyStorage<string>({
        key: 'new-key',
        storage: storage,
      });

      rerender({ storage: newKeyStorage });

      expect(result.current[1]).not.toBe(initialSetter);

      newKeyStorage.destroy();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from keyStorage.get()', () => {
      // Create a storage that throws on getItem
      const errorStorage = Object.assign(new InMemoryStorage(), {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage read error');
        }),
      });

      const errorKeyStorage = new KeyStorage<string>({
        key: 'error-key',
        storage: errorStorage,
      });

      expect(() => {
        renderHook(() => useKeyStorage(errorKeyStorage));
      }).toThrow('Storage read error');

      errorKeyStorage.destroy();
    });

    it('should propagate errors from keyStorage.set()', async () => {
      const errorStorage = Object.assign(new InMemoryStorage(), {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage write error');
        }),
      });

      const errorKeyStorage = new KeyStorage<string>({
        key: 'error-key',
        storage: errorStorage,
      });

      const { result } = renderHook(() => useKeyStorage(errorKeyStorage));

      expect(() => {
        act(() => {
          result.current[1]('test-value');
        });
      }).toThrow('Storage write error');

      errorKeyStorage.destroy();
    });

    it('should propagate errors from keyStorage.remove()', async () => {
      const errorStorage = Object.assign(new InMemoryStorage(), {
        removeItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage remove error');
        }),
      });

      const errorKeyStorage = new KeyStorage<string>({
        key: 'error-key',
        storage: errorStorage,
      });

      const { result } = renderHook(() => useKeyStorage(errorKeyStorage));

      expect(() => {
        act(() => {
          result.current[2]();
        });
      }).toThrow('Storage remove error');

      errorKeyStorage.destroy();
    });

    it('should handle serialization errors', () => {
      // Create a serializer that throws
      const throwingSerializer = {
        serialize: vi.fn().mockImplementation(() => {
          throw new Error('Serialization error');
        }),
        deserialize: vi.fn().mockReturnValue('deserialized'),
      };

      const errorKeyStorage = new KeyStorage<string>({
        key: 'error-key',
        storage: storage,
        serializer: throwingSerializer,
      });

      const { result } = renderHook(() => useKeyStorage(errorKeyStorage));

      expect(() => {
        act(() => {
          result.current[1]('test-value');
        });
      }).toThrow('Serialization error');

      errorKeyStorage.destroy();
    });
  });

  describe('concurrent operations', () => {
    it('should handle rapid successive updates', async () => {
      const { result } = renderHook(() => useKeyStorage(keyStorage));

      act(() => {
        result.current[1]('value1');
      });

      act(() => {
        result.current[1]('value2');
      });

      act(() => {
        result.current[1]('value3');
      });

      await waitFor(() => {
        expect(result.current[0]).toBe('value3');
      });
    });

    it('should handle updates from external sources', async () => {
      const { result } = renderHook(() => useKeyStorage(keyStorage));

      act(() => {
        keyStorage.set('external-value');
      });

      await waitFor(() => {
        expect(result.current[0]).toBe('external-value');
      });
    });
  });

  describe('type safety', () => {
    it('should work with union types', async () => {
      const unionStorage = new KeyStorage<string | number>({
        key: 'union-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(unionStorage));

      act(() => {
        result.current[1]('string-value');
      });

      await waitFor(() => {
        expect(result.current[0]).toBe('string-value');
      });

      act(() => {
        result.current[1](42);
      });

      await waitFor(() => {
        expect(result.current[0]).toBe(42);
      });

      unionStorage.destroy();
    });

    it('should work with optional properties in objects', async () => {
      type OptionalObj = { required: string; optional?: number };

      const optionalStorage = new KeyStorage<OptionalObj>({
        key: 'optional-key',
        storage: storage,
      });

      const { result } = renderHook(() => useKeyStorage(optionalStorage));

      const testObj: OptionalObj = { required: 'test' };

      act(() => {
        result.current[1](testObj);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(testObj);
      });

      optionalStorage.destroy();
    });
  });
});
