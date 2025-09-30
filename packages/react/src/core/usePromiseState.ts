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

export interface PromiseState<R> {
  /** Current status of the promise */
  status: PromiseStatus;
  /** Indicates if currently loading */
  loading: boolean;
  /** The result value */
  result: R | undefined;
  /** The error value */
  error: unknown | undefined;
}

/**
 * Options for configuring usePromiseState behavior
 * @template R - The type of result
 */
export interface UsePromiseStateOptions<R> {
  /** Initial status, defaults to IDLE */
  initialStatus?: PromiseStatus;
  /** Callback invoked on success */
  onSuccess?: (result: R) => void;
  /** Callback invoked on error */
  onError?: (error: unknown) => void;
}

/**
 * Return type for usePromiseState hook
 * @template R - The type of result
 */
export interface UsePromiseStateReturn<R> extends PromiseState<R> {
  /** Set status to LOADING */
  setLoading: () => void;
  /** Set status to SUCCESS with result */
  setSuccess: (result: R) => void;
  /** Set status to ERROR with error */
  setError: (error: unknown) => void;
  /** Set status to IDLE */
  setIdle: () => void;
}

/**
 * A React hook for managing promise state without execution logic
 * @template R - The type of result
 * @param options - Configuration options
 * @returns State management object
 */
export function usePromiseState<R = unknown>(
  options?: UsePromiseStateOptions<R>,
): UsePromiseStateReturn<R> {
  const [status, setStatus] = useState<PromiseStatus>(
    options?.initialStatus ?? PromiseStatus.IDLE,
  );
  const [result, setResult] = useState<R | undefined>(undefined);
  const [error, setErrorState] = useState<unknown | undefined>(undefined);
  const isMounted = useMountedState();

  const setLoadingFn = useCallback(() => {
    if (isMounted()) {
      setStatus(PromiseStatus.LOADING);
      setErrorState(undefined);
    }
  }, [isMounted]);

  const setSuccessFn = useCallback(
    (result: R) => {
      if (isMounted()) {
        setResult(result);
        setStatus(PromiseStatus.SUCCESS);
        setErrorState(undefined);
        options?.onSuccess?.(result);
      }
    },
    [isMounted, options],
  );

  const setErrorFn = useCallback(
    (error: unknown) => {
      if (isMounted()) {
        setErrorState(error);
        setStatus(PromiseStatus.ERROR);
        setResult(undefined);
        options?.onError?.(error);
      }
    },
    [isMounted, options],
  );

  const setIdleFn = useCallback(() => {
    if (isMounted()) {
      setStatus(PromiseStatus.IDLE);
      setErrorState(undefined);
      setResult(undefined);
    }
  }, [isMounted]);

  return {
    status,
    loading: status === PromiseStatus.LOADING,
    result,
    error,
    setLoading: setLoadingFn,
    setSuccess: setSuccessFn,
    setError: setErrorFn,
    setIdle: setIdleFn,
  };
}
