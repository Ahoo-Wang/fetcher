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

import { useCallback } from 'react';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from './useKeyStorage';
import { produce } from 'immer';

export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (updater: (draft: T | null) => T | null | void) => void, () => void];

export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (updater: (draft: T) => T | null | void) => void, () => void];
/**
 * A React hook that provides Immer-based immutable state management for a KeyStorage instance.
 *
 * This hook extends `useKeyStorage` by integrating Immer's `produce` function, allowing
 * developers to perform "mutable" updates on the stored value in an immutable way. It creates
 * a reactive connection to a KeyStorage instance, automatically subscribing to storage changes
 * and updating the component state when the stored value changes. It leverages React's
 * `useSyncExternalStore` for optimal performance and proper SSR support.
 *
 * The hook provides two usage patterns:
 * 1. Without a default value: Returns nullable state that reflects the storage state
 * 2. With a default value: Returns non-nullable state, using the default when storage is empty
 *
 * The updater function allows modifying a draft of the current value, providing an intuitive
 * mutable API while maintaining immutability under the hood.
 *
 * @template T - The type of value stored in the key storage
 * @param keyStorage - The KeyStorage instance to subscribe to and manage. This should be a
 *                     stable reference (useRef, memo, or module-level instance)
 * @param defaultValue - Optional default value to use when storage is empty.
 *                      When provided, the returned value is guaranteed to be non-null.
 * @returns A tuple containing the current stored value (or default/null), an Immer-based updater function,
 *          and a function to remove the stored value.
 *          The value will be null if no default is provided and storage is empty.
 * @throws {Error} Propagates errors from KeyStorage operations, such as serialization failures
 *                 or storage access errors that may occur during get, set, or remove operations.
 *                 Also propagates errors from the updater function or Immer's produce.
 *
 * @example
 * ```typescript
 * import { useImmerKeyStorage } from '@ahoo-wang/fetcher-react';
 * import { KeyStorage } from '@ahoo-wang/fetcher-storage';
 *
 * // Create a storage instance (typically at module level or with useRef)
 * const userPrefsStorage = new KeyStorage<{ theme: string; lang: string }>('user-prefs');
 *
 * function UserPreferences() {
 *   // Without default value - can be null
 *   const [prefs, updatePrefs, clearPrefs] = useImmerKeyStorage(userPrefsStorage);
 *
 *   return (
 *     <div>
 *       <p>Theme: {prefs?.theme || 'default'}</p>
 *       <button onClick={() => updatePrefs(draft => { draft.theme = 'dark'; })}>
 *         Switch to Dark Theme
 *       </button>
 *       <button onClick={clearPrefs}>
 *         Clear Preferences
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With default value - guaranteed to be non-null
 * const [settings, updateSettings, resetSettings] = useImmerKeyStorage(settingsStorage, {
 *   volume: 50,
 *   muted: false
 * });
 *
 * return (
 *   <div>
 *     <p>Volume: {settings.volume}</p>
 *     <button onClick={() => updateSettings(draft => { draft.volume += 10; })}>
 *       Increase Volume
 *     </button>
 *     <button onClick={() => updateSettings(draft => { draft.muted = !draft.muted; })}>
 *       Toggle Mute
 *     </button>
 *     <button onClick={resetSettings}>
 *       Reset to Default
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Returning a new value instead of modifying draft
 * const [counter, updateCounter, resetCounter] = useImmerKeyStorage(counterStorage, 0);
 *
 * return (
 *   <div>
 *     <p>Count: {counter}</p>
 *     <button onClick={() => updateCounter(draft => draft + 1)}>
 *       Increment
 *     </button>
 *     <button onClick={() => updateCounter(() => 0)}>
 *       Reset to Zero
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue?: T,
): [
    T | null,
  (updater: (draft: T | null) => T | null | void) => void,
  () => void,
] {
  const [value, setValue, remove] = useKeyStorage<T>(
    keyStorage,
    defaultValue as T,
  );
  const updateImmer = useCallback(
    (updater: (draft: T | null) => T | null | void) => {
      const nextValue = produce(value, updater);
      if (nextValue === null) {
        remove();
        return;
      }
      return setValue(nextValue);
    },
    [value, setValue, remove],
  );

  return [value, updateImmer, remove];
}
