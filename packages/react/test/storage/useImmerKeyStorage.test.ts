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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, Suspense, useLayoutEffect } from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
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

it('applies consecutive Immer updaters to the latest stored value', async () => {
  const storage = new KeyStorage<{ count: number }>({
    key: 'counter',
    storage: new InMemoryStorage(),
  });
  const { result } = renderHook(() =>
    useImmerKeyStorage(storage, { count: 0 }),
  );
  await act(async () => {
    result.current[1](draft => {
      draft.count++;
    });
    result.current[1](draft => {
      draft.count++;
    });
  });
  expect(storage.get()).toEqual({ count: 2 });
  storage.destroy();
});

it('keeps the Immer updater stable with inline defaults and reads the latest default', async () => {
  const storage = new KeyStorage<{ count: number }>({
    key: 'inline-default',
    storage: new InMemoryStorage(),
  });
  try {
    const { result, rerender } = renderHook(
      ({ count }) => useImmerKeyStorage(storage, { count }),
      { initialProps: { count: 0 } },
    );
    const update = result.current[1];
    rerender({ count: 0 });
    expect(result.current[1]).toBe(update);

    rerender({ count: 10 });
    await act(async () => {
      update(draft => {
        draft.count++;
      });
    });
    expect(storage.get()).toEqual({ count: 11 });
    expect(result.current[0]).toEqual({ count: 11 });
  } finally {
    storage.destroy();
  }
});

it('keeps a retained updater paired with its storage and latest default before switching', async () => {
  const backing = new InMemoryStorage();
  const first = new KeyStorage<{ owner: string; count: number }>({
    key: 'first',
    storage: backing,
  });
  const second = new KeyStorage<{ owner: string; count: number }>({
    key: 'second',
    storage: backing,
  });
  try {
    const { result, rerender } = renderHook(
      ({ storage, owner, count }) =>
        useImmerKeyStorage(storage, { owner, count }),
      { initialProps: { storage: first, owner: 'A', count: 0 } },
    );
    const updateFirst = result.current[1];
    rerender({ storage: first, owner: 'A', count: 10 });
    expect(result.current[1]).toBe(updateFirst);
    rerender({ storage: second, owner: 'B', count: 100 });
    const updateSecond = result.current[1];
    expect(updateSecond).not.toBe(updateFirst);
    rerender({ storage: second, owner: 'B', count: 200 });
    expect(result.current[1]).toBe(updateSecond);

    await act(async () => {
      updateFirst(draft => {
        draft.count++;
      });
    });
    expect(first.get()).toEqual({ owner: 'A', count: 11 });
    expect(second.get()).toBeNull();
    expect(result.current[0]).toEqual({ owner: 'B', count: 200 });
    await act(async () => {
      updateSecond(draft => {
        draft.count++;
      });
    });
    expect(second.get()).toEqual({ owner: 'B', count: 201 });
  } finally {
    first.destroy();
    second.destroy();
  }
});

it('makes the current default available to updates in a consumer layout effect', () => {
  const storage = new KeyStorage<{ count: number }>({
    key: 'layout-default',
    storage: new InMemoryStorage(),
  });
  try {
    const { result } = renderHook(() => {
      const [value, update] = useImmerKeyStorage(storage, { count: 10 });
      useLayoutEffect(() => {
        update(draft => {
          draft.count++;
        });
      }, [update]);
      return value;
    });
    expect(storage.get()).toEqual({ count: 11 });
    expect(result.current).toEqual({ count: 11 });
  } finally {
    storage.destroy();
  }
});

it.each(['mount', 'changed default'] as const)(
  'makes the current default available to descendant layout effects on %s',
  phase => {
    const storage = new KeyStorage<{ count: number }>({
      key: 'descendant-layout-default',
      storage: new InMemoryStorage(),
    });
    type Update = (updater: (draft: { count: number }) => void) => void;
    function Child({ update, apply }: { update: Update; apply: boolean }) {
      useLayoutEffect(() => {
        if (apply)
          update(draft => {
            draft.count++;
          });
      }, [update, apply]);
      return null;
    }
    function Parent({ count, apply }: { count: number; apply: boolean }) {
      const [, update] = useImmerKeyStorage(storage, { count });
      return createElement(Child, { update, apply });
    }
    try {
      const view = render(
        createElement(Parent, { count: 10, apply: phase === 'mount' }),
      );
      if (phase === 'changed default') {
        view.rerender(createElement(Parent, { count: 20, apply: true }));
      }
      expect(storage.get()).toEqual({ count: phase === 'mount' ? 11 : 21 });
    } finally {
      storage.destroy();
    }
  },
);

it.each([undefined, 10])(
  'passes a deserialized undefined to the updater (default: %s)',
  async defaultValue => {
    const backing = new InMemoryStorage();
    backing.setItem('undefined-value', 'undefined');
    const storage = new KeyStorage<number | undefined>({
      key: 'undefined-value',
      storage: backing,
      serializer: {
        serialize: value => String(value),
        deserialize: raw => (raw === 'undefined' ? undefined : Number(raw)),
      },
    });
    try {
      const { result } = renderHook(() =>
        useImmerKeyStorage(storage, defaultValue),
      );
      expect(result.current[0]).toBeUndefined();
      let received: number | null | undefined = null;
      await act(async () => {
        result.current[1](draft => {
          received = draft;
          return 1;
        });
      });
      expect(received).toBeUndefined();
      expect(storage.get()).toBe(1);
    } finally {
      storage.destroy();
    }
  },
);

it('keeps uncommitted defaults out of a retained updater when a render suspends', async () => {
  const storage = new KeyStorage<{ count: number }>({
    key: 'suspended-default',
    storage: new InMemoryStorage(),
  });
  type Update = (updater: (draft: { count: number }) => void) => void;
  let committedUpdate: Update = () => {
    throw new Error('not committed');
  };
  const suspended = new Promise<void>(() => {});
  function Parent({ count, suspend }: { count: number; suspend: boolean }) {
    const [, update] = useImmerKeyStorage(storage, { count });
    useLayoutEffect(() => {
      committedUpdate = update;
    }, [update]);
    if (suspend) throw suspended;
    return null;
  }
  const tree = (count: number, suspend: boolean) =>
    createElement(
      Suspense,
      { fallback: 'pending' },
      createElement(Parent, { count, suspend }),
    );
  try {
    const view = render(tree(10, false));
    const update = committedUpdate;
    view.rerender(tree(20, true));
    await act(async () => {
      update(draft => {
        draft.count++;
      });
    });
    expect(storage.get()).toEqual({ count: 11 });
  } finally {
    storage.destroy();
  }
});
