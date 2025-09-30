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
  fetcher as defaultFetcher,
  FetcherCapable,
  FetchExchange,
  FetchRequest,
  getFetcher,
  RequestOptions,
} from '@ahoo-wang/fetcher';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useMountedState } from 'react-use';
import { PromiseState, usePromiseState } from '../core';

/**
 * Configuration options for the useFetcher hook.
 * Extends RequestOptions and FetcherCapable interfaces.
 */
export interface UseFetcherOptions extends RequestOptions, FetcherCapable {
}

export interface UseFetcherReturn<R> extends PromiseState<R> {
  /** The FetchExchange object representing the ongoing fetch operation */
  exchange?: FetchExchange;
  execute: (request: FetchRequest) => Promise<void>;
}

export function useFetcher<R>(
  options?: UseFetcherOptions,
): UseFetcherReturn<R> {
  const { fetcher = defaultFetcher } = options || {};
  const state = usePromiseState<R>();
  const [exchange, setExchange] = useState<FetchExchange | undefined>(
    undefined,
  );
  const isMounted = useMountedState();
  const abortControllerRef = useRef<AbortController | undefined>();

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
      abortControllerRef.current = request.abortController ?? new AbortController();
      request.abortController = abortControllerRef.current;
      state.setLoading();
      try {
        const exchange = await currentFetcher.exchange(request, options);
        if (isMounted()) {
          setExchange(exchange);
        }
        const result = await exchange.extractResult<R>();
        if (isMounted()) {
          state.setSuccess(result);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (isMounted()) {
            state.setIdle();
          }
          return;
        }
        if (isMounted()) {
          state.setError(error);
        }
      } finally {
        if (abortControllerRef.current === request.abortController) {
          abortControllerRef.current = undefined;
        }
      }
    },
    [currentFetcher, isMounted, options, state],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = undefined;
    };
  }, []);
  return {
    ...state,
    exchange,
    execute,
  };
}
