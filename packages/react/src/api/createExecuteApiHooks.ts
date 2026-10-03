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

import { useCallback } from 'react';
import type { FetcherError } from '@ahoo-wang/fetcher';
import type {
  PromiseState,
  UseExecutePromiseOptions,
  UseExecutePromiseReturn,
} from '../core/index.js';
import { useExecutePromise, useLatest } from '../core/index.js';
import type {
  ApiMethod,
  CreateApiHooksOptions,
  FunctionParameters,
  FunctionReturnType,
  HookName,
} from './apiHooks.js';
import { mapApiHooks } from './mapApiHooks.js';

export interface CreateExecuteApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}

export interface UseApiMethodExecuteOptions<
  TData = any,
  E = FetcherError,
> extends UseExecutePromiseOptions<TData, E> {
  /**
   * Calls the method as `method(...params, abortController)`, so cancelling
   * an execution cancels the method's request too.
   * @default false
   */
  appendAbortController?: boolean;
}

export type UseApiMethodExecuteReturn<
  TArgs extends any[],
  TData,
  E = FetcherError,
> = Omit<UseExecutePromiseReturn<TData, E>, 'execute'> & {
  /** Calls the method; never rejects, see `useExecutePromise`. */
  execute: (...params: TArgs) => Promise<PromiseState<TData, E>>;
};

export type APIHooks<API extends Record<string, any>, E = FetcherError> = {
  [
    K in keyof API as API[K] extends ApiMethod ? HookName<string & K> : never
  ]: API[K] extends ApiMethod
    ? (
        options?: UseApiMethodExecuteOptions<FunctionReturnType<API[K]>, E>,
      ) => UseApiMethodExecuteReturn<
        FunctionParameters<API[K]>,
        FunctionReturnType<API[K]>,
        E
      >
    : never;
};

function useApiMethodExecute<E>(
  method: ApiMethod,
  options: UseApiMethodExecuteOptions<any, E> | undefined,
): UseApiMethodExecuteReturn<any[], any, E> {
  const { execute: executePromise, ...state } = useExecutePromise<any, E>(
    options,
  );
  const latestOptions = useLatest(options);
  const execute = useCallback(
    (...params: any[]) =>
      executePromise(abortController =>
        latestOptions.current?.appendAbortController
          ? method(...params, abortController)
          : method(...params),
      ),
    [executePromise, latestOptions, method],
  );
  return { ...state, execute };
}

function createExecuteHook<E>(method: ApiMethod) {
  return function useApiMethod(options?: UseApiMethodExecuteOptions<any, E>) {
    return useApiMethodExecute(method, options);
  };
}

/**
 * One execute hook per method of `api`: `getUser(id)` becomes
 * `useGetUser(options)`, whose `execute(id)` calls it.
 */
export function createExecuteApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateExecuteApiHooksOptions<API>): APIHooks<API, E> {
  return mapApiHooks(options.api, createExecuteHook<E>) as APIHooks<API, E>;
}
