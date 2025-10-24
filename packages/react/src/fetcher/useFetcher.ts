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

import {
  fetcherRegistrar,
  FetcherCapable,
  FetchExchange,
  FetchRequest,
  getFetcher,
  RequestOptions, FetcherError,
} from '@ahoo-wang/fetcher';
import { useMounted } from '../core';
import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import {
  PromiseState,
  useLatest,
  usePromiseState,
  UsePromiseStateOptions,
  useRequestId,
} from '../core';

/**
 * Configuration options for the useFetcher hook.
 * Extends RequestOptions and FetcherCapable interfaces.
 */
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions,
    FetcherCapable,
    UsePromiseStateOptions<R, E> {
}

export interface UseFetcherReturn<R, E = FetcherError> extends PromiseState<R, E> {
  /** The FetchExchange object representing the ongoing fetch operation */
  exchange?: FetchExchange;
  execute: (request: FetchRequest) => Promise<void>;
}

/**
 * A React hook for managing asynchronous operations with proper state handling
 * @param options - Configuration options for the fetcher
 * @returns An object containing the current state and control functions
 *
 * @example
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 *
 * function MyComponent() {
 *   const { loading, result, error, execute } = useFetcher<string>();
 *
 *   const handleFetch = () => {
 *     execute({ url: '/api/data', method: 'GET' });
 *   };
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return (
 *     <div>
 *       <button onClick={handleFetch}>Fetch Data</button>
 *       {result && <p>{result}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E> {
  const { fetcher = fetcherRegistrar.default } = options || {};
  const state = usePromiseState<R, E>(options);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(
    undefined,
  );
  const isMounted = useMounted();
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const requestId = useRequestId();
  const latestOptions = useLatest(options);
  const currentFetcher = getFetcher(fetcher);
  /**
   * Execute the fetch operation.
   * Cancels any ongoing fetch before starting a new one.
   */
  const execute = useCallback(
    async (request: FetchRequest) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current =
        request.abortController ?? new AbortController();
      request.abortController = abortControllerRef.current;
      const currentRequestId = requestId.generate();
      state.setLoading();
      try {
        const exchange = await currentFetcher.exchange(
          request,
          latestOptions.current,
        );
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          setExchange(exchange);
        }
        const result = await exchange.extractResult<R>();
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await state.setSuccess(result);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (isMounted()) {
            state.setIdle();
          }
          return;
        }
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await state.setError(error as E);
        }
      } finally {
        if (abortControllerRef.current === request.abortController) {
          abortControllerRef.current = undefined;
        }
      }
    },
    [currentFetcher, isMounted, latestOptions, state, requestId],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = undefined;
    };
  }, []);
  return useMemo(
    () => ({
      ...state,
      exchange,
      execute,
    }),
    [state, exchange, execute],
  );
}
