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
  UsePromiseStateOptions,
  useLatest,
  UseExecutePromiseReturn,
} from '../core';
import { useCallback, useState } from 'react';

/**
 * Configuration for a query state field.
 * @template T - The type of the field value.
 */
export interface QueryStateField<T = any> {
  /**
   * The initial value for the field.
   */
  initialValue: T;
  /**
   * Optional setter function name. If not provided, defaults to `set${FieldName}`.
   */
  setterName?: string;
}

/**
 * Configuration for query state fields.
 */
export interface QueryStateConfig {
  [fieldName: string]: QueryStateField;
}

/**
 * Options for the useQuery hook.
 * @template RESULT - The type of the query result.
 * @template QUERY - The type of the query object.
 * @template FIELDS - The type of the fields used in conditions and projections.
 * @template E - The type of the error.
 */
export interface UseQueryOptions<RESULT, QUERY, E = unknown>
  extends UsePromiseStateOptions<RESULT, E> {
  /**
   * The initial query configuration.
   */
  initialQuery: QUERY;
  /**
   * Configuration for state fields that can be updated.
   */
  stateFields: QueryStateConfig;
  /**
   * Function to build the query object from current state.
   * @param state - The current state values.
   * @returns The query object.
   */
  buildQuery: (state: Record<string, any>) => QUERY;
  /**
   * The function to execute the query.
   * @param query - The query object.
   * @param attributes - Optional additional attributes.
   * @returns A promise that resolves to the result.
   */
  executeQuery: (
    query: QUERY,
    attributes?: Record<string, any>,
  ) => Promise<RESULT>;
  /**
   * Optional additional attributes to pass to the executeQuery function.
   */
  attributes?: Record<string, any>;
}

/**
 * Return type for the useQuery hook.
 * @template RESULT - The type of the query result.
 * @template FIELDS - The type of the fields used in conditions and projections.
 * @template E - The type of the error.
 */
export interface UseQueryReturn<RESULT, E = unknown>
  extends UseExecutePromiseReturn<RESULT, E> {
  /**
   * Executes the query.
   * @returns A promise that resolves to the result or an error.
   */
  execute: () => Promise<E | RESULT>;

  /**
   * Additional methods for updating query state (added dynamically based on stateFields).
   */
  [key: string]: any;
}

/**
 * A generic React hook for managing queries with state management for various query parameters.
 * This hook provides a common implementation that can be used by specific query hooks.
 * @template RESULT - The type of the query result.
 * @template QUERY - The type of the query object.
 * @template FIELDS - The type of the fields used in conditions and projections.
 * @template E - The type of the error.
 * @param options - The options for the hook.
 * @returns An object containing the query state and methods to update it.
 */
export function useQuery<RESULT, QUERY, E = unknown>(
  options: UseQueryOptions<RESULT, QUERY, E>,
): UseQueryReturn<RESULT, E> {
  const { stateFields } = options;
  const promiseState = useExecutePromise<RESULT, E>(options);
  const latestOptions = useLatest(options);

  // Initialize state for each field
  const stateEntries = Object.entries(stateFields);
  const stateReducers = stateEntries.map(([fieldName, fieldConfig]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setter] = useState(fieldConfig.initialValue);
    return { fieldName, value, setter };
  });

  // Create state object
  const currentState = Object.fromEntries(
    stateReducers.map(({ fieldName, value }) => [fieldName, value]),
  );

  // Create query executor
  const queryExecutor = useCallback(async (): Promise<RESULT> => {
    const queryRequest = latestOptions.current.buildQuery(currentState);
    return latestOptions.current.executeQuery(
      queryRequest,
      latestOptions.current.attributes,
    );
  }, [currentState, latestOptions]);

  // Create execute function
  const execute = useCallback(() => {
    return promiseState.execute(queryExecutor);
  }, [promiseState, queryExecutor]);

  // Create setter functions
  const setters = Object.fromEntries(
    stateReducers.map(({ fieldName, setter }) => {
      const setterName =
        stateFields[fieldName].setterName ||
        `set${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
      return [setterName, setter];
    }),
  );

  return {
    ...promiseState,
    execute,
    ...setters,
  };
}
