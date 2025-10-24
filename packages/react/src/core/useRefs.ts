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

import { useCallback, useEffect, useMemo, useRef } from 'react';

export type RefKey = string | number | symbol;

export interface UseRefsReturn<T> extends Iterable<[RefKey, T]> {
  register: (key: RefKey) => (instance: T | null) => void;
  get: (key: RefKey) => T | undefined;
  set: (key: RefKey, value: T) => void;
  delete: (key: RefKey) => boolean;
  has: (key: RefKey) => boolean;
  clear: () => void;
  readonly size: number;
  keys: () => IterableIterator<RefKey>;
  values: () => IterableIterator<T>;
  entries: () => IterableIterator<[RefKey, T]>;
}

export function useRefs<T>(): UseRefsReturn<T> {
  const refs = useRef(new Map<RefKey, T>());
  const get = useCallback((key: RefKey) => refs.current.get(key), []);
  const set = useCallback((key: RefKey, value: T) => refs.current.set(key, value), []);
  const has = useCallback((key: RefKey) => refs.current.has(key), []);
  const deleteFn = useCallback((key: RefKey) => refs.current.delete(key), []);
  const clear = useCallback(() => refs.current.clear(), []);
  const keys = useCallback(() => refs.current.keys(), []);
  const values = useCallback(() => refs.current.values(), []);
  const entries = useCallback(() => refs.current.entries(), []);
  const iterator = useCallback(() => refs.current[Symbol.iterator](), []);
  const register = useCallback((key: RefKey) => {
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
      refs.current.clear();
    };
  }, []);
  return useMemo(() => ({
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
  }), [register, get, set, has, deleteFn, clear, keys, values, entries, iterator]);
}