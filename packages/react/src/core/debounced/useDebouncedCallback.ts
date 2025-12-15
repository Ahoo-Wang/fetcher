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
import { useLatest } from '../useLatest';

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
  /** Function to check if a debounced execution is currently pending. */
  readonly isPending: () => boolean;
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
 *   - `isPending`: Function that returns true if a debounced execution is currently pending.
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
 * @throws {Error} Throws an error if both `leading` and `trailing` options are set to false, as at least one must be true for the debounce to function.
 * @throws Exceptions from the callback function itself should be handled by the caller.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T> {
  if (options.leading === false && options.trailing === false) {
    throw new Error(
      'useDebouncedCallback: at least one of leading or trailing must be true',
    );
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastInvokeTimeRef = useRef<number | null>(null);

  const latestCallback = useLatest(callback);
  const latestOptions = useLatest(options);

  const cleanTimeout = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const shouldInvoke = useCallback((time: number) => {
    if (!lastInvokeTimeRef.current) {
      return true;
    }
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
    return timeSinceLastInvoke >= latestOptions.current.delay;
  }, [latestOptions]);

  const invokeCallback = useCallback((time: number, args: Parameters<T>) => {
    lastInvokeTimeRef.current = time;
    latestCallback.current(...args);
  }, [latestCallback]);

  const scheduleTrailing = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (lastArgsRef.current) {
        const trailingTime = Date.now();
        invokeCallback(trailingTime, lastArgsRef.current);
      }
      timeoutRef.current = undefined;
    }, latestOptions.current.delay);
  }, [latestOptions, invokeCallback]);

  const run = useCallback(
    (...args: Parameters<T>) => {
      cleanTimeout();
      const { leading = false, trailing = true } = latestOptions.current;
      lastArgsRef.current = args;
      if (trailing && !leading) {
        scheduleTrailing();
        return;
      }

      const currentTime = Date.now();
      const shouldCallLeading = leading && shouldInvoke(currentTime);
      if (shouldCallLeading) {
        invokeCallback(currentTime, args);
        return;
      }
      if (trailing) {
        scheduleTrailing();
      }
    },
    [latestOptions, cleanTimeout, shouldInvoke, invokeCallback, scheduleTrailing],
  );
  const cancel = useCallback(() => {
    cleanTimeout();
    lastArgsRef.current = null;
  }, [cleanTimeout]);
  const isPending = useCallback(() => {
    return timeoutRef.current !== undefined;
  }, []);
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return useMemo(
    () => ({
      run,
      cancel,
      isPending,
    }),
    [run, cancel, isPending],
  );
}
