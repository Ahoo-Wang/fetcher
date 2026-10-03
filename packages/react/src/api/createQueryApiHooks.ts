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
import type { UseQueryOptions, UseQueryReturn } from '../core/index.js';
import { useLatest, useQuery } from '../core/index.js';
import type {
  CreateApiHooksOptions,
  HookName,
  QueryMethod,
} from './apiHooks.js';
import { mapApiHooks } from './mapApiHooks.js';

export interface CreateQueryApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}

export interface UseApiMethodQueryOptions<
  Q,
  TData = any,
  E = FetcherError,
> extends Omit<UseQueryOptions<Q, TData, E>, 'execute'> {
  /** Passed to the method as its second argument. */
  attributes?: Record<string, any>;
}

export type QueryAPIHooks<API extends Record<string, any>, E = FetcherError> = {
  [
    K in keyof API as API[K] extends QueryMethod ? HookName<string & K> : never
  ]: API[K] extends QueryMethod<infer Q, infer R>
    ? (options?: UseApiMethodQueryOptions<Q, R, E>) => UseQueryReturn<R, E>
    : never;
};

function useApiMethodQuery<E>(
  method: QueryMethod,
  options: UseApiMethodQueryOptions<any, any, E> | undefined,
): UseQueryReturn<any, E> {
  const latestOptions = useLatest(options);
  return useQuery<any, any, E>({
    ...options,
    execute: (query, abortController) =>
      method(query, latestOptions.current?.attributes, abortController),
  });
}

function createQueryHook<E>(method: QueryMethod) {
  return function useApiMethod(
    options?: UseApiMethodQueryOptions<any, any, E>,
  ) {
    return useApiMethodQuery(method, options);
  };
}

/**
 * One controlled query hook per method of `api`: `search(query, attributes,
 * abortController)` becomes `useSearch({ query, attributes })`.
 */
export function createQueryApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateQueryApiHooksOptions<API>): QueryAPIHooks<API, E> {
  return mapApiHooks(options.api, createQueryHook<E>) as QueryAPIHooks<API, E>;
}
