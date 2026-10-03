---
title: 'API hook factories'
description: 'API hook factories — @ahoo-wang/fetcher-react 6.0.0'
---

# API hook factories

The two factories turn an existing service object's asynchronous methods into stable hook names: `getUser` becomes `useGetUser`. Create the hook collection outside rendering. Both preserve the service's `this` binding and inspect own methods and its prototype chain, with the nearest property winning.

| Factory / utility                | Contract                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createExecuteApiHooks({ api })` | Each hook takes executor options and returns state plus `execute(...originalParameters): Promise<PromiseState>`. No automatic invocation.                                               |
| `createQueryApiHooks({ api })`   | Each hook takes [controlled-query](./promise-and-query-state#controlled-queries) options (`query`, `attributes`, `autoExecute`) and calls `method(query, attributes, abortController)`. |
| `methodNameToHookName(name)`     | Prefixes `use` and uppercases the first character; empty name throws.                                                                                                                   |
| `collectMethods(obj)`            | Returns a Map of bound methods: own and prototype-chain function properties, nearest wins. Skips `constructor`, `Object.prototype` and accessors, so collecting never runs a getter.    |

Execute hooks pass the controller only when a hook sets `appendAbortController: true`: the method is then called as `method(...params, abortController)`, and a `@api` method picks the controller up wherever it lands, so replacing, aborting or unmounting an execution cancels its request. Leave it off for methods with optional trailing parameters, where the controller would take a parameter's place; wrap such a method in your own service method instead. Query factories forward attributes and controller automatically. Both `execute` functions resolve to the final state and never reject.

`APIHooks`, `QueryAPIHooks`, `UseApiMethodExecuteReturn`, `HookName`, `ApiHooksMapping`, `ApiMethod`, `QueryMethod`, `FunctionParameters`, `FunctionReturnType`, `IsPromiseFunction` describe compile-time mappings. Runtime discovery checks whether a property is a function, not whether it really returns a Promise. Functions provided by getters are not turned into hooks. Only supply a trusted service object. Cancellation, callbacks, stale-result suppression and unmount rules are the [shared executor contract](./promise-and-query-state).

::: info Changed in 6.0
`onBeforeExecute` and the `OnBeforeExecuteCallback` type were removed; `UseApiMethodExecuteOptions` lost its first type parameter (`TArgs`). Query hooks take `query` from your state instead of `initialQuery`/`setQuery`/`getQuery`. `collectMethods` takes one argument, and getter-provided functions no longer become hooks.
:::

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
        onClick={async () => {
          const state = await execute(21);
          if (state.status === 'success') console.log(state.result);
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

[packages/react/src/api/apiHooks.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L15)

### collectMethods {#api-collectMethods}

```ts
export function collectMethods<T extends (...args: any[]) => Promise<any>>(
  obj: object,
): Map<string, T>;
```

[packages/react/src/api/apiHooks.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L28)

### CreateApiHooksOptions {#api-CreateApiHooksOptions}

```ts
export interface CreateApiHooksOptions<API extends Record<string, any>> {
  api: API;
}
```

[packages/react/src/api/apiHooks.ts:50](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L50)

### HookName {#api-HookName}

```ts
export type HookName<K extends string> = `use${Capitalize<K>}`;
```

[packages/react/src/api/apiHooks.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L54)

### IsPromiseFunction {#api-IsPromiseFunction}

```ts
export type IsPromiseFunction<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;
```

[packages/react/src/api/apiHooks.ts:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L56)

### FunctionParameters {#api-FunctionParameters}

```ts
export type FunctionParameters<T> = T extends (...args: infer P) => Promise<any>
  ? P
  : never;
```

[packages/react/src/api/apiHooks.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L60)

### FunctionReturnType {#api-FunctionReturnType}

```ts
export type FunctionReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? Awaited<R>
  : never;
```

[packages/react/src/api/apiHooks.ts:64](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L64)

### ApiMethod {#api-ApiMethod}

```ts
export type ApiMethod<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;
```

[packages/react/src/api/apiHooks.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L70)

### QueryMethod {#api-QueryMethod}

```ts
export type QueryMethod<Q = any, TReturn = any> = (
  query: Q,
  attributes?: Record<string, any>,
  abortController?: AbortController,
) => Promise<TReturn>;
```

[packages/react/src/api/apiHooks.ts:75](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L75)

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

[packages/react/src/api/apiHooks.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/apiHooks.ts#L81)

### createExecuteApiHooks {#api-createExecuteApiHooks}

```ts
export function createExecuteApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateExecuteApiHooksOptions<API>): APIHooks<API, E>;
```

[packages/react/src/api/createExecuteApiHooks.ts:100](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L100)

### CreateExecuteApiHooksOptions {#api-CreateExecuteApiHooksOptions}

```ts
export interface CreateExecuteApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}
```

[packages/react/src/api/createExecuteApiHooks.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L31)

### UseApiMethodExecuteOptions {#api-UseApiMethodExecuteOptions}

```ts
export interface UseApiMethodExecuteOptions<
  TData = any,
  E = FetcherError,
> extends UseExecutePromiseOptions<TData, E> {
  /** @default false */
  appendAbortController?: boolean;
}
```

[packages/react/src/api/createExecuteApiHooks.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L35)

### UseApiMethodExecuteReturn {#api-UseApiMethodExecuteReturn}

```ts
export type UseApiMethodExecuteReturn<
  TArgs extends any[],
  TData,
  E = FetcherError,
> = Omit<UseExecutePromiseReturn<TData, E>, 'execute'> & {
  execute: (...params: TArgs) => Promise<PromiseState<TData, E>>;
};
```

[packages/react/src/api/createExecuteApiHooks.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L47)

### APIHooks {#api-APIHooks}

```ts
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
```

[packages/react/src/api/createExecuteApiHooks.ts:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createExecuteApiHooks.ts#L56)

### createQueryApiHooks {#api-createQueryApiHooks}

```ts
export function createQueryApiHooks<
  API extends Record<string, any>,
  E = FetcherError,
>(options: CreateQueryApiHooksOptions<API>): QueryAPIHooks<API, E>;
```

[packages/react/src/api/createQueryApiHooks.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L69)

### CreateQueryApiHooksOptions {#api-CreateQueryApiHooksOptions}

```ts
export interface CreateQueryApiHooksOptions<
  API extends Record<string, any>,
> extends CreateApiHooksOptions<API> {}
```

[packages/react/src/api/createQueryApiHooks.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L24)

### UseApiMethodQueryOptions {#api-UseApiMethodQueryOptions}

```ts
export interface UseApiMethodQueryOptions<
  Q,
  TData = any,
  E = FetcherError,
> extends Omit<UseQueryOptions<Q, TData, E>, 'execute'> {
  attributes?: Record<string, any>;
}
```

[packages/react/src/api/createQueryApiHooks.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L28)

### QueryAPIHooks {#api-QueryAPIHooks}

```ts
export type QueryAPIHooks<API extends Record<string, any>, E = FetcherError> = {
  [
    K in keyof API as API[K] extends QueryMethod ? HookName<string & K> : never
  ]: API[K] extends QueryMethod<infer Q, infer R>
    ? (options?: UseApiMethodQueryOptions<Q, R, E>) => UseQueryReturn<R, E>
    : never;
};
```

[packages/react/src/api/createQueryApiHooks.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/api/createQueryApiHooks.ts#L37)

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Latest and stable values](./utilities)
