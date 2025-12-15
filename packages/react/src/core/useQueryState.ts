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
import { AutoExecuteCapable } from '../types';

export interface QueryOptions<Q> {
  /** The initial query parameters to be stored and managed */
  initialQuery?: Q;
  /** The current query parameters. If provided, overrides initialQuery and updates the state. */
  query?: Q;
}

/**
 * Configuration options for the useQueryState hook
 * @template Q - The type of the query parameters
 */
export interface UseQueryStateOptions<Q>
  extends QueryOptions<Q>, AutoExecuteCapable {
  /** Function to execute with the current query parameters. Called when autoExecute is true */
  execute: (query: Q) => Promise<void>;
}

/**
 * Return type of the useQueryState hook
 * @template Q - The type of the query parameters
 */
export interface UseQueryStateReturn<Q> {
  /** Function to retrieve the current query parameters */
  getQuery: () => Q;
  /** Function to update the query parameters. Triggers execution if autoExecute is true */
  setQuery: (query: Q) => void;
}

/**
 * A React hook for managing query state with automatic execution capabilities
 *
 * This hook provides a centralized way to manage query parameters, including
 * getting and setting the current query, and optionally automatically executing
 * queries when the query changes or on component mount.
 *
 * @template Q - The type of the query parameters, which can be any object type representing query data
 * @param options - Configuration options for the hook
 * @param options.initialQuery - Optional initial query parameters to be stored and managed. Used if no query is provided.
 * @param options.query - Optional current query parameters. If provided, overrides initialQuery and updates the state.
 * @param options.autoExecute - Boolean flag indicating whether to automatically execute the query on mount or when query changes. Defaults to true.
 * @param options.execute - Function to execute with the current query parameters. Called when autoExecute is true and query changes.
 * @returns An object containing functions to manage the query state
 * @returns getQuery - Function that returns the current query parameters of type Q
 * @returns setQuery - Function that updates the query parameters and triggers execution if autoExecute is enabled
 *
 * @example
 * ```typescript
 * interface UserQuery {
 *   id: string;
 *   name?: string;
 * }
 *
 * function UserComponent() {
 *   const executeQuery = async (query: UserQuery) => {
 *     // Perform query execution logic here
 *     console.log('Executing query:', query);
 *   };
 *
 *   const { getQuery, setQuery } = useQueryState<UserQuery>({
 *     initialQuery: { id: '1' },
 *     autoExecute: true,
 *     execute: executeQuery,
 *   });
 *
 *   const handleQueryChange = (newQuery: UserQuery) => {
 *     setQuery(newQuery); // Will automatically execute if autoExecute is true
 *   };
 *
 *   const currentQuery = getQuery(); // Get current query parameters
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleQueryChange({ id: '2', name: 'John' })}>
 *         Update Query
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * // Example with autoExecute disabled
 * const { getQuery, setQuery } = useQueryState<UserQuery>({
 *   initialQuery: { id: '1' },
 *   autoExecute: false,
 *   execute: executeQuery,
 * });
 *
 * // Manually trigger execution
 * setQuery({ id: '2' });
 * executeQuery(getQuery());
 *
 * @throws {Error} Throws an error if neither initialQuery nor query is provided in the options.
 * @throws Exceptions may also be thrown by the execute function if it encounters errors during query execution.
 */
export function useQueryState<Q>(
  options: UseQueryStateOptions<Q>,
): UseQueryStateReturn<Q> {
  const { initialQuery, query, autoExecute = true, execute } = options;
  const queryOptions = query ?? initialQuery;
  if (queryOptions === undefined) {
    throw new Error('Either initialQuery or query must be provided.');
  }
  const queryRef = useRef<Q>(queryOptions);

  const getQuery = useCallback(() => {
    return queryRef.current;
  }, []);

  const executeWrapper = useCallback(() => {
    if (autoExecute) {
      execute(getQuery());
    }
  }, [autoExecute, execute, getQuery]);
  const setQuery = useCallback(
    (query: Q) => {
      queryRef.current = query;
      executeWrapper();
    },
    [queryRef, executeWrapper],
  );

  useEffect(() => {
    if (query) {
      queryRef.current = query;
    }
    executeWrapper();
  }, [executeWrapper, query]);

  return { getQuery, setQuery };
}
