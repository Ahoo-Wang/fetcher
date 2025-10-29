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

import { useCallback, useMemo } from 'react';
import { useMounted } from './useMounted';
import { DebounceCapable, useDebouncedCallback } from './useDebouncedCallback';
import {
  usePromiseState,
  PromiseState,
  UsePromiseStateOptions,
} from './usePromiseState';
import { useRequestId } from './useRequestId';
import { FetcherError } from '@ahoo-wang/fetcher';

/**
 * Configuration options for the useExecutePromise hook.
 * This interface extends UsePromiseStateOptions for comprehensive state management
 * and DebounceCapable for debouncing functionality, providing fine-grained control
 * over promise execution behavior.
 *
 * @template R - The type of the result value
 * @template E - The type of the error value (defaults to unknown)
 */
export interface UseExecutePromiseOptions<R, E = unknown>
  extends UsePromiseStateOptions<R, E>,
    DebounceCapable {
  /**
   * Controls error propagation behavior.
   * When true, errors thrown by the executed promise will be re-thrown by the execute function,
   * allowing for traditional try/catch error handling.
   * When false (default), errors are captured in the hook's error state instead of being thrown,
   * enabling declarative error handling through the returned error property.
   *
   * @default false
   */
  propagateError?: boolean;
}

/**
 * Type definition for a function that supplies a Promise.
 * This allows for lazy evaluation of promises, enabling features like
 * debouncing and request deduplication by delaying promise creation until execution.
 *
 * @template R - The type of value the promise will resolve to
 * @example
 * ```typescript
 * const fetchUser: PromiseSupplier<User> = () => fetch('/api/user').then(r => r.json());
 * ```
 */
export type PromiseSupplier<R> = () => Promise<R>;

/**
 * Return type of the useExecutePromise hook, providing access to execution state
 * and control functions for managing asynchronous operations.
 * Extends PromiseState to include loading, result, error, and status properties.
 *
 * @template R - The type of the result value
 * @template E - The type of the error value (defaults to FetcherError)
 */
export interface UseExecutePromiseReturn<R, E = FetcherError>
  extends PromiseState<R, E> {
  /**
   * Function to execute a promise supplier function or a direct promise.
   * Supports both lazy evaluation (via PromiseSupplier) and direct promise execution.
   * Automatically handles debouncing if configured, state management, and request deduplication.
   *
   * @param input - Either a function that returns a Promise (for lazy evaluation)
   *                or a Promise directly (for immediate execution)
   * @returns A promise that resolves when the execution completes (success or failure)
   * @throws {E} If propagateError option is true and the input promise rejects
   * @example
   * ```typescript
   * // Using a promise supplier (recommended for debouncing)
   * await execute(() => fetch('/api/data').then(r => r.json()));
   *
   * // Using a direct promise
   * await execute(fetch('/api/data').then(r => r.json()));
   * ```
   */
  execute: (input: PromiseSupplier<R> | Promise<R>) => Promise<void>;
  /**
   * Function to reset the hook state to initial values.
   * Cancels any pending debounced executions, clears the result and error states,
   * stops loading, and sets status to 'idle'. Safe to call multiple times.
   */
  reset: () => void;
}

