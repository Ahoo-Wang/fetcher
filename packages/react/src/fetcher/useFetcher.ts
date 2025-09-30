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

/**
 * Configuration options for the useFetcher hook.
 * Extends RequestOptions and FetcherCapable interfaces.
 */
export interface UseFetcherOptions extends RequestOptions, FetcherCapable {

}

/**
 * The result object returned by the useFetcher hook.
 * @template R - The type of the data returned by the fetch operation
 */
export interface UseFetcherResult<R> {
  /** Indicates if the fetch operation is currently in progress */
  loading: boolean;

  /** The FetchExchange object representing the ongoing fetch operation */
  exchange?: FetchExchange;

  /** The data returned by the fetch operation, or undefined if not yet loaded or an error occurred */
  result?: R;

  /** Any error that occurred during the fetch operation, or undefined if no error */
  error?: unknown;

  execute: (request: FetchRequest) => Promise<void>;

  /** Function to cancel the ongoing fetch operation */
  cancel: () => void;
}

export function useFetcher<R>(
  options?: UseFetcherOptions,
): UseFetcherResult<R> {
  const { fetcher = defaultFetcher } = options || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(
    undefined,
  );
  const [result, setResult] = useState<R | undefined>(undefined);
  const isMounted = useMountedState();
  const abortControllerRef = useRef<AbortController | undefined>();

  const currentFetcher = getFetcher(fetcher);
  /**
   * Execute the fetch operation.
   * Cancels any ongoing fetch before starting a new one.
   */
  const execute = useCallback(async (request: FetchRequest) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current =
      request.abortController ?? new AbortController();
    request.abortController = abortControllerRef.current;
    if (isMounted()) {
      setLoading(true);
      setError(undefined);
    }
    try {
      const exchange = await currentFetcher.exchange(request, options);
      if (isMounted()) {
        setExchange(exchange);
      }
      const result = await exchange.extractResult<R>();
      if (isMounted()) {
        setResult(result);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (isMounted()) {
        setError(error);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
      if (abortControllerRef.current === request.abortController) {
        abortControllerRef.current = undefined;
      }
    }
  }, [currentFetcher, isMounted, options]);
  /**
   * Cancel the ongoing fetch operation if one is in progress.
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = undefined;
    };
  }, [execute]);
  return {
    loading,
    exchange,
    result,
    error,
    execute,
    cancel,
  };
}
