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
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useLatest } from './useLatest';

/**
 * Options for configuring the debounced callback behavior.
 */
export interface UseDebouncedCallbackOptions {
  /** The delay in milliseconds before the callback is invoked. Must be a positive number. */
  delay: number;
  /** Whether to invoke the callback immediately on the leading edge of the timeout. Defaults to false. */
  leading?: boolean;
  /** Whether to invoke the callback on the trailing edge of the timeout. Defaults to true. */
  trailing?: boolean;
}

/**
 * Return type of the useDebouncedCallback hook.
 * @template T - The type of the original callback function.
 */
export interface UseDebouncedCallbackReturn<T extends (...args: any[]) => any> {
  /** Function to execute the debounced callback with the provided arguments. */
  readonly run: (...args: Parameters<T>) => void;
  /** Function to cancel any pending debounced execution. */
  readonly cancel: () => void;
}

/**
 * A React hook that provides a debounced version of a callback function.
 * The callback will be invoked after a specified delay, with options for leading and trailing edge execution.
 * This is useful for optimizing performance in scenarios like search input handling or window resizing.
 *
 * @template T - The type of the callback function.
 * @param callback - The function to debounce. It can accept any number of arguments.
 * @param options - Configuration object for debouncing behavior.
 * @param options.delay - The delay in milliseconds before the callback is invoked. Must be a positive number.
 * @param options.leading - If true, the callback is invoked immediately on the first call, then debounced. Defaults to false.
 * @param options.trailing - If true, the callback is invoked after the delay on the last call. Defaults to true.
 * @returns An object containing:
 *   - `run`: Function to execute the debounced callback with arguments.
 *   - `cancel`: Function to cancel any pending debounced execution.
 *
 * @example
 * ```typescript
 * const { run, cancel } = useDebouncedCallback(
 *   (query: string) => {
 *     console.log('Searching for:', query);
 *     // Perform search API call
 *   },
 *   { delay: 300 }
 * );
 *
 * // Call the debounced function
 * run('search term');
 *
 * // Cancel if needed
 * cancel();
 * ```
 *
 * @example With leading edge execution:
 * ```typescript
 * const { run } = useDebouncedCallback(
 *   () => console.log('Immediate and debounced'),
 *   { delay: 500, leading: true, trailing: true }
 * );
 *
 * run(); // Logs immediately, then again after 500ms if called again
 * ```
 *
 * @throws Will not throw any exceptions directly, but the callback function may throw exceptions that should be handled by the caller.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T> {
  const timeoutRef = useRef<number>(undefined);
  const hasLeadingCalledRef = useRef(false);
  const latestCallback = useLatest(callback);
  const latestOptions = useLatest(options);

  // Function to cancel any pending debounced execution
  const cancel = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Cleanup timeout on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // The debounced function that can be called
  const run = useCallback(
    (...args: Parameters<T>) => {
      const { leading = false, trailing = true, delay } = latestOptions.current;

      // Cancel any existing timeout to reset the debounce timer
      cancel();

      // Determine if we should call the function immediately (leading edge)
      const shouldCallLeading = leading && !hasLeadingCalledRef.current;

      if (shouldCallLeading) {
        latestCallback.current(...args);
        hasLeadingCalledRef.current = true;
      }

      // Schedule the trailing edge execution if enabled
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          // Only call on trailing edge if not already called on leading edge
          if (!shouldCallLeading) {
            latestCallback.current(...args);
          }
          // Reset leading flag and timeout reference after execution
          hasLeadingCalledRef.current = false;
          timeoutRef.current = undefined;
        }, delay);
      }
    },
    [latestCallback, latestOptions, cancel],
  );

  return useMemo(
    () => ({
      run,
      cancel,
    }),
    [run, cancel],
  );
}
