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
import {
  usePromiseState,
  PromiseState,
  UsePromiseStateOptions,
} from './usePromiseState';
import { useRequestId } from './useRequestId';
import { FetcherError } from '@ahoo-wang/fetcher';

/**
 * Configuration options for the useExecutePromise hook.
 * @template R - The type of the resolved value from the promise.
 * @template E - The type of the error value, defaults to unknown.
 */
export interface UseExecutePromiseOptions<R, E = unknown>
  extends UsePromiseStateOptions<R, E> {
  /**
   * Whether to propagate errors thrown by the promise.
   * If true, the execute function will throw errors.
   * If false (default), the execute function will return the error as the result instead of throwing.
   * @default false
   */
  propagateError?: boolean;
}

/**
 * Type definition for a function that returns a Promise.
 * This is used as input to the execute function, allowing lazy evaluation of promises.
 * @template R - The type of value the promise will resolve to.
 */
export type PromiseSupplier<R> = () => Promise<R>;

/**
 * Interface defining the return type of the useExecutePromise hook.
 * Provides state management and control functions for asynchronous operations.
 * @template R - The type of the result value.
 * @template E - The type of the error value, defaults to FetcherError.
 */
export interface UseExecutePromiseReturn<R, E = FetcherError>
  extends PromiseState<R, E> {
  /**
   * Function to execute a promise supplier or promise.
   * Manages the loading state, handles errors, and updates the result state.
   * @param input - A function that returns a Promise or a Promise directly.
   * @returns A Promise that resolves to the result on success, or the error if propagateError is false.
   * @throws {Error} If the component is unmounted when execute is called.
   * @throws {E} If propagateError is true and the promise rejects.
   */
  execute: (input: PromiseSupplier<R> | Promise<R>) => Promise<R | E>;
  /**
   * Function to reset the state to initial values.
   * Clears loading, result, error, and sets status to idle.
   */
  reset: () => void;
}

/**
 * A React hook for managing asynchronous operations with proper state handling.
 * Provides a way to execute promises while automatically managing loading states,
 * handling errors, and preventing state updates on unmounted components or stale requests.
 *
 * @template R - The type of the result value, defaults to unknown.
 * @template E - The type of the error value, defaults to FetcherError.
 * @param options - Optional configuration options for the hook behavior.
 * @returns An object containing the current promise state and control functions.
 *
 * @throws {Error} When execute is called on an unmounted component.
 * @throws {E} When propagateError is true and the executed promise rejects.
 *
 * @example
 * Basic usage with state management:
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
 *   const handleFetch = () => {
 *     execute(fetchData);
 *   };
 *
 *   const handleReset = () => {
 *     reset();
 *   };
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return (
 *     <div>
 *       <button onClick={handleFetch}>Fetch Data</button>
 *       <button onClick={handleReset}>Reset</button>
 *       {result && <p>{result}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Using propagateError for try/catch error handling:
 * ```typescript
 * const { execute } = useExecutePromise<string>({ propagateError: true });
 *
 * const handleSubmit = async () => {
 *   try {
 *     const data = await execute(fetchUserData);
 *     console.log('Success:', data);
 *   } catch (err) {
 *     console.error('Error occurred:', err);
 *   }
 * };
 * ```
 *
 * @example
 * Executing a promise directly instead of a supplier function:
 * ```typescript
 * const { execute } = useExecutePromise<number>();
 * const promise = fetch('/api/count').then(r => r.json());
 * const result = await execute(promise);
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
  /**
   * Execute a promise supplier or promise and manage its state.
   * Handles loading states, error propagation, and prevents updates on unmounted components.
   * @param input - A function that returns a Promise or a Promise to be executed.
   * @returns A Promise that resolves with the result on success, or the error if propagateError is false.
   * @throws {Error} If the component is unmounted when execute is called.
   * @throws {E} If propagateError is true and the promise rejects.
   */
  const execute = useCallback(
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

  /**
   * Reset the state to initial values.
   * Clears loading, result, error, and sets status to idle.
   * Only works if the component is still mounted.
   */
  const reset = useCallback(() => {
    if (isMounted()) {
      setIdle();
    }
  }, [setIdle, isMounted]);

  return useMemo(
    () => ({
      loading,
      result,
      error,
      status,
      execute,
      reset,
    }),
    [loading, result, error, status, execute, reset],
  );
}
