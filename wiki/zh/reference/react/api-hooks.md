---
title: 'API Hook 工厂'
description: 'API Hook 工厂 — @ahoo-wang/fetcher-react 6.0.0'
---

# API Hook 工厂

两个工厂把现有服务对象的异步方法转换为稳定 Hook 名称，例如 `getUser` 变成 `useGetUser`。在渲染之外创建 Hook 集合。它们保留服务 `this`，扫描自身及原型链方法，同名属性以最近的定义为准。

| 工厂 / 工具                      | 契约                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createExecuteApiHooks({ api })` | 各 Hook 接受执行器选项，返回状态和 `execute(...原参数): Promise<PromiseState>`；不自动调用。                                                                          |
| `createQueryApiHooks({ api })`   | 各 Hook 接受[受控查询](./promise-and-query-state#controlled-queries)选项（`query`、`attributes`、`autoExecute`），调用 `method(query, attributes, abortController)`。 |
| `methodNameToHookName(name)`     | 添加 `use` 并大写首字符；空名称抛错。                                                                                                                                 |
| `collectMethods(obj)`            | 返回绑定方法的 Map：自身及原型链上的函数属性，最近的定义优先。跳过 `constructor`、`Object.prototype` 和访问器，因此收集时不会执行 getter。                            |

只有 Hook 设置 `appendAbortController: true` 时，执行 Hook 才传入 controller：方法以 `method(...params, abortController)` 调用，`@api` 方法无论 controller 落在哪个位置都能识别，因此替换、中止或卸载执行会取消其请求。方法带可选尾参数时不要开启，否则 controller 会占据参数位置；这时可在自己的服务方法中包装它。查询工厂自动转发 attributes 和 controller。两种 `execute` 都解析为最终状态，从不拒绝。

`APIHooks`、`QueryAPIHooks`、`UseApiMethodExecuteReturn`、`HookName`、`ApiHooksMapping`、`ApiMethod`、`QueryMethod`、`FunctionParameters`、`FunctionReturnType`、`IsPromiseFunction` 描述编译期映射。运行时只检查属性是不是函数，不检查其是否真正返回 Promise。由 getter 提供的函数不会转换为 Hook。只传入可信服务对象。取消、回调、过期结果和卸载规则见 [共享执行器契约](./promise-and-query-state)。

::: info 6.0 变更
移除了 `onBeforeExecute` 和 `OnBeforeExecuteCallback` 类型；`UseApiMethodExecuteOptions` 去掉了第一个类型参数（`TArgs`）。查询 Hook 从你的状态接收 `query`，不再使用 `initialQuery`/`setQuery`/`getQuery`。`collectMethods` 只接受一个参数，getter 提供的函数不再变成 Hook。
:::

## 完整示例

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [最新值与稳定值](./utilities)
