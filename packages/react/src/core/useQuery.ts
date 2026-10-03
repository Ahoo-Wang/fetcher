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
import type { AutoExecuteCapable } from '../types.js';
import type {
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from './useExecutePromise.js';
import { useExecutePromise } from './useExecutePromise.js';
import type { PromiseState } from './usePromiseState.js';
import { useLatest } from './useLatest.js';
import { initialQueryStatus, useQueryTrigger } from './useQueryTrigger.js';

export interface QueryOptions<Q> {
  /**
   * The query. Its content (compared deeply) drives execution; `undefined`
   * means not ready, and nothing executes.
   */
  query?: Q;
}

export interface UseQueryOptions<Q, R, E = FetcherError>
  extends UseExecutePromiseOptions<R, E>, QueryOptions<Q>, AutoExecuteCapable {
  /** Runs one query; it should stop when the controller aborts. */
  execute: (query: Q, abortController: AbortController) => Promise<R>;
}

export interface UseQueryReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  /** Runs the current query now; `idle` when the query is `undefined`. */
  execute: () => Promise<PromiseState<R, E>>;
}

/**
 * A controlled query: keep the query in your own state and pass it in; the
 * hook executes whenever its content changes.
 *
 * @example
 * const [query, setQuery] = useState({ keyword: '' });
 * const { result, loading } = useQuery({
 *   query,
 *   execute: (query, abortController) => api.search(query, abortController),
 * });
 */
export function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<R, E> {
  const { query, autoExecute = true } = options;
  const { execute: executePromise, ...state } = useExecutePromise<R, E>({
    ...options,
    initialStatus: initialQueryStatus(
      query,
      autoExecute,
      options.initialStatus,
    ),
  });
  const latestOptions = useLatest(options);
  const execute = useQueryTrigger(query, autoExecute, (query: Q) =>
    executePromise(abortController =>
      latestOptions.current.execute(query, abortController),
    ),
  );
  return { ...state, execute };
}
