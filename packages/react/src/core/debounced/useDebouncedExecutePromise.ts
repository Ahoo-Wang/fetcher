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
  useExecutePromise,
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from '../useExecutePromise';
import {
  useDebouncedCallback,
  UseDebouncedCallbackOptions,
  UseDebouncedCallbackReturn,
} from './useDebouncedCallback';
import { FetcherError } from '@ahoo-wang/fetcher';
import { useMemo } from 'react';

/**
 * Interface for objects that support debouncing configuration.
 * This interface defines the structure for debounce settings that can be applied
 * to promise execution to control the timing and behavior of debounced calls.
 */
export interface DebounceCapable {
  /**
   * Debounce options for execute calls, including delay and leading/trailing behavior.
   * Specifies how the debouncing should work, such as the delay duration and whether
   * to execute on the leading edge, trailing edge, or both.
   */
  debounce: UseDebouncedCallbackOptions;
}

/**
 * Options for configuring the useDebouncedExecutePromise hook.
 * Combines promise execution options with debouncing capabilities to provide
 * fine-grained control over asynchronous operations with rate limiting.
 *
 * @template R - The type of the promise result
 * @template E - The type of the error (defaults to unknown)
 */
export interface UseDebouncedExecutePromiseOptions<R, E = unknown>
  extends UseExecutePromiseOptions<R, E>,
    DebounceCapable {}

/**
 * Return type for the useDebouncedExecutePromise hook.
 * Provides access to the promise execution state and debounced execution controls,
 * allowing components to trigger debounced promises and monitor their progress.
 *
 * @template R - The type of the promise result
 * @template E - The type of the error (defaults to unknown)
 */
export interface UseDebouncedExecutePromiseReturn<R, E = unknown>
  extends Omit<UseExecutePromiseReturn<R, E>, 'execute'>,
    UseDebouncedCallbackReturn<UseExecutePromiseReturn<R, E>['execute']> {}

/**
 * A React hook that combines promise execution with debouncing functionality.
 * This hook prevents excessive API calls by debouncing the execution of promises,
 * which is particularly useful for scenarios like search inputs, form submissions,
 * or any rapid user interactions that trigger asynchronous operations.
 *
 * The hook integrates the useExecutePromise hook for promise management with
 * useDebouncedCallback for rate limiting, providing a seamless way to handle
 * debounced asynchronous operations in React components.
 *
 * @template R - The type of the promise result (defaults to unknown)
 * @template E - The type of the error (defaults to FetcherError)
 * @param options - Configuration object containing:
 *   - All options from UseExecutePromiseOptions (promise execution settings)
 *   - debounce: Debounce configuration including delay, leading/trailing behavior
 * @returns An object containing:
 *   - loading: Boolean indicating if the promise is currently executing
 *   - result: The resolved value of the promise (R)
 *   - error: Any error that occurred during execution (E)
 *   - status: Current execution status ('idle' | 'pending' | 'fulfilled' | 'rejected')
 *   - run: Debounced function to execute the promise with provided arguments
 *   - cancel: Function to cancel any pending debounced execution
 *   - isPending: Boolean indicating if a debounced call is pending
 *   - reset: Function to reset the hook state to initial values
 * @throws {FetcherError} When the underlying promise execution fails and no custom error handler is provided
 * @throws {Error} When invalid options are provided or debounce configuration is malformed
 *
 * @example
 * ```tsx
 * import { useDebouncedExecutePromise } from '@ahoo-wang/fetcher-react';
 *
 * function SearchComponent() {
 *   const { loading, result, error, run } = useDebouncedExecutePromise({
 *     debounce: { delay: 300 },
 *   });
 *
 *   const handleSearch = (query: string) => {
 *     run(async () => {
 *       const response = await fetch(`/api/search?q=${query}`);
 *       return response.json();
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => handleSearch(e.target.value)} />
 *       {loading && <p>Searching...</p>}
 *       {result && <ul>{result.map(item => <li key={item.id}>{item.name}</li>)}</ul>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E> {
  const { loading, result, error, execute, reset, abort, status } =
    useExecutePromise(options);
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
      reset,
      abort,
      run,
      cancel,
      isPending,
    }),
    [loading, result, error, status, reset, abort, run, cancel, isPending],
  );
}
