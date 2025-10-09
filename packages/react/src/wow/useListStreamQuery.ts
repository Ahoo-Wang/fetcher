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

import { ListQuery } from '@ahoo-wang/fetcher-wow';
import type { JsonServerSentEvent } from '@ahoo-wang/fetcher-eventstream';
import { FetcherError } from '@ahoo-wang/fetcher';
import { useQuery, UseQueryOptions, UseQueryReturn } from './useQuery';

/**
 * Options for the useListStreamQuery hook.
 * Extends UseQueryOptions with ListQuery as query key and stream of events as data type.
 *
 * @template R - The type of the result items in the stream events
 * @template FIELDS - The fields type for the list stream query
 * @template E - The error type, defaults to FetcherError
 */
export interface UseListStreamQueryOptions<
  R,
  FIELDS extends string = string,
  E = FetcherError,
> extends UseQueryOptions<
  ListQuery<FIELDS>,
  ReadableStream<JsonServerSentEvent<R>>,
  E
> {
}

/**
 * Return type for the useListStreamQuery hook.
 * Extends UseQueryReturn with ListQuery as query key and stream of events as data type.
 *
 * @template R - The type of the result items in the stream events
 * @template FIELDS - The fields type for the list stream query
 * @template E - The error type, defaults to FetcherError
 */
export interface UseListStreamQueryReturn<
  R,
  FIELDS extends string = string,
  E = FetcherError,
> extends UseQueryReturn<
  ListQuery<FIELDS>,
    ReadableStream<JsonServerSentEvent<R>>,
    E
> {
}

/**
 * Hook for querying streaming list data with conditions, projection, and sorting.
 * Wraps useQuery to provide type-safe streaming list queries.
 *
 * @template R - The type of the result items in the stream events
 * @template FIELDS - The fields type for the list stream query
 * @template E - The error type, defaults to FetcherError
 * @param options - The query options including list stream query configuration
 * @returns The query result with streaming data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useListStreamQuery<{ id: number; name: string }, 'id' | 'name'>({
 *   initialQuery: {
 *     condition: all(),
 *     projection: { include: ['id', 'name'] },
 *     sort: [{ field: 'id', direction: SortDirection.ASC }],
 *   },
 *   execute: async (query) => fetchStreamData(query),
 * });
 * ```
 */
export function useListStreamQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseListStreamQueryOptions<R, FIELDS, E>,
): UseListStreamQueryReturn<R, FIELDS, E> {
  return useQuery<ListQuery<FIELDS>, ReadableStream<JsonServerSentEvent<R>>, E>(
    options,
  );
}
