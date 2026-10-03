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

import type { FetcherError } from '@ahoo-wang/fetcher';
import type { DebounceCapable } from '../../core/index.js';
import { useDebouncedValue } from '../../core/index.js';
import type {
  UseFetcherQueryOptions,
  UseFetcherQueryReturn,
} from '../useFetcherQuery.js';
import { useFetcherQuery } from '../useFetcherQuery.js';

export interface UseDebouncedFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherQueryOptions<Q, R, E>, DebounceCapable {}

export interface UseDebouncedFetcherQueryReturn<
  R,
  E = FetcherError,
> extends UseFetcherQueryReturn<R, E> {
  /** Whether a query change is waiting for the debounce delay. */
  pending: boolean;
  /** Applies the waiting query change now. */
  flush: () => void;
}

/**
 * `useFetcherQuery` that follows the query once it has stopped changing for
 * `debounce.delay` milliseconds. The first query is sent at once.
 */
export function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<R, E> {
  const {
    value: query,
    pending,
    flush,
  } = useDebouncedValue(options.query, options.debounce);
  return { ...useFetcherQuery({ ...options, query }), pending, flush };
}
