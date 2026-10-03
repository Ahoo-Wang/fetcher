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

import { useCallback, useReducer } from 'react';
import type { FetcherError } from '@ahoo-wang/fetcher';

/**
 * The status of an asynchronous operation. Usable both as values
 * (`PromiseStatus.SUCCESS`) and as a literal type (`'success'`).
 */
export const PromiseStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];

export interface PromiseState<R, E = unknown> {
  status: PromiseStatus;
  /** `status === 'loading'`. */
  loading: boolean;
  /** The last result. Kept while a new execution is loading. */
  result: R | undefined;
  error: E | undefined;
}

type PromiseAction<R, E> =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; result: R }
  | { type: 'error'; error: E };

/** The state each status starts from; `loading` keeps the previous result. */
export function promiseStateReducer<R, E>(
  state: PromiseState<R, E>,
  action: PromiseAction<R, E>,
): PromiseState<R, E> {
  switch (action.type) {
    case 'idle':
      return idleState();
    case 'loading':
      return state.status === PromiseStatus.LOADING
        ? state
        : {
            status: PromiseStatus.LOADING,
            loading: true,
            result: state.result,
            error: undefined,
          };
    case 'success':
      return successState(action.result);
    case 'error':
      return errorState(action.error);
  }
}

export function idleState<R, E>(): PromiseState<R, E> {
  return {
    status: PromiseStatus.IDLE,
    loading: false,
    result: undefined,
    error: undefined,
  };
}

export function successState<R, E>(result: R): PromiseState<R, E> {
  return {
    status: PromiseStatus.SUCCESS,
    loading: false,
    result,
    error: undefined,
  };
}

export function errorState<R, E>(error: E): PromiseState<R, E> {
  return {
    status: PromiseStatus.ERROR,
    loading: false,
    result: undefined,
    error,
  };
}

export interface UsePromiseStateOptions {
  /**
   * The status of the first render, e.g. `'loading'` for a request that
   * starts on mount.
   * @default 'idle'
   */
  initialStatus?: PromiseStatus;
}

export interface UsePromiseStateReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  setLoading: () => void;
  setSuccess: (result: R) => void;
  setError: (error: E) => void;
  setIdle: () => void;
}

/**
 * The state of one asynchronous operation: `idle`, `loading`, `success` or
 * `error`, with its result or error. The setters are stable.
 */
export function usePromiseState<R = unknown, E = FetcherError>(
  options?: UsePromiseStateOptions,
): UsePromiseStateReturn<R, E> {
  const [state, dispatch] = useReducer(
    promiseStateReducer<R, E>,
    options?.initialStatus,
    (initialStatus = PromiseStatus.IDLE): PromiseState<R, E> => ({
      status: initialStatus,
      loading: initialStatus === PromiseStatus.LOADING,
      result: undefined,
      error: undefined,
    }),
  );
  const setLoading = useCallback(() => dispatch({ type: 'loading' }), []);
  const setSuccess = useCallback(
    (result: R) => dispatch({ type: 'success', result }),
    [],
  );
  const setError = useCallback(
    (error: E) => dispatch({ type: 'error', error }),
    [],
  );
  const setIdle = useCallback(() => dispatch({ type: 'idle' }), []);
  return { ...state, setLoading, setSuccess, setError, setIdle };
}
