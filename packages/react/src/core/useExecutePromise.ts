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
import { useMountedState } from 'react-use';
import { usePromiseState, PromiseState } from './usePromiseState';

/**
 * Type definition for a function that returns a Promise
 * @template R - The type of value the promise will resolve to
 */
export type PromiseSupplier<R> = () => Promise<R>;

/**
 * Interface defining the return type of useExecutePromise hook
 * @template R - The type of the result value
 */
export interface UseExecutePromiseReturn<R> extends PromiseState<R> {
  /** Function to execute a promise supplier */
  execute: (provider: PromiseSupplier<R>) => Promise<R>;
  /** Function to reset the state to initial values */
  reset: () => void;
}

/**
 * A React hook for managing asynchronous operations with proper state handling
 * @template R - The type of the result value
 * @returns An object containing the current state and control functions
 */
export function useExecutePromise<R = unknown>(): UseExecutePromiseReturn<R> {
  const state = usePromiseState<R>();
  const isMounted = useMountedState();

  /**
   * Execute a promise supplier and manage its state
   * @param provider - A function that returns a Promise to be executed
   * @returns A Promise that resolves with the result of the executed promise
   */
  const execute = useCallback(
    async (provider: PromiseSupplier<R>): Promise<R> => {
      if (!isMounted()) {
        throw new Error('Component is unmounted');
      }
      state.setLoading();
      try {
        const data = await provider();

        if (isMounted()) {
          state.setSuccess(data);
        }
        return data;
      } catch (err) {
        if (isMounted()) {
          state.setError(err);
        }
        throw err;
      }
    },
    [state, isMounted],
  );

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    if (isMounted()) {
      state.setIdle();
    }
  }, [state, isMounted]);

  return {
    loading: state.loading,
    result: state.result,
    error: state.error,
    execute,
    reset,
    status: state.status,
  };
}
