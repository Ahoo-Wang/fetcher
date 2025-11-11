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
import {
  useExecutePromise,
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from '../core';
import { useCallback, useState, useMemo } from 'react';
import { useLatest } from '../core';

/**
 * Configuration options for the useFetcher hook.
 * Combines request configuration, fetcher selection, and promise state management options.
 *
 * @template R - The type of the expected result from the fetch operation
 * @template E - The type of error that may be thrown (defaults to FetcherError)
 */
export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions,
    FetcherCapable,
    UseExecutePromiseOptions<R, E> {
}

/**
 * Return type of the useFetcher hook.
 * Provides access to the current fetch state, result data, and control functions.
 *
 * @template R - The type of the expected result from the fetch operation
 * @template E - The type of error that may be thrown (defaults to FetcherError)
 */
export interface UseFetcherReturn<R, E = FetcherError>
  extends Omit<UseExecutePromiseReturn<R, E>, 'execute'> {
  /**
   * The FetchExchange object representing the current or most recent fetch operation.
   * Contains request/response details, timing information, and extracted data.
   * Undefined when no fetch operation has been performed.
   */
  exchange?: FetchExchange;

  /**
   * Function to execute a fetch request with automatic abort support.
   * Automatically cancels any ongoing request before starting a new one using AbortController.
   * The abort controller is automatically passed to the underlying fetch operation.
   *
   * @param request - The fetch request configuration including URL, method, headers, etc.
   * @returns Promise that resolves when the fetch operation completes (success or failure)
   */
  execute: (request: FetchRequest) => Promise<void>;
}

/**
 * A React hook for managing asynchronous HTTP fetch operations with comprehensive state handling,
 * race condition protection, automatic cleanup, and built-in abort support. Provides a clean interface
 * for making API calls with loading states, error handling, and request cancellation.
 *
 * Key features:
 * - Automatic request cancellation on component unmount or new requests via AbortController
 * - Race condition protection using request IDs
 * - Comprehensive state management (idle, loading, success, error)
 * - Type-safe result and error handling
 * - Integration with fetcher ecosystem for advanced features
 * - Memory leak prevention with automatic abort controller cleanup
 *
 * @template R - The type of the expected result from the fetch operation
 * @template E - The type of error that may be thrown (defaults to FetcherError)
 * @param options - Configuration options for the fetcher including request settings,
 *                  result extraction, error handling, and fetcher selection
 * @returns An object containing the current fetch state, result data, error information,
 *          and the execute function to trigger fetch operations
 *
 * @throws {FetcherError} When the fetch operation fails due to network issues,
 *                        HTTP errors, or result extraction problems
 * @throws {Error} When invalid options are provided or fetcher configuration is incorrect
 *
 * @example Basic GET request with automatic abort
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 * import { ResultExtractors } from '@ahoo-wang/fetcher';
 *
 * function UserProfile({ userId }: { userId: string }) {
 *   const { loading, result, error, execute } = useFetcher({
 *     resultExtractor: ResultExtractors.Json,
 *   });
 *
 *   const fetchUser = () => {
 *     execute({
 *       url: `/api/users/${userId}`,
 *       method: 'GET'
 *     });
 *   };
 *
 *   // Multiple calls to fetchUser() will automatically cancel previous requests
 *   // Handle loading, error, and success states in your component
 * }
 * ```
 *
 * @example POST request with error handling
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 *
 * function CreatePost() {
 *   const { loading, result, error, execute } = useFetcher({
 *     onSuccess: (data) => {
 *       console.log('Post created:', data);
 *       // Handle success (e.g., redirect, show notification)
 *     },
 *     onError: (error) => {
 *       console.error('Failed to create post:', error);
 *       // Handle error (e.g., show error message)
 *     }
 *   });
 *
 *   const handleSubmit = (postData: { title: string; content: string }) => {
 *     execute({
 *       url: '/api/posts',
 *       method: 'POST',
 *       body: JSON.stringify(postData),
 *       headers: {
 *         'Content-Type': 'application/json'
 *       }
 *     });
 *   };
 * }
 * ```
 *
 * @example Using custom fetcher instance
 * ```typescript
 * import { useFetcher } from '@ahoo-wang/fetcher-react';
 * import { getFetcher } from '@ahoo-wang/fetcher';
 *
 * // Using a named fetcher instance
 * const customFetcher = getFetcher('my-custom-fetcher');
 *
 * function CustomApiComponent() {
 *   const { loading, result, execute } = useFetcher({
 *     fetcher: customFetcher,
 *   });
 *
 *   // All requests will use the custom fetcher configuration
 *   const fetchData = () => execute({ url: '/data', method: 'GET' });
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
    execute: executePromise,
    reset,
  } = useExecutePromise<R, E>(options);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(
    undefined,
  );

  const latestOptions = useLatest(options);
  const currentFetcher = getFetcher(fetcher);
  /**
   * Execute the fetch operation with automatic abort support.
   * Cancels any ongoing fetch before starting a new one using AbortController.
   * The abort controller is automatically attached to the request for cancellation support.
   */
  const execute = useCallback(
    async (request: FetchRequest) => {
      try {
        await executePromise(async abortController => {
          request.abortController = abortController;
          const exchange = await currentFetcher.exchange(
            request,
            latestOptions.current,
          );
          setExchange(exchange);
          return await exchange.extractResult<R>();
        });
      } catch (error) {
        setExchange(undefined);
        throw error;
      }
    },
    [executePromise, currentFetcher, latestOptions],
  );

  const resetFn = useCallback(() => {
    reset();
    setExchange(undefined);
  }, [reset]);

  return useMemo(
    () => ({
      loading,
      result,
      error,
      status,
      exchange,
      execute,
      reset: resetFn,
    }),
    [loading, result, error, status, exchange, execute, resetFn],
  );
}
