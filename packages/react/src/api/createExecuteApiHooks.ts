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
} from '../core';
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
  onBeforeExecute?: (abortController: AbortController, args: TArgs) => void;
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
  [K in keyof API as API[K] extends (...args: any[]) => Promise<any>
    ? `use${Capitalize<string & K>}`
    : never]: API[K] extends (...args: any[]) => Promise<any>
    ? (
        options?: UseApiMethodExecuteOptions<
          Parameters<API[K]>,
          Awaited<ReturnType<API[K]>>,
          E
        >,
      ) => UseExecutePromiseReturn<Awaited<ReturnType<API[K]>>, E> & {
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
  const { onBeforeExecute, ...restOptions } = options || {};

  const { execute: originalExecute, ...rest } = useExecutePromise<
    Awaited<ReturnType<TMethod>>,
    E
  >(restOptions);

  const execute = useCallback(
    (...params: Parameters<TMethod>) => {
      return originalExecute(abortController => {
        if (onBeforeExecute) {
          // Call onBeforeExecute with abortController and parameters
          onBeforeExecute(abortController, params);
        }
        // Always call method with (potentially modified) parameters
        return method(...params);
      });
    },
    [originalExecute, method, onBeforeExecute],
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
 * Collects all function methods from an object and its prototype chain.
 * @param obj - The object to collect methods from.
 * @returns A map of method names to bound methods.
 */
function collectMethods(
  obj: Record<string, any>,
): Map<string, (...args: any[]) => Promise<any>> {
  const methods = new Map<string, (...args: any[]) => Promise<any>>();
  const processedKeys = new Set<string>();

  // Helper function to process an object for methods
  const processObject = (target: Record<string, any>) => {
    Object.getOwnPropertyNames(target).forEach(key => {
      if (!processedKeys.has(key) && key !== 'constructor') {
        processedKeys.add(key);
        const value = target[key];
        if (typeof value === 'function') {
          // Bind method to the original object to preserve 'this' context
          methods.set(key, value.bind(obj));
        }
      }
    });
  };

  // Process own properties first
  processObject(obj);

  // Process prototype chain
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    processObject(proto);
    proto = Object.getPrototypeOf(proto);
  }

  return methods;
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
  const methods = collectMethods(api);

  // Create hooks for each collected method
  methods.forEach((boundMethod, methodName) => {
    const hookName = `use${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`;
    result[hookName] = createHookForMethod<E>(boundMethod);
  });

  return result;
}
