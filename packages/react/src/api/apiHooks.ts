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

/** `getUser` → `useGetUser`. */
export function methodNameToHookName(methodName: string): string {
  if (!methodName) {
    throw new Error('Method name cannot be empty');
  }
  return `use${methodName.charAt(0).toUpperCase()}${methodName.slice(1)}`;
}

/**
 * The methods of `obj`: its own function properties and those of its
 * prototype chain (up to `Object.prototype`), bound to `obj`. The nearest
 * definition wins; constructors and accessors are skipped, so collecting
 * never runs a getter.
 */
export function collectMethods<T extends (...args: any[]) => Promise<any>>(
  obj: object,
): Map<string, T> {
  const methods = new Map<string, T>();
  const seen = new Set<string>();
  for (
    let target: object | null = obj;
    target && target !== Object.prototype;
    target = Object.getPrototypeOf(target)
  ) {
    for (const key of Object.getOwnPropertyNames(target)) {
      if (seen.has(key) || key === 'constructor') continue;
      seen.add(key);
      const { value } = Object.getOwnPropertyDescriptor(target, key)!;
      if (typeof value === 'function') {
        methods.set(key, value.bind(obj) as T);
      }
    }
  }
  return methods;
}

export interface CreateApiHooksOptions<API extends Record<string, any>> {
  api: API;
}

export type HookName<K extends string> = `use${Capitalize<K>}`;

export type IsPromiseFunction<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;

export type FunctionParameters<T> = T extends (...args: infer P) => Promise<any>
  ? P
  : never;

export type FunctionReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? Awaited<R>
  : never;

export type ApiMethod<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;

/** A method `createQueryApiHooks` turns into a query hook. */
export type QueryMethod<Q = any, TReturn = any> = (
  query: Q,
  attributes?: Record<string, any>,
  abortController?: AbortController,
) => Promise<TReturn>;

export type ApiHooksMapping<
  API extends Record<string, any>,
  MethodType extends (...args: any[]) => Promise<any>,
  HookType,
> = {
  [
    K in keyof API as API[K] extends MethodType ? HookName<string & K> : never
  ]: API[K] extends MethodType ? HookType : never;
};
