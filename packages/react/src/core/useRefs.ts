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

import { Key, useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Return type of useRefs hook, providing Map-like interface for managing refs.
 * @template T - The type of the ref instances.
 */
export interface UseRefsReturn<T> extends Iterable<[Key, T]> {
  register: (key: Key) => (instance: T | null) => void;
  get: (key: Key) => T | undefined;
  set: (key: Key, value: T) => void;
  delete: (key: Key) => boolean;
  has: (key: Key) => boolean;
  clear: () => void;
  readonly size: number;
  keys: () => IterableIterator<Key>;
  values: () => IterableIterator<T>;
  entries: () => IterableIterator<[Key, T]>;
}

/**
 * A React hook for managing multiple refs with a Map-like interface.
 * Allows dynamic registration and retrieval of refs by key, with automatic cleanup on unmount.
 *
 * @template T - The type of the ref instances (e.g., HTMLElement).
 * @returns An object with Map methods and a register function for managing refs.
 *
 * @example
 * ```tsx
 * const refs = useRefs<HTMLDivElement>();
 *
 * // Register a ref
 * const refCallback = refs.register('myDiv');
 * <div ref={refCallback} />
 *
 * // Access the ref
 * const element = refs.get('myDiv');
 * ```
 */
export function useRefs<T>(): UseRefsReturn<T> {
  const refs = useRef(new Map<Key, T>());
  const get = useCallback((key: Key) => refs.current.get(key), []);
  const set = useCallback(
    (key: Key, value: T) => refs.current.set(key, value),
    [],
  );
  const has = useCallback((key: Key) => refs.current.has(key), []);
  const deleteFn = useCallback((key: Key) => refs.current.delete(key), []);
  const clear = useCallback(() => refs.current.clear(), []);
  const keys = useCallback(() => refs.current.keys(), []);
  const values = useCallback(() => refs.current.values(), []);
  const entries = useCallback(() => refs.current.entries(), []);
  const iterator = useCallback(() => refs.current[Symbol.iterator](), []);
  const register = useCallback((key: Key) => {
    return (instance: T | null) => {
      if (instance) {
        refs.current.set(key, instance);
      } else {
        refs.current.delete(key);
      }
    };
  }, []);
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      refs.current.clear();
    };
  }, []);
  return useMemo(
    () => ({
      register,
      get,
      set,
      has,
      delete: deleteFn,
      clear,
      keys,
      values,
      entries,
      get size() {
        return refs.current.size;
      },
      [Symbol.iterator]: iterator,
    }),
    [register, get, set, has, deleteFn, clear, keys, values, entries, iterator],
  );
}
