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

import { useCallback, useSyncExternalStore } from 'react';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { nameGenerator } from '@ahoo-wang/fetcher-eventbus';


export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];

export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void];

/**
 * A React hook that provides state management for a KeyStorage instance.
 * Subscribes to storage changes and returns the current value along with a setter function.
 * Optionally accepts a default value to use when the storage is empty.
 *
 * @template T - The type of value stored in the key storage
 * @template D - The type of the default value parameter
 * @param keyStorage - The KeyStorage instance to subscribe to and manage
 * @param defaultValue - Optional default value to use when storage is empty
 * @returns A tuple containing the current stored value (or default value if storage is empty) and a function to update it
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue?: T,
): [T | null, (value: T) => void] {
  const subscribe = useCallback(
    (callback: () => void) => {
      return keyStorage.addListener({
        name: nameGenerator.generate('useKeyStorage'),
        handle: callback,
      });
    },
    [keyStorage],
  );
  const getSnapshot = useCallback(() => {
    const storedValue = keyStorage.get();
    return storedValue !== null ? storedValue : (defaultValue ?? null);
  }, [keyStorage, defaultValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setValue = useCallback(
    (value: T) => keyStorage.set(value),
    [keyStorage],
  );
  return [value, setValue];
}
