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
  RequestOptions,
  FetcherError,
} from '@ahoo-wang/fetcher';
import { DebounceCapable, useMounted, useDebouncedCallback } from '../core';
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
 * This interface extends several other interfaces to provide comprehensive configuration
 * for fetch operations, including request options, fetcher selection, promise state management,
 * and debouncing capabilities.
 *
 * @template R - The type of the expected response data
 * @template E - The type of error that may occur (defaults to FetcherError)
 */
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions,
    FetcherCapable,
    UsePromiseStateOptions<R, E>,
    DebounceCapable {}

/**
 * Return type for the useFetcher hook.
 * Provides access to the current fetch state, the ongoing exchange, and control functions.
 *
 * @template R - The type of the expected response data
 * @template E - The type of error that may occur (defaults to FetcherError)
 */
export interface UseFetcherReturn<R, E = FetcherError>
  extends PromiseState<R, E> {
  /**
   * The FetchExchange object representing the ongoing or completed fetch operation.
   * Contains request/response details and can be used to extract additional data.
   * Undefined when no fetch operation is active or has completed.
   */
  exchange?: FetchExchange;
  /**
   * Function to execute a fetch request.
   * Supports debouncing if configured in options.
   * Automatically cancels any previous ongoing request.
   *
   * @param request - The fetch request configuration including URL, method, headers, etc.
   * @returns A promise that resolves when the fetch operation completes (success or failure)
   * @throws Will not throw directly; errors are handled through the error state
   */
  execute: (request: FetchRequest) => Promise<void>;
  /**
   * Function to reset the hook state to initial values.
   * Cancels any pending debounced executions and aborts any ongoing fetch requests.
   * Sets loading to false, clears result and error, and removes the exchange.
   */
  reset: () => void;
}

/**
 * A React hook for managing asynchronous fetch operations with comprehensive state handling,
 * debouncing support, automatic cancellation, and proper cleanup.
 *
 * This hook provides a declarative way to handle HTTP requests in React components,
 * managing loading states, results, errors, and request lifecycle. It supports debouncing
 * to prevent excessive API calls, automatic request cancellation on component unmount
 * or new requests, and integrates with the fetcher ecosystem for advanced features
 * like interceptors, retries, and caching.
 *
 * @template R - The type of the expected response data
 * @template E - The type of error that may occur (defaults to FetcherError)
 * @param options - Optional configuration object for customizing fetch behavior,
 *                  including fetcher selection, debouncing settings, and state management options
 * @returns An object containing the current fetch state (loading, result, error, status),
 *          the active FetchExchange, and control functions (execute, reset)
 *
 * @example Basic GET request
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 *
 * function UserProfile({ userId }: { userId: string }) {
 *   const { loading, result: user, error, execute } = useFetcher<UserData>();
 *
 *   useEffect(() => {
 *     execute({ url: `/api/users/${userId}`, method: 'GET' });
 *   }, [userId, execute]);
 *
 *   if (loading) return 'Loading user...';
 *   if (error) return `Error: ${error.message}`;
 *   return `Welcome, ${user?.name}!`;
 * }
 * ```
 *
 * @example POST request with debouncing
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 *
 * function SearchComponent() {
 *   const { loading, result: searchResults, execute } = useFetcher<SearchResult[]>({
 *     debounce: { delay: 300 } // Debounce search requests by 300ms
 *   });
 *
 *   const handleSearch = (query: string) => {
 *     execute({
 *       url: '/api/search',
 *       method: 'POST',
 *       body: JSON.stringify({ query }),
 *       headers: { 'Content-Type': 'application/json' }
 *     });
 *   };
 *
 *   // In a real component, this would be connected to an input onChange
 *   handleSearch('search query');
 *
 *   if (loading) return 'Searching...';
 *   return searchResults?.map(result => result.title).join(', ') || 'No results';
 * }
 * ```
 *
 * @example Using custom fetcher and error handling
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 * import { myCustomFetcher } from './fetchers';
 *
 * function ApiCallComponent() {
 *   const { loading, result, error, execute, reset, status } = useFetcher<ApiResponse, CustomError>({
 *     fetcher: myCustomFetcher,
 *     onError: (err) => console.error('Fetch failed:', err),
 *     onSuccess: (data) => console.log('Success:', data)
 *   });
 *
 *   const handleSubmit = async (data: FormData) => {
 *     await execute({
 *       url: '/api/submit',
 *       method: 'POST',
 *       body: data
 *     });
 *     // Success/error handling is done via callbacks or by checking status
 *   };
 *
 *   // Example usage
 *   if (status === 'success') return 'Success!';
 *   if (status === 'error') return `Error: ${error?.message}`;
 *   return loading ? 'Submitting...' : 'Ready to submit';
 * }
 * ```
 */
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E> {
  const { fetcher = fetcherRegistrar.default } = options || {};
  const {
    loading,
    result,
    error,
    status,
    setLoading,
    setSuccess,
    setError,
    setIdle,
  } = usePromiseState<R, E>(options);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(
    undefined,
  );
  const isMounted = useMounted();
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const requestId = useRequestId();
  const latestOptions = useLatest(options);
  const currentFetcher = getFetcher(fetcher);
  const {
    delay: debounceDelay = 0,
    leading = false,
    trailing = true,
  } = options?.debounce || {};
  /**
   * Execute the fetch operation.
   * Cancels any ongoing fetch before starting a new one.
   */
  const performExecute = useCallback(
    async (request: FetchRequest) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current =
        request.abortController ?? new AbortController();
      request.abortController = abortControllerRef.current;
      const currentRequestId = requestId.generate();
      setLoading();
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
          await setSuccess(result);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (isMounted()) {
            setIdle();
          }
          return;
        }
        if (isMounted() && requestId.isLatest(currentRequestId)) {
          await setError(error as E);
        }
      } finally {
        if (abortControllerRef.current === request.abortController) {
          abortControllerRef.current = undefined;
        }
      }
    },
    [
      currentFetcher,
      isMounted,
      latestOptions,
      setLoading,
      setSuccess,
      setError,
      setIdle,
      requestId,
    ],
  );

  const debouncedPerformExecute = useDebouncedCallback(performExecute, {
    delay: debounceDelay,
    leading,
    trailing,
  });

  const execute = useCallback(
    async (request: FetchRequest) => {
      if (debounceDelay > 0) {
        debouncedPerformExecute.run(request);
      } else {
        await performExecute(request);
      }
    },
    [debounceDelay, debouncedPerformExecute, performExecute],
  );

  const reset = useCallback(() => {
    debouncedPerformExecute.cancel();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
    if (isMounted()) {
      setExchange(undefined);
      setIdle();
    }
  }, [debouncedPerformExecute, isMounted, setIdle]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);
  return useMemo(
    () => ({
      loading: loading,
      result: result,
      error: error,
      status: status,
      exchange,
      execute,
      reset,
    }),
    [loading, result, status, error, exchange, execute, reset],
  );
}
