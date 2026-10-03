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

import type {
  FetcherCapable,
  FetcherError,
  FetchExchange,
  FetchRequest,
  RequestOptions,
} from '@ahoo-wang/fetcher';
import { fetcherRegistrar, getFetcher } from '@ahoo-wang/fetcher';
import { useCallback } from 'react';
import type {
  PromiseState,
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from '../core/index.js';
import { useExecutePromise, useLatest } from '../core/index.js';

export interface UseFetcherOptions<R, E = FetcherError>
  extends RequestOptions, FetcherCapable, UseExecutePromiseOptions<R, E> {}

export interface UseFetcherReturn<R, E = FetcherError> extends Omit<
  UseExecutePromiseReturn<R, E>,
  'execute'
> {
  /**
   * The exchange behind `result`, or behind `error` when the request failed
   * with an `ExchangeError` (e.g. to read the response status).
   */
  exchange: FetchExchange | undefined;
  /**
   * Cancels the request in flight and sends `request`. Never rejects; see
   * `useExecutePromise`. The hook owns cancellation: an `abortController` on
   * `request` is replaced, a `signal` still applies.
   */
  execute: (request: FetchRequest) => Promise<PromiseState<R, E>>;
}

interface Fetched<R> {
  exchange: FetchExchange;
  result: R;
}

function unwrap<R, E>(state: PromiseState<Fetched<R>, E>): PromiseState<R, E> {
  return { ...state, result: state.result?.result };
}

/**
 * Sends requests through a `Fetcher` (the default one unless `fetcher` names
 * or passes another) and tracks the latest one's state.
 */
export function useFetcher<R, E = FetcherError>(
  options?: UseFetcherOptions<R, E>,
): UseFetcherReturn<R, E> {
  const latestOptions = useLatest(options);
  const { execute: executePromise, ...state } = useExecutePromise<
    Fetched<R>,
    E
  >({
    initialStatus: options?.initialStatus,
    onSuccess: fetched => latestOptions.current?.onSuccess?.(fetched.result),
    onError: error => latestOptions.current?.onError?.(error),
    onAbort: () => latestOptions.current?.onAbort?.(),
  });
  const execute = useCallback(
    async (request: FetchRequest) =>
      unwrap(
        await executePromise(async abortController => {
          const {
            fetcher = fetcherRegistrar.default,
            resultExtractor,
            attributes,
          } = latestOptions.current ?? {};
          const exchange = await getFetcher(fetcher).exchange(
            { ...request, abortController },
            { resultExtractor, attributes },
          );
          return { exchange, result: await exchange.extractResult<R>() };
        }),
      ),
    [executePromise, latestOptions],
  );
  // Read structurally, not with `instanceof ExchangeError`: the error may come
  // from another copy of @ahoo-wang/fetcher (its ESM and CommonJS builds).
  const exchange =
    state.result?.exchange ??
    (state.error as { exchange?: FetchExchange } | undefined)?.exchange;
  return { ...state, result: state.result?.result, exchange, execute };
}
