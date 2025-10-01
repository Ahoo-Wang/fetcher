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


export interface UseExecutePromiseOptions<R, E = unknown> extends UsePromiseStateOptions<R, E> {

  propagateError?: boolean;
}

/**
 * Type definition for a function that returns a Promise
 * @template R - The type of value the promise will resolve to
 */
export type PromiseSupplier<R> = () => Promise<R>;

/**
 * Interface defining the return type of useExecutePromise hook
 * @template R - The type of the result value
 */
export interface UseExecutePromiseReturn<R, E = unknown>
  extends PromiseState<R, E> {
  /** Function to execute a promise supplier or promise */
  execute: (input: PromiseSupplier<R> | Promise<R>) => Promise<R>;
  /** Function to reset the state to initial values */
  reset: () => void;
}

/**
 * A React hook for managing asynchronous operations with proper state handling
 * @template R - The type of the result value
 * @returns An object containing the current state and control functions
 *
 * @example
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
 */
export function useExecutePromise<R = unknown, E = unknown>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E> {
  const state = usePromiseState<R, E>(options);
  const isMounted = useMounted();
  const requestId = useRequestId();

  /**
   * Execute a promise supplier or promise and manage its state
   * @param input - A function that returns a Promise or a Promise to be executed
   * @returns A Promise that resolves with the result of the executed promise
   */
  const execute = useCallback(
    async (input: PromiseSupplier<R> | Promise<R>): Promise<R> => {
      if (!isMounted()) {
        throw new Error('Component is unmounted');
      }
      const currentRequestId = requestId.generate();
      state.setLoading();
      try {
        const promise = typeof input === 'function' ? input() : input;
        const data = await promise;

        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await state.setSuccess(data);
        }
        return data;
      } catch (err) {
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await state.setError(err as E);
        }
        throw err;
      }
    },
    [state, isMounted, requestId],
  );

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    if (isMounted()) {
      state.setIdle();
    }
  }, [state, isMounted]);

  return useMemo(
    () => ({
      loading: state.loading,
      result: state.result,
      error: state.error,
      execute,
      reset,
      status: state.status,
    }),
    [state.loading, state.result, state.error, execute, reset, state.status],
  );
}
