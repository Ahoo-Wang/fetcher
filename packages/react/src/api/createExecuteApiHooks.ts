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
  useLatest,
} from '../core';
import { FetcherError } from '@ahoo-wang/fetcher';
import {
  collectMethods,
  methodNameToHookName,
  CreateApiHooksOptions,
  HookName,
  ApiMethod,
  FunctionParameters,
  FunctionReturnType,
  OnBeforeExecuteCallback,
} from './apiHooks';

/**
 * Configuration options for createExecuteApiHooks.
 * @template API - The API object type containing methods that return promises.
 */
export interface CreateExecuteApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}

/**
 * Configuration options for createQueryApiHooks.
 * @template API - The API object type containing query methods.
 */
export interface CreateQueryApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}

/**
 * Options for useApiMethodExecute hook.
 * @template TArgs - The parameter types of the API method.
 * @template TData - The return type of the API method (resolved).
 * @template E - The error type.
 */
export interface UseApiMethodExecuteOptions<
  TArgs = any[],
  TData = any,
  E = FetcherError,
> extends UseExecutePromiseOptions<TData, E> {
  /**
   * Callback executed before method invocation.
   * Allows users to handle abortController and inspect/modify parameters.
   * Note: Parameters can be modified in place for objects/arrays.
   * @param abortController - The AbortController for the request.
   * @param args - The arguments passed to the API method (type-safe).
   *
   * @example
   * onBeforeExecute: (abortController, args) => {
   *   // args is now typed as Parameters<TMethod>
   *   const [id, options] = args;
   *   // Modify parameters in place
   *   if (options && typeof options === 'object') {
   *     options.timestamp = Date.now();
   *   }
   * }
   */
  onBeforeExecute?: OnBeforeExecuteCallback<TArgs>;
}

/**
 * The return type of createExecuteApiHooks.
 * Creates a hook for each function method in the API object, prefixed with 'use' and capitalized.
 * Each hook accepts optional useExecutepromise options and returns the useExecutepromise interface
 * with a modified execute function that takes the API method parameters instead of a promise supplier.
 * @template API - The API object type.
 * @template E - The error type for all hooks (defaults to FetcherError).
 */
export type APIHooks<API extends Record<string, any>, E = FetcherError> = {
  [K in keyof API as API[K] extends ApiMethod
    ? HookName<string & K>
    : never]: API[K] extends ApiMethod
    ? (
        options?: UseApiMethodExecuteOptions<
          FunctionParameters<API[K]>,
          FunctionReturnType<API[K]>,
          E
        >,
      ) => UseExecutePromiseReturn<FunctionReturnType<API[K]>, E> & {
        execute: (...params: FunctionParameters<API[K]>) => Promise<void>;
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
function useApiMethodExecute<
  TMethod extends (...args: any[]) => Promise<any>,
  E = FetcherError,
>(
  method: TMethod,
  options?: UseApiMethodExecuteOptions<
    Parameters<TMethod>,
    Awaited<ReturnType<TMethod>>,
    E
  >,
): Omit<UseExecutePromiseReturn<Awaited<ReturnType<TMethod>>, E>, 'execute'> & {
  execute: (...params: Parameters<TMethod>) => Promise<void>;
} {
  const { execute: originalExecute, ...rest } = useExecutePromise<
    Awaited<ReturnType<TMethod>>,
    E
  >(options);
  const onBeforeExecuteRef = useLatest(options?.onBeforeExecute);
  const execute = useCallback(
    (...params: Parameters<TMethod>) => {
      return originalExecute(abortController => {
        if (onBeforeExecuteRef.current) {
          // Call onBeforeExecute with abortController and parameters
          onBeforeExecuteRef.current(abortController, params);
        }
        // Always call method with (potentially modified) parameters
        return method(...params);
      });
    },
    [originalExecute, method, onBeforeExecuteRef],
  );

  return {
    ...rest,
    execute,
  };
}

/**
 * Creates a hook function for a given API method.
 * @param method - The bound API method.
 * @returns A hook function.
 */
function createHookForMethod<E>(method: (...args: any[]) => Promise<any>) {
  return function useApiMethod(
    options?: UseApiMethodExecuteOptions<any[], any, E>,
  ) {
    return useApiMethodExecute(method as any, options as any);
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
 * // Default behavior (no onBeforeExecute)
 * const userApi = {
 *   getUser: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
 *   createUser: (data: UserInput) => fetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *   }).then(res => res.json()),
 * };
 *
 * const apiHooks = createExecuteApiHooks({ api: userApi });
 *
 * function UserComponent() {
 *   const { loading, result, error, execute } = apiHooks.useGetUser();
 *
 *   const handleFetchUser = (userId: string) => {
 *     execute(userId); // Calls getUser(userId) directly
 *   };
 *
 *   // Custom onBeforeExecute to handle abortController and modify parameters
 *   const { execute: customExecute } = apiHooks.useCreateUser({
 *     onBeforeExecute: (abortController, args) => {
 *       // args is now fully type-safe as Parameters<createUser>
 *       const [data] = args;
 *       // Modify parameters in place (assuming data is mutable)
 *       if (data && typeof data === 'object') {
 *         (data as any).timestamp = Date.now();
 *       }
 *       // Could also set up abortController.signal
 *       abortController.signal.addEventListener('abort', () => {
 *         console.log('Request aborted');
 *       });
 *     },
 *   });
 *
 *   // ... component logic
 * }
 * ```
 */
export function createExecuteApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateExecuteApiHooksOptions<API>): APIHooks<API, E> {
  const { api } = options;

  const result = {} as any;
  const methods = collectMethods<(...args: any[]) => Promise<any>>(api);

  // Create hooks for each collected method
  methods.forEach((boundMethod, methodName) => {
    const hookName = methodNameToHookName(methodName);
    result[hookName] = createHookForMethod<E>(boundMethod);
  });

  return result;
}
