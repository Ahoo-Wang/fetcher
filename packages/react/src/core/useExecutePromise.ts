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

import { useCallback, useEffect, useRef } from 'react';
import type { FetcherError } from '@ahoo-wang/fetcher';
import type {
  PromiseState,
  UsePromiseStateOptions,
} from './usePromiseState.js';
import {
  errorState,
  idleState,
  successState,
  usePromiseState,
} from './usePromiseState.js';
import { useLatest } from './useLatest.js';

export interface UseExecutePromiseOptions<
  R,
  E = FetcherError,
> extends UsePromiseStateOptions {
  /** Called once the current execution succeeds; awaited by `execute`. */
  onSuccess?: (result: R) => void | Promise<void>;
  /** Called once the current execution fails; awaited by `execute`. */
  onError?: (error: E) => void | Promise<void>;
  /**
   * Called when an execution in flight is cancelled: replaced by a newer one,
   * by `abort()`/`reset()`, or by unmounting.
   */
  onAbort?: () => void;
}

/** Starts the work; it should stop when the controller aborts. */
export type PromiseSupplier<R> = (
  abortController: AbortController,
) => Promise<R>;

export interface UseExecutePromiseReturn<
  R,
  E = FetcherError,
> extends PromiseState<R, E> {
  /**
   * Cancels the execution in flight and runs `supplier`. Never rejects: it
   * resolves to the state this execution ended in, `idle` when it was
   * cancelled. After unmounting it resolves to `idle` without running
   * `supplier`.
   */
  execute: (supplier: PromiseSupplier<R>) => Promise<PromiseState<R, E>>;
  /** Cancels the execution in flight, if any, which returns to `idle`. */
  abort: () => void;
  /** Cancels the execution in flight and returns to `idle`. */
  reset: () => void;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

/** Runs a user callback; its failure is reported, never thrown. */
async function invokeCallback<T>(
  name: string,
  callback: ((value: T) => void | Promise<void>) | undefined,
  value: T,
): Promise<void> {
  try {
    await callback?.(value);
  } catch (callbackError) {
    console.error(`useExecutePromise ${name} callback error:`, callbackError);
  }
}

type Settled<R> = { ok: true; result: R } | { ok: false; error: unknown };

// Kept outside the hook: React Compiler does not compile hooks with try/catch.
async function settle<R>(
  supplier: PromiseSupplier<R>,
  controller: AbortController,
): Promise<Settled<R>> {
  try {
    return { ok: true, result: await supplier(controller) };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Runs promises one at a time and tracks the latest one's state.
 *
 * Each execution is identified by its `AbortController`: only the execution
 * whose controller is current may write state, and every cancellation —
 * a newer execution, `abort()`, `reset()`, unmounting — aborts it.
 */
export function useExecutePromise<R = unknown, E = FetcherError>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E> {
  const { setLoading, setSuccess, setError, setIdle, ...state } =
    usePromiseState<R, E>(options);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  // Set once unmounted: nothing would cancel a new execution any more.
  const disposedRef = useRef(false);
  const latestOptions = useLatest(options);

  /** Aborts the execution in flight; `true` if there was one. */
  const cancel = useCallback((): boolean => {
    const controller = controllerRef.current;
    if (!controller) return false;
    controllerRef.current = undefined;
    controller.abort();
    invokeCallback('onAbort', latestOptions.current?.onAbort, undefined);
    return true;
  }, [latestOptions]);

  const execute = useCallback(
    async (supplier: PromiseSupplier<R>): Promise<PromiseState<R, E>> => {
      if (disposedRef.current) return idleState();
      cancel();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading();
      const settled = await settle(supplier, controller);
      if (controllerRef.current !== controller) return idleState();
      controllerRef.current = undefined;
      if (settled.ok) {
        setSuccess(settled.result);
        await invokeCallback(
          'onSuccess',
          latestOptions.current?.onSuccess,
          settled.result,
        );
        return successState(settled.result);
      }
      const error = settled.error as E;
      // Aborted by a signal of the caller's own.
      if (isAbortError(error)) {
        setIdle();
        return idleState();
      }
      setError(error);
      await invokeCallback('onError', latestOptions.current?.onError, error);
      return errorState(error);
    },
    [cancel, setLoading, setSuccess, setError, setIdle, latestOptions],
  );

  const abort = useCallback(() => {
    if (cancel()) setIdle();
  }, [cancel, setIdle]);

  const reset = useCallback(() => {
    cancel();
    setIdle();
  }, [cancel, setIdle]);

  // Unmounting cancels. Under StrictMode the component survives the simulated
  // unmount, so the cancelled execution must leave `loading` too.
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      abort();
    };
  }, [abort]);

  return { ...state, execute, abort, reset };
}
