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

/**
 * A React hook that provides state management for a KeyStorage instance.
 * Subscribes to storage changes and returns the current value along with a setter function.
 *
 * @template T - The type of value stored in the key storage
 * @param keyStorage - The KeyStorage instance to subscribe to and manage
 * @returns A tuple containing the current stored value and a function to update it
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void] {
  const subscribe = useCallback(
    (callback: () => void) => {
      return keyStorage.addListener({
        name: 'useKeyStorage',
        handle: callback,
      });
    },
    [keyStorage],
  );
  const getSnapshot = useCallback(() => keyStorage.get(), [keyStorage]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setValue = useCallback(
    (value: T) => keyStorage.set(value),
    [keyStorage],
  );
  return [value, setValue];
}
