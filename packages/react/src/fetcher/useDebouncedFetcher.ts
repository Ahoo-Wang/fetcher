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

import { useFetcher, UseFetcherOptions, UseFetcherReturn } from './useFetcher';
import { FetcherError } from '@ahoo-wang/fetcher';
import {
  DebounceCapable,
  useDebouncedCallback,
  UseDebouncedCallbackReturn,
} from '../core';
import { useMemo } from 'react';

/**
 * Configuration options for the useDebouncedFetcher hook.
 * Extends UseFetcherOptions with debouncing capabilities to control the rate
 * at which fetch requests are executed.
 *
 * @template R - The type of the fetch result
 * @template E - The type of the error (defaults to FetcherError)
 */
export interface UseDebouncedFetcherOptions<R, E = FetcherError>
  extends UseFetcherOptions<R, E>,
    DebounceCapable {}

/**
 * Return type of the useDebouncedFetcher hook.
 * Provides the same state properties as useFetcher (except execute) along with
 * debounced execution controls.
 *
 * @template R - The type of the fetch result
 * @template E - The type of the error (defaults to FetcherError)
 */
export interface UseDebouncedFetcherReturn<R, E = FetcherError>
  extends Omit<UseFetcherReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseFetcherReturn<R, E>['execute']> {}

/**
 * A React hook that provides a debounced version of the useFetcher hook.
 * This hook wraps the fetcher's execute function with debouncing to prevent
 * excessive API calls during rapid user interactions, such as typing in a search field.
 *
 * The debouncing behavior is controlled by the `debounce` option, which specifies
 * the delay and whether to execute on the leading edge, trailing edge, or both.
 *
 * @template R - The type of the fetch result
 * @template E - The type of the error (defaults to FetcherError)
 * @param options - Configuration options including fetcher settings and debounce parameters
 * @returns An object containing the fetch state and debounced execution controls
 *
 * @throws {Error} If the debounce delay is not a positive number
 * @throws {Error} If the fetcher configuration is invalid
 *
 * @example
 * ```typescript
 * import { useDebouncedFetcher } from '@ahoo-wang/fetcher-react';
 *
 * function SearchComponent() {
 *   const { loading, result, error, run, cancel, isPending } = useDebouncedFetcher<string>({
 *     debounce: { delay: 300, trailing: true },
 *     onSuccess: (data) => console.log('Search results:', data),
 *     onError: (err) => console.error('Search failed:', err),
 *   });
 *
 *   const handleSearch = (query: string) => {
 *     if (query.trim()) {
 *       run({ url: `/api/search?q=${encodeURIComponent(query)}`, method: 'GET' });
 *     } else {
 *       cancel(); // Cancel any pending search
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         placeholder="Search..."
 *         onChange={(e) => handleSearch(e.target.value)}
 *       />
 *       {isPending() && <div>Searching...</div>}
 *       {loading && <div>Loading...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {result && <div>Results: {result}</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Debounced form submission
 * ```typescript
 * const { run, cancel, isPending } = useDebouncedFetcher({
 *   debounce: { delay: 500, leading: false, trailing: true },
 *   onSuccess: () => console.log('Form submitted successfully'),
 * });
 *
 * const handleSubmit = (formData: FormData) => {
 *   run({
 *     url: '/api/submit',
 *     method: 'POST',
 *     body: formData,
 *   });
 * };
 * ```
 */
export function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E> {
  const { loading, result, error, status, exchange, execute } = useFetcher<
    R,
    E
  >(options);
  const { run, cancel, isPending } = useDebouncedCallback(
    execute,
    options.debounce,
  );
  return useMemo(
    () => ({
      loading,
      result,
      error,
      status,
      exchange,
      run,
      cancel,
      isPending,
    }),
    [loading, result, error, status, exchange, run, cancel, isPending],
  );
}
