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

import { Condition } from '@ahoo-wang/fetcher-wow';
import { UsePromiseStateOptions, UseExecutePromiseReturn } from '../core';
import { useQuery } from './useQuery';

/**
 * Options for the useCountQuery hook.
 * @template FIELDS - The type of the fields used in conditions.
 * @template E - The type of the error.
 */
export interface UseCountQueryOptions<
  FIELDS extends string = string,
  E = unknown,
> extends UsePromiseStateOptions<number, E> {
  /**
   * The initial condition for the count query.
   */
  initialCondition: Condition<FIELDS>;
  /**
   * The function to execute the count query.
   * @param condition - The condition to filter resources.
   * @param attributes - Optional additional attributes.
   * @returns A promise that resolves to the count of matching resources.
   */
  count: (
    condition: Condition<FIELDS>,
    attributes?: Record<string, any>,
  ) => Promise<number>;
  /**
   * Optional additional attributes to pass to the count function.
   */
  attributes?: Record<string, any>;
}

/**
 * Return type for the useCountQuery hook.
 * @template FIELDS - The type of the fields used in conditions.
 * @template E - The type of the error.
 */
export interface UseCountQueryReturn<
  FIELDS extends string = string,
  E = unknown,
> extends UseExecutePromiseReturn<number, E> {
  /**
   * Executes the count query.
   * @returns A promise that resolves to the count or an error.
   */
  execute: () => Promise<E | number>;
  /**
   * Sets the condition for the query.
   * @param condition - The new condition.
   */
  setCondition: (condition: Condition<FIELDS>) => void;
}

/**
 * A React hook for managing count queries with state management for conditions.
 * @template FIELDS - The type of the fields used in conditions.
 * @template E - The type of the error.
 * @param options - The options for the hook.
 * @returns An object containing the query state and methods to update it.
 * @example
 * ```typescript
 * const { data, loading, error, execute, setCondition } = useCountQuery({
 *   initialCondition: {},
 *   count: async (condition) => fetchCount(condition),
 * });
 * ```
 */
export function useCountQuery<FIELDS extends string = string, E = unknown>(
  options: UseCountQueryOptions<FIELDS, E>,
): UseCountQueryReturn<FIELDS> {
  const { initialCondition, count } = options;

  return useQuery<number, Condition<FIELDS>, E>({
    ...options,
    initialQuery: initialCondition,
    stateFields: {
      condition: { initialValue: initialCondition },
    },
    buildQuery: ({ condition }) => condition,
    executeQuery: count,
  }) as UseCountQueryReturn<FIELDS, E>;
}
