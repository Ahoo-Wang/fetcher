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
): [T | null, (value: T) => void, () => void];

export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void, () => void];

/**
 * A React hook that provides reactive state management for a KeyStorage instance.
 *
 * This hook creates a reactive connection to a KeyStorage instance, automatically subscribing
 * to storage changes and updating the component state when the stored value changes.
 * It leverages React's `useSyncExternalStore` for optimal performance and proper SSR support.
 *
 * The hook provides two usage patterns:
 * 1. Without a default value: Returns nullable state that reflects the storage state
 * 2. With a default value: Returns non-nullable state, using the default when storage is empty
 *
 * @template T - The type of value stored in the key storage
 * @param keyStorage - The KeyStorage instance to subscribe to and manage. This should be a
 *                     stable reference (useRef, memo, or module-level instance)
 * @param defaultValue - Optional default value to use when storage is empty.
 *                      When provided, the returned value is guaranteed to be non-null.
 * @returns A tuple containing the current stored value (or default/null), a function to update it,
 *          and a function to remove the stored value.
 *          The value will be null if no default is provided and storage is empty.
 * @throws {Error} Propagates errors from KeyStorage operations, such as serialization failures
 *                 or storage access errors that may occur during get, set, or remove operations.
 *
 * @example
 * ```typescript
 * import { useKeyStorage } from '@ahoo-wang/fetcher-react';
 * import { KeyStorage } from '@ahoo-wang/fetcher-storage';
 *
 * // Create a storage instance (typically at module level or with useRef)
 * const userStorage = new KeyStorage<string>('user');
 *
 * function UserProfile() {
 *   // Without default value - can be null
 *   const [userName, setUserName, removeUserName] = useKeyStorage(userStorage);
 *
 *   return (
 *     <div>
 *       <p>Current user: {userName || 'Not logged in'}</p>
 *       <button onClick={() => setUserName('John Doe')}>
 *         Set User
 *       </button>
 *       <button onClick={removeUserName}>
 *         Logout
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With default value - guaranteed to be non-null
 * const [theme, setTheme, resetTheme] = useKeyStorage(themeStorage, 'light');
 *
 * return (
 *   <div className={theme}>
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *     <button onClick={resetTheme}>
 *       Reset to Default
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Using with complex objects
 * const [userPrefs, setUserPrefs, clearPrefs] = useKeyStorage(preferencesStorage, {
 *   theme: 'light',
 *   language: 'en',
 *   notifications: true
 * });
 *
 * // Update specific properties
 * const updateTheme = (newTheme: string) => {
 *   setUserPrefs({ ...userPrefs, theme: newTheme });
 * };
 *
 * // Clear all preferences
 * const resetPrefs = () => clearPrefs();
 * ```
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue?: T,
): [T | null, (value: T) => void, () => void] {
  // Create subscription function for useSyncExternalStore
  // This function returns an unsubscribe function that will be called on cleanup
  const subscribe = useCallback(
    (callback: () => void) => {
      return keyStorage.addListener({
        name: nameGenerator.generate('useKeyStorage'), // Generate unique listener name
        handle: callback, // Callback to trigger React re-render on storage changes
      });
    },
    [keyStorage], // Recreate subscription only if keyStorage changes
  );

  // Create snapshot function that returns current storage state
  // This function is called by useSyncExternalStore to get the current value
  const getSnapshot = useCallback(() => {
    const storedValue = keyStorage.get();
    // Return stored value if it exists, otherwise return default value or null
    return storedValue !== null ? storedValue : (defaultValue ?? null);
  }, [keyStorage, defaultValue]); // Recreate snapshot when dependencies change

  // Use React's useSyncExternalStore for reactive external store connection
  // This ensures proper subscription management and SSR compatibility
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Create stable setter function reference
  // This function updates the storage and triggers re-renders in subscribed components
  const setValue = useCallback(
    (value: T) => keyStorage.set(value),
    [keyStorage], // Recreate setter only if keyStorage changes
  );

  // Create stable remover function reference
  // This function removes the stored value and triggers re-renders
  const remove = useCallback(
    () => keyStorage.remove(),
    [keyStorage], // Recreate remover only if keyStorage changes
  );

  // Return tuple of current value, setter function, and remover function
  return [value, setValue, remove];
}