/**
 * A React hook for managing asynchronous operations with proper state handling,
 * debouncing support, automatic cancellation, and configurable error propagation.
 *
 * This hook provides a declarative way to execute promises in React components,
 * managing loading states, results, errors, and request lifecycle. It supports debouncing
 * to prevent excessive executions, automatic request deduplication, and flexible error
 * handling through the propagateError option.
 *
 * @template R - The type of the result value (defaults to unknown)
 * @template E - The type of the error value (defaults to FetcherError)
 * @param options - Optional configuration object for customizing promise execution behavior,
 *                  including error propagation, debouncing settings, and state management options
 * @returns An object containing the current execution state (loading, result, error, status)
 *          and control functions (execute, reset)
 *
 * @example Basic promise execution
 * ```typescript
 * import { useExecutePromise } from '@ahoo-wang/fetcher-react';
 *
 * function MyComponent() {
 *   const { loading, result, error, execute, reset } = useExecutePromise<string>();
 *
 *   const fetchData = async () => {
 *     const response = await fetch('/api/data');
 *     return response.text();
 *   };
 *
 *   const handleFetch = async () => {
 *     await execute(fetchData);
 *   };
 *
 *   const handleReset = () => {
 *     reset();
 *   };
 *
 *   if (loading) return 'Loading...';
 *   if (error) return `Error: ${error.message}`;
 *   return `Data: ${result}`;
 * }
 * ```
 *
 * @example Error propagation
 * ```typescript
 * import { useExecutePromise } from '@ahoo-wang/fetcher-react';
 *
 * function ErrorHandlingComponent() {
 *   const { execute } = useExecutePromise<string>({ propagateError: true });
 *
 *   const riskyOperation = async () => {
 *     // Some operation that might throw
 *     throw new Error('Something went wrong');
 *   };
 *
 *   const handleExecute = async () => {
 *     try {
 *       await execute(riskyOperation);
 *       console.log('Success!');
 *     } catch (err) {
 *       console.error('Caught error:', err);
 *     }
 *   };
 *
 *   return 'Ready to execute';
 * }
 * ```
 *
 * @example Debounced execution
 * ```typescript
 * import { useExecutePromise } from '@ahoo-wang/fetcher-react';
 *
 * function SearchComponent() {
 *   const { loading, execute } = useExecutePromise<string[]>({
 *     debounce: { delay: 300 } // Debounce executions by 300ms
 *   });
 *
 *   const searchAPI = async (query: string) => {
 *     const response = await fetch(`/api/search?q=${query}`);
 *     return response.json();
 *   };
 *
 *   const handleSearch = (query: string) => {
 *     execute(() => searchAPI(query));
 *   };
 *
 *   // Rapid calls to handleSearch will be debounced
 *   return loading ? 'Searching...' : 'Search ready';
 * }
 * ```
 *
 * @example Direct promise execution
 * ```typescript
 * import { useExecutePromise } from '@ahoo-wang/fetcher-react';
 *
 * function DirectPromiseComponent() {
 *   const { execute, result } = useExecutePromise<number>();
 *
 *   const handleExecute = async () => {
 *     const promise = Promise.resolve(42);
 *     await execute(promise);
 *   };
 *
 *   return `Result: ${result}`;
 * }
 * ```
 */
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E> {
  const {
    loading,
    result,
    error,
    status,
    setLoading,
    setSuccess,
    setError,
    setIdle,
  } = usePromiseState<R, E>(options);
  const isMounted = useMounted();
  const requestId = useRequestId();
  const propagateError = options?.propagateError;
  const {
    delay: debounceDelay = 0,
    leading = false,
    trailing = true,
  } = options?.debounce || {};

  /**
   * Internal function to perform the promise execution with state management.
   * Handles loading states, success/error setting, and request deduplication.
   * @param input - A function that returns a Promise or a Promise to be executed
   * @returns The resolved value or error based on propagateError setting
   * @throws {Error} If the component is unmounted
   * @throws {E} If propagateError is true and the promise rejects
   */
  const performExecute = useCallback(
    async (input: PromiseSupplier<R> | Promise<R>): Promise<R | E> => {
      if (!isMounted()) {
        throw new Error('Component is unmounted');
      }
      const currentRequestId = requestId.generate();
      setLoading();
      try {
        const promise = typeof input === 'function' ? input() : input;
        const data = await promise;

        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await setSuccess(data);
        }
        return data;
      } catch (err) {
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await setError(err as E);
        }
        if (propagateError) {
          throw err;
        }
        return err as E;
      }
    },
    [setLoading, setSuccess, setError, isMounted, requestId, propagateError],
  );

  const debouncedPerformExecute = useDebouncedCallback(performExecute, {
    delay: debounceDelay,
    leading,
    trailing,
  });

  /**
   * Execute a promise supplier or promise and manage its state.
   * Handles debouncing if configured, otherwise executes immediately.
   * @param input - A function that returns a Promise or a Promise to be executed
   * @returns A promise that resolves when execution completes
   * @throws {E} If propagateError is true and the promise rejects
   */
  const execute = useCallback(
    async (input: PromiseSupplier<R> | Promise<R>): Promise<void> => {
      if (debounceDelay > 0) {
        debouncedPerformExecute.run(input);
      } else {
        await performExecute(input);
      }
    },
    [debouncedPerformExecute, performExecute, debounceDelay],
  );

  /**
   * Reset the state to initial values.
   * Cancels any pending debounced executions and resets state if component is mounted.
   */
  const reset = useCallback(() => {
    debouncedPerformExecute.cancel();
    if (isMounted()) {
      setIdle();
    }
  }, [debouncedPerformExecute, setIdle, isMounted]);

  return useMemo(
    () => ({
      loading: loading,
      result: result,
      error: error,
      execute,
      reset,
      status: status,
    }),
    [loading, result, error, execute, reset, status],
  );
}
