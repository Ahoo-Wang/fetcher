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

/**
 * useKeyStorage hook overload for cases without a default value.
 *
 * When no default value is provided, the hook returns nullable state that directly
 * reflects the storage state. This is useful when you want to distinguish between
 * "no value stored" and "default value applied".
 *
 * @template T - The type of value stored in the key storage
 * @param keyStorage - The KeyStorage instance to subscribe to and manage
 * @returns A tuple where the first element can be null if storage is empty,
 *          and the second element is a setter function to update the storage
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];

/**
 * useKeyStorage hook overload for cases with a default value.
 *
 * When a default value is provided, the hook guarantees that the returned state
 * will never be null. The default value is used when the storage is empty,
 * providing a seamless experience for required state.
 *
 * @template T - The type of value stored in the key storage
 * @param keyStorage - The KeyStorage instance to subscribe to and manage
 * @param defaultValue - The default value to use when storage is empty.
 *                      This value will be returned until the storage is explicitly set.
 * @returns A tuple where the first element is guaranteed to be non-null (either
 *          the stored value or the default value), and the second element is a
 *          setter function to update the storage
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void];

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
 * @returns A tuple containing the current stored value and a function to update it.
 *          The value will be null if no default is provided and storage is empty.
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
 *   const [userName, setUserName] = useKeyStorage(userStorage);
 *
 *   return (
 *     <div>
 *       <p>Current user: {userName || 'Not logged in'}</p>
 *       <button onClick={() => setUserName('John Doe')}>
 *         Set User
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With default value - guaranteed to be non-null
 * const [theme, setTheme] = useKeyStorage(themeStorage, 'light');
 *
 * return (
 *   <div className={theme}>
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Using with complex objects
 * const [userPrefs, setUserPrefs] = useKeyStorage(preferencesStorage, {
 *   theme: 'light',
 *   language: 'en',
 *   notifications: true
 * });
 *
 * // Update specific properties
 * const updateTheme = (newTheme: string) => {
 *   setUserPrefs({ ...userPrefs, theme: newTheme });
 * };
 * ```
 */
/**
 * Implementation of the useKeyStorage hook.
 *
 * This function implements the core logic for both overloads. It uses React's
 * useSyncExternalStore hook to create a reactive connection to the KeyStorage,
 * ensuring proper subscription management and SSR compatibility.
 *
 * Key implementation details:
 * - Uses useSyncExternalStore for external store subscription
 * - Automatically unsubscribes when component unmounts
 * - Handles default value logic in the snapshot function
 * - Provides stable setter function reference via useCallback
 *
 * @param keyStorage - The KeyStorage instance to connect to
 * @param defaultValue - Optional default value for the overload implementation
 * @returns Tuple of [currentValue, setterFunction]
 * @throws {Error} If keyStorage is null or undefined
 * @throws {Error} If keyStorage subscription fails (rare, depends on implementation)
 */
export function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue?: T,
): [T | null, (value: T) => void] {
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

  // Return tuple of current value and setter function
  return [value, setValue];
}
