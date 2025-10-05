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

import { useCallback, useMemo, useState } from 'react';
import { useMounted } from './useMounted';
import { useLatest } from './useLatest';
import { FetcherError } from '@ahoo-wang/fetcher';

/**
 * Enumeration of possible promise execution states
 */
export enum PromiseStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface PromiseState<R, E = unknown> {
  /** Current status of the promise */
  status: PromiseStatus;
  /** Indicates if currently loading */
  loading: boolean;
  /** The result value */
  result: R | undefined;
  /** The error value */
  error: E | undefined;
}

export interface PromiseStateCallbacks<R, E = unknown> {
  /** Callback invoked on success (can be async) */
  onSuccess?: (result: R) => void | Promise<void>;
  /** Callback invoked on error (can be async) */
  onError?: (error: E) => void | Promise<void>;
}

/**
 * Options for configuring usePromiseState behavior
 * @template R - The type of result
 *
 * @example
 * ```typescript
 * const options: UsePromiseStateOptions<string> = {
 *   initialStatus: PromiseStatus.IDLE,
 *   onSuccess: (result) => console.log('Success:', result),
 *   onError: async (error) => {
 *     await logErrorToServer(error);
 *     console.error('Error:', error);
 *   },
 * };
 * ```
 */
export interface UsePromiseStateOptions<R, E = FetcherError>
  extends PromiseStateCallbacks<R, E> {
  /** Initial status, defaults to IDLE */
  initialStatus?: PromiseStatus;
}

/**
 * Return type for usePromiseState hook
 * @template R - The type of result
 */
export interface UsePromiseStateReturn<R, E = FetcherError>
  extends PromiseState<R, E> {
  /** Set status to LOADING */
  setLoading: () => void;
  /** Set status to SUCCESS with result */
  setSuccess: (result: R) => Promise<void>;
  /** Set status to ERROR with error */
  setError: (error: E) => Promise<void>;
  /** Set status to IDLE */
  setIdle: () => void;
}

/**
 * A React hook for managing promise state without execution logic
 * @template R - The type of result
 * @param options - Configuration options
 * @returns State management object
 *
 * @example
 * ```typescript
 * import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';
 *
 * function MyComponent() {
 *   const { status, loading, result, error, setSuccess, setError, setIdle } = usePromiseState<string>();
 *
 *   const handleSuccess = () => setSuccess('Data loaded');
 *   const handleError = () => setError(new Error('Failed to load'));
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>Set Success</button>
 *       <button onClick={handleError}>Set Error</button>
 *       <button onClick={setIdle}>Reset</button>
 *       <p>Status: {status}</p>
 *       {loading && <p>Loading...</p>}
 *       {result && <p>Result: {result}</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions<R, E>,
): UsePromiseStateReturn<R, E> {
  const [status, setStatus] = useState<PromiseStatus>(
    options?.initialStatus ?? PromiseStatus.IDLE,
  );
  const [result, setResult] = useState<R | undefined>(undefined);
  const [error, setErrorState] = useState<E | undefined>(undefined);
  const isMounted = useMounted();
  const latestOptions = useLatest(options);
  const setLoadingFn = useCallback(() => {
    if (isMounted()) {
      setStatus(PromiseStatus.LOADING);
      setErrorState(undefined);
    }
  }, [isMounted]);

  const setSuccessFn = useCallback(
    async (result: R) => {
      if (isMounted()) {
        setResult(result);
        setStatus(PromiseStatus.SUCCESS);
        setErrorState(undefined);
        try {
          await latestOptions.current?.onSuccess?.(result);
        } catch (callbackError) {
          // Log callback errors but don't affect state
          console.warn('PromiseState onSuccess callback error:', callbackError);
        }
      }
    },
    [isMounted, latestOptions],
  );

  const setErrorFn = useCallback(
    async (error: E) => {
      if (isMounted()) {
        setErrorState(error);
        setStatus(PromiseStatus.ERROR);
        setResult(undefined);
        try {
          await latestOptions.current?.onError?.(error);
        } catch (callbackError) {
          // Log callback errors but don't affect state
          console.warn('PromiseState onError callback error:', callbackError);
        }
      }
    },
    [isMounted, latestOptions],
  );

  const setIdleFn = useCallback(() => {
    if (isMounted()) {
      setStatus(PromiseStatus.IDLE);
      setErrorState(undefined);
      setResult(undefined);
    }
  }, [isMounted]);
  return useMemo(
    () => ({
      status,
      loading: status === PromiseStatus.LOADING,
      result,
      error,
      setLoading: setLoadingFn,
      setSuccess: setSuccessFn,
      setError: setErrorFn,
      setIdle: setIdleFn,
    }),
    [status, result, error, setLoadingFn, setSuccessFn, setErrorFn, setIdleFn],
  );
}
