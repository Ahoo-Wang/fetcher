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

import { useCallback, useState } from 'react';
import { useMountedState } from 'react-use';

/**
 * Enumeration of possible promise execution states
 */
export enum PromiseStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Type definition for a function that returns a Promise
 * @template R - The type of value the promise will resolve to
 */
export type PromiseSupplier<R> = () => Promise<R>;

/**
 * Interface defining the state and actions returned by useExecutePromise hook
 * @template R - The type of the result value
 */
export interface UseExecutePromiseState<R> {
  /** Current status of the promise execution */
  status: PromiseStatus;
  /** Indicates if a promise is currently being executed */
  loading: boolean;
  /** The result of the last successfully executed promise */
  result: R | undefined;
  /** The error from the last failed promise execution */
  error: unknown | undefined;
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
export function useExecutePromise<R = unknown>(): UseExecutePromiseState<R> {
  const [status, setStatus] = useState<PromiseStatus>(PromiseStatus.IDLE);
  const [error, setError] = useState<unknown>(undefined);
  const [result, setResult] = useState<R | undefined>(undefined);
  const isMounted = useMountedState();

  /**
   * Execute a promise supplier and manage its state
   * @param provider - A function that returns a Promise to be executed
   * @returns A Promise that resolves with the result of the executed promise
   */
  const execute = useCallback(async (provider: PromiseSupplier<R>): Promise<R> => {
    if (!isMounted()) {
      throw new Error('Component is unmounted');
    }
    setStatus(PromiseStatus.LOADING);
    setError(undefined);
    try {
      const data = await provider();

      if (isMounted()) {
        setResult(data);
        setStatus(PromiseStatus.SUCCESS);
        setError(undefined);
      }
      return data;
    } catch (err) {
      if (isMounted()) {
        setError(err);
        setStatus(PromiseStatus.ERROR);
        setResult(undefined);
      }
      throw err;
    }
  }, []);

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    if (isMounted()) {
      setStatus(PromiseStatus.IDLE);
      setError(undefined);
      setResult(undefined);
    }
  }, []);

  return {
    loading: status === PromiseStatus.LOADING,
    result,
    error,
    execute,
    reset,
    status,
  };
}