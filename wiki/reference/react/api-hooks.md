---
title: 'API hook factories'
description: 'API hook factories — @ahoo-wang/fetcher-react 5.0.0'
---

# API hook factories

The two factories turn an existing service object's asynchronous methods into stable hook names: `getUser` becomes `useGetUser`. Create the hook collection outside rendering. Both preserve the service's `this` binding and inspect own methods and its prototype chain, with the nearest property winning.

| Factory / utility                     | Contract                                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createExecuteApiHooks({ api })`      | Each hook takes executor options and returns state plus `execute(...originalParameters): Promise<void>`. No automatic invocation.                                                      |
| `createQueryApiHooks({ api })`        | Each hook takes query options and executes `(query, attributes?, abortController?)`; automatic execution defaults to true when query is defined.                                       |
| `onBeforeExecute(controller, params)` | Synchronous callback before service invocation; execute factories receive the parameter tuple, query factories receive the query value. A thrown error enters executor error handling. |
| `methodNameToHookName(name)`          | Prefixes `use` and uppercases the first character; empty name throws.                                                                                                                  |
| `collectMethods(obj, onAccessor?)`    | Returns a Map of bound methods, excluding constructor and Object.prototype. Optional accessor visitor can defer getter evaluation.                                                     |

Execute hooks do not inject a controller into arbitrary method arguments. If a method supports cancellation, use `onBeforeExecute` to assign the controller into the matching parameter slot, or use the query factory's standard signature. Query factories forward attributes and controller automatically. Both return data through result state, not the execute promise.

`APIHooks`, `QueryAPIHooks`, `HookName`, `ApiHooksMapping`, `ApiMethod`, `QueryMethod`, `FunctionParameters`, `FunctionReturnType`, `IsPromiseFunction` describe compile-time mappings. Runtime discovery checks whether a property is a function, not whether it really returns a Promise. Accessor-backed methods may be materialized on first access/enumeration and their getter can throw. Only supply a trusted service object. Cancellation, callbacks, stale-result suppression and unmount rules are the [shared executor contract](./promise-and-query-state).

## Complete example

```tsx
import { createExecuteApiHooks } from '@ahoo-wang/fetcher-react';
const hooks = createExecuteApiHooks({
  api: {
    async double(value: number) {
      return value * 2;
    },
  },
});
export function Calculator() {
  const { execute, result, error } = hooks.useDouble();
  return (
    <section>
      <button
        onClick={() => {
          void execute(21);
        }}
      >
        Calculate
      </button>
      <output>{result}</output>
      {error && <p role="alert">{error.message}</p>}
    </section>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### methodNameToHookName {#api-methodNameToHookName}

```ts
export function methodNameToHookName(methodName: string): string;
```

[packages/react/src/api/apiHooks.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L28)

### collectMethods {#api-collectMethods}

```ts
export function collectMethods<T extends (...args: any[]) => Promise<any>>(
  obj: Record<string, any>,
  onAccessor?: (
    name: string,
    get: () => unknown,
    methods: ReadonlyMap<string, T>,
  ) => void,
): Map<string, T>;
```

[packages/react/src/api/apiHooks.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L44)

### CreateApiHooksOptions {#api-CreateApiHooksOptions}

```ts
export interface CreateApiHooksOptions<API extends Record<string, any>> {
  api: API;
}
```

[packages/react/src/api/apiHooks.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L95)

### HookName {#api-HookName}

```ts
export type HookName<K extends string> = `use${Capitalize<K>}`;
```

[packages/react/src/api/apiHooks.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L106)

### IsPromiseFunction {#api-IsPromiseFunction}

```ts
export type IsPromiseFunction<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;
```

[packages/react/src/api/apiHooks.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L112)

### FunctionParameters {#api-FunctionParameters}

```ts
export type FunctionParameters<T> = T extends (...args: infer P) => Promise<any>
  ? P
  : never;
```

[packages/react/src/api/apiHooks.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L120)

### FunctionReturnType {#api-FunctionReturnType}

```ts
export type FunctionReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? Awaited<R>
  : never;
```

[packages/react/src/api/apiHooks.ts:128](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L128)

### ApiMethod {#api-ApiMethod}

```ts
export type ApiMethod<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;
```

[packages/react/src/api/apiHooks.ts:139](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L139)

### QueryMethod {#api-QueryMethod}

```ts
export type QueryMethod<Q = any, TReturn = any> = (
  query: Q,
  attributes?: Record<string, any>,
  abortController?: AbortController,
) => Promise<TReturn>;
```

[packages/react/src/api/apiHooks.ts:148](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L148)

### OnBeforeExecuteCallback {#api-OnBeforeExecuteCallback}

```ts
export type OnBeforeExecuteCallback<TParams> = (
  abortController: AbortController | undefined,
  params: TParams,
) => void;
```

[packages/react/src/api/apiHooks.ts:158](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L158)

### ApiHooksMapping {#api-ApiHooksMapping}

```ts
export type ApiHooksMapping<
  API extends Record<string, any>,
  MethodType extends (...args: any[]) => Promise<any>,
  HookType,
> = {
  [
    K in keyof API as API[K] extends MethodType ? HookName<string & K> : never
  ]: API[K] extends MethodType ? HookType : never;
};
```

[packages/react/src/api/apiHooks.ts:170](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L170)

### createExecuteApiHooks {#api-createExecuteApiHooks}

```ts
export function createExecuteApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateExecuteApiHooksOptions<API>): APIHooks<API, E>;
```

[packages/react/src/api/createExecuteApiHooks.ts:201](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L201)

### CreateExecuteApiHooksOptions {#api-CreateExecuteApiHooksOptions}

```ts
export interface CreateExecuteApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}
```

[packages/react/src/api/createExecuteApiHooks.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L35)

### UseApiMethodExecuteOptions {#api-UseApiMethodExecuteOptions}

```ts
export interface UseApiMethodExecuteOptions<
  TArgs = any[],
  TData = any,
  E = FetcherError,
> extends UseExecutePromiseOptions<TData, E> {
  onBeforeExecute?: OnBeforeExecuteCallback<TArgs>;
}
```

[packages/react/src/api/createExecuteApiHooks.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L45)

### APIHooks {#api-APIHooks}

```ts
export type APIHooks<API extends Record<string, any>, E = FetcherError> = {
  [
    K in keyof API as API[K] extends ApiMethod ? HookName<string & K> : never
  ]: API[K] extends ApiMethod
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
```

[packages/react/src/api/createExecuteApiHooks.ts:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L78)

### createQueryApiHooks {#api-createQueryApiHooks}

```ts
export function createQueryApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateQueryApiHooksOptions<API>): QueryAPIHooks<API, E>;
```

[packages/react/src/api/createQueryApiHooks.ts:174](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L174)

### CreateQueryApiHooksOptions {#api-CreateQueryApiHooksOptions}

```ts
export interface CreateQueryApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}
```

[packages/react/src/api/createQueryApiHooks.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L30)

### UseApiMethodQueryOptions {#api-UseApiMethodQueryOptions}

```ts
export interface UseApiMethodQueryOptions<
  Q,
  TData = any,
  E = FetcherError,
> extends Omit<UseQueryOptions<Q, TData, E>, 'execute'> {
  onBeforeExecute?: OnBeforeExecuteCallback<Q>;
}
```

[packages/react/src/api/createQueryApiHooks.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L40)

### QueryAPIHooks {#api-QueryAPIHooks}

```ts
export type QueryAPIHooks<API extends Record<string, any>, E = FetcherError> = {
  [
    K in keyof API as API[K] extends QueryMethod ? HookName<string & K> : never
  ]: API[K] extends QueryMethod<infer Q, infer R>
    ? (options?: UseApiMethodQueryOptions<Q, R, E>) => UseQueryReturn<Q, R, E>
    : never;
};
```

[packages/react/src/api/createQueryApiHooks.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L70)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
