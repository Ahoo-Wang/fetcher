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
import { JsonResultExtractor } from '@ahoo-wang/fetcher';
import type { PromiseState, QueryOptions } from '../core/index.js';
import { useLatest } from '../core/index.js';
import {
  initialQueryStatus,
  useQueryTrigger,
} from '../core/useQueryTrigger.js';
import type { AutoExecuteCapable } from '../types.js';
import type { UseFetcherOptions, UseFetcherReturn } from './useFetcher.js';
import { useFetcher } from './useFetcher.js';

export interface UseFetcherQueryOptions<Q, R, E = FetcherError>
  extends UseFetcherOptions<R, E>, QueryOptions<Q>, AutoExecuteCapable {
  /**
   * The endpoint; each query is sent to it as a `POST` JSON body. A string,
   * number, boolean or `null` query is JSON-encoded too (`'Ada'` → `"Ada"`).
   */
  url: string;
}

export interface UseFetcherQueryReturn<R, E = FetcherError> extends Omit<
  UseFetcherReturn<R, E>,
  'execute'
> {
  /** Sends the current query now; `idle` when the query is `undefined`. */
  execute: () => Promise<PromiseState<R, E>>;
}

/**
 * The request body for `query` as JSON. Fetcher's request body interceptor
 * serializes objects and arrays, but sends a string as is (pre-serialized
 * JSON) and `null` as no body, so primitives and `null` are encoded here.
 */
function toJsonBody(query: unknown): any {
  switch (typeof query) {
    case 'string':
    case 'number':
    case 'boolean':
      return JSON.stringify(query);
    default:
      return query === null ? 'null' : query;
  }
}

/**
 * A controlled query sent as `POST url` with the query as JSON body, parsed
 * as JSON unless `resultExtractor` says otherwise. Executes whenever the
 * query's content changes.
 */
export function useFetcherQuery<Q, R, E = FetcherError>(
  options: UseFetcherQueryOptions<Q, R, E>,
): UseFetcherQueryReturn<R, E> {
  const { query, autoExecute = true } = options;
  const { execute: send, ...state } = useFetcher<R, E>({
    resultExtractor: JsonResultExtractor,
    ...options,
    initialStatus: initialQueryStatus(
      query,
      autoExecute,
      options.initialStatus,
    ),
  });
  const latestOptions = useLatest(options);
  const execute = useQueryTrigger(query, autoExecute, (query: Q) =>
    send({
      url: latestOptions.current.url,
      method: 'POST',
      body: toJsonBody(query),
    }),
  );
  return { ...state, execute };
}
