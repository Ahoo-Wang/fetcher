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
import {
  useExecutePromise,
  UseExecutePromiseReturn,
  UseExecutePromiseOptions,
} from '../core/useExecutePromise';
import { FetcherError } from '@ahoo-wang/fetcher';

/**
 * Configuration options for createExecuteApiHooks.
 * @template API - The API object type containing methods that return promises.
 */
export interface CreateExecuteApiHooksOptions<API extends Record<string, any>> {
  /**
   * The API object containing methods to be wrapped into hooks.
   */
  api: API;
}

/**
 * The return type of createExecuteApiHooks.
 * Creates a hook for each function method in the API object, prefixed with 'use' and capitalized.
 * Each hook accepts optional useExecutePromise options and returns the useExecutePromise interface
 * with a modified execute function that takes the API method parameters instead of a promise supplier.
 * @template API - The API object type.
 */
export type APIHooks<API extends Record<string, any>> = {
  [K in keyof API as API[K] extends (...args: any[]) => Promise<any>
    ? `use${Capitalize<string & K>}`
    : never]: API[K] extends (...args: any[]) => Promise<any>
    ? (
        options?: UseExecutePromiseOptions<
          Awaited<ReturnType<API[K]>>,
          FetcherError
        >,
      ) => UseExecutePromiseReturn<
        Awaited<ReturnType<API[K]>>,
        FetcherError
      > & {
        execute: (...params: Parameters<API[K]>) => Promise<void>;
      }
    : never;
};

/**
 * Internal hook to wrap an API method with useExecutePromise.
 * @template TMethod - The API method type.
 * @param method - The API method to wrap.
 * @param options - Options for useExecutePromise.
 * @returns The wrapped hook return value.
 */
function useApiMethodExecute<TMethod extends (...args: any[]) => Promise<any>>(
  method: TMethod,
  options?: UseExecutePromiseOptions<
    Awaited<ReturnType<TMethod>>,
    FetcherError
  >,
): Omit<
  UseExecutePromiseReturn<Awaited<ReturnType<TMethod>>, FetcherError>,
  'execute'
> & {
  execute: (...params: Parameters<TMethod>) => Promise<void>;
} {
  const { execute: originalExecute, ...rest } = useExecutePromise<
    Awaited<ReturnType<TMethod>>,
    FetcherError
  >(options);

  const execute = useCallback(
    (...params: Parameters<TMethod>) => {
      return originalExecute(() => method(...params));
    },
    [originalExecute, method],
  );

  return {
    ...rest,
    execute,
  };
}

/**
 * Creates type-safe React hooks for API methods.
 * Each API method that returns a Promise is wrapped into a hook that extends useExecutePromise.
 * The generated hooks provide automatic state management, abort support, and error handling.
 *
 * @template API - The API object type containing methods that return promises.
 * @param options - Configuration options including the API object.
 * @returns An object containing hooks for each API method.
 *
 * @example
 * ```typescript
 * const userApi = {
 *   getUser: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
 *   createUser: (user: UserInput) => fetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify(user),
 *   }).then(res => res.json()),
 * };
 *
 * const apiHooks = createExecuteApiHooks({ api: userApi });
 *
 * function UserComponent() {
 *   const { loading, result, error, execute } = apiHooks.useGetUser({
 *     propagateError: true,
 *     onAbort: () => console.log('Request aborted'),
 *   });
 *
 *   const handleFetchUser = (userId: string) => {
 *     execute(userId);
 *   };
 *
 *   // ... component logic
 * }
 * ```
 */
export function createExecuteApiHooks<API extends Record<string, any>>(
  options: CreateExecuteApiHooksOptions<API>,
): APIHooks<API> {
  const { api } = options;

  const result = {} as any;

  for (const key in api) {
    if (Object.prototype.hasOwnProperty.call(api, key)) {
      const method = api[key];
      if (typeof method === 'function') {
        const boundMethod = method.bind(api);
        const hookName = `use${key.charAt(0).toUpperCase() + key.slice(1)}`;

        result[hookName] = function useHook(
          options?: UseExecutePromiseOptions<any, FetcherError>,
        ) {
          return useApiMethodExecute(boundMethod, options);
        };
      }
    }
  }

  return result;
}
