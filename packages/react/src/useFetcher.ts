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

import { useEffect, useRef, useState } from 'react';
import type { FetchRequest, Fetcher } from '@ahoo-wang/fetcher';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import type { FetcherState, UseFetcherOptions } from './types';

/**
 * A React hook for making HTTP requests with Fetcher.
 *
 * This hook manages the complete lifecycle of an HTTP request, including
 * loading states, error handling, and data management.
 *
 * @template DataType - The expected type of the response data
 * @param request - The request configuration or a function that returns a request configuration
 * @param options - Configuration options for the hook
 * @returns The current state of the request and a function to manually trigger the request
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, loading, error } = useFetcher<User[]>({
 *   url: '/api/users',
 *   method: 'GET'
 * });
 *
 * // With manual execution
 * const { data, loading, error, execute } = useFetcher(
 *   { url: '/api/users' },
 *   { autoExecute: false }
 * );
 *
 * // With dynamic URL based on props
 * const { data, loading, error } = useFetcher((signal) => ({
 *   url: `/api/users/${userId}`,
 *   signal
 * }));
 * ```
 */
export function useFetcher<DataType = any>(
  request: FetchRequest | ((signal: AbortSignal) => FetchRequest | Promise<FetchRequest>),
  options: UseFetcherOptions = {},
): FetcherState<DataType> & { execute: () => Promise<Response | undefined> } {
  const { autoExecute = true, deps = [], fetcher: customFetcher } = options;
  const [state, setState] = useState<FetcherState<DataType>>({
    loading: false,
  });

  const fetcherRef = useRef<Fetcher>(customFetcher ?? fetcherRegistrar.default);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute the request manually or automatically.
   *
   * @returns A promise that resolves to the fetch response or undefined if cancelled
   */
  const execute = async (): Promise<Response | undefined> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const resolvedRequest = typeof request === 'function'
        ? await request(abortController.signal)
        : request;

      // Merge the abort signal with the request
      const finalRequest = {
        ...resolvedRequest,
        signal: abortController.signal,
      };

      const response = await fetcherRef.current.fetch(finalRequest.url, finalRequest);

      // Check if the request was cancelled
      if (!abortController.signal.aborted) {
        // Try to parse JSON data from response
        let data: DataType | undefined;
        try {
          data = await response.json<DataType>();
        } catch (e) {
          // If parsing fails, leave data as undefined
        }

        setState({
          loading: false,
          data,
          response,
        });
      }

      return response;
    } catch (error: any) {
      // Don't update state if the request was cancelled
      if (!abortController.signal.aborted) {
        setState({
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      return undefined;
    }
  };

  useEffect(() => {
    if (autoExecute) {
      execute();
    }

    // Cleanup function to cancel any ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  return {
    ...state,
    execute,
  };
}