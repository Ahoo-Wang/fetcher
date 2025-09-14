import { useRef } from 'react';

/**
 * A React hook that returns a function to check if the component is mounted.
 * Useful for avoiding state updates on unmounted components.
 */
export function useMountedState(): () => boolean {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return () => isMounted.current;
}

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
  FetchRequest, getFetcher,
  RequestOptions,
} from '@ahoo-wang/fetcher';
import { DependencyList, useCallback, useEffect, useState } from 'react';

/**
 * Configuration options for the useFetcher hook.
 * Extends RequestOptions and FetcherCapable interfaces.
 */
export interface UseFetcherOptions extends RequestOptions, FetcherCapable {
  /**
   * Dependencies list for the fetch operation.
   * When provided, the hook will re-fetch when any of these values change.
   */
  readonly deps?: DependencyList;

  /**
   * Whether the fetch operation should execute immediately upon component mount.
   * Defaults to true.
   */
  readonly immediate?: boolean;
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
  error?: Error | unknown;

  /**
   * Function to manually trigger the fetch operation.
   * Useful for fetching data on demand rather than automatically.
   */
  execute: () => Promise<void>;

  /** Function to cancel the ongoing fetch operation */
  cancel: () => void;
}

export function useFetcher<R>(request: FetchRequest, options?: UseFetcherOptions): UseFetcherResult<R> {
  const { deps = [], fetcher = defaultFetcher, immediate = true } = options || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined | unknown>(undefined);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(undefined);
  const [result, setResult] = useState<R | undefined>(undefined);
  const isMounted = useMountedState();
  const abortControllerRef = useRef<AbortController | undefined>();

  const currentFetcher = getFetcher(fetcher);
  /**
   * Execute the fetch operation.
   * Cancels any ongoing fetch before starting a new one.
   */
  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = request.abortController ?? new AbortController();
    request.abortController = abortControllerRef.current;
    setLoading(true);
    setError(undefined);
    try {
      const exchange = await currentFetcher.exchange(request, options);
      setExchange(exchange);
      const result = await exchange.extractResult<R>();
      if (isMounted()) {
        setResult(result);
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }
      if (isMounted()) {
        setError(error);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
      abortControllerRef.current = undefined;
    }
  }, [fetcher, isMounted, ...deps]);
  /**
   * Cancel the ongoing fetch operation if one is in progress.
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);
  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = undefined;
    };
  }, [execute, immediate, request, ...deps]);
  return {
    loading, exchange, result, error, execute, cancel,
  };
}