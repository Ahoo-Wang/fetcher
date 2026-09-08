---
title: 'API Hook 工厂'
description: 'API Hook 工厂 — @ahoo-wang/fetcher-react 5.0.0'
---

# API Hook 工厂

两个工厂把现有服务对象的异步方法转换为稳定 Hook 名称，例如 `getUser` 变成 `useGetUser`。在渲染之外创建 Hook 集合。它们保留服务 `this`，扫描自身及原型链方法，同名属性以最近的定义为准。

| 工厂 / 工具                           | 契约                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `createExecuteApiHooks({ api })`      | 各 Hook 接受执行器选项，返回状态和 `execute(...原参数): Promise<void>`；不自动调用。                  |
| `createQueryApiHooks({ api })`        | 各 Hook 接受查询选项，执行 `(query, attributes?, abortController?)`；query 已定义时默认自动执行。     |
| `onBeforeExecute(controller, params)` | 服务调用前的同步回调；执行工厂收到参数元组，查询工厂收到查询值。抛错进入执行器错误处理。              |
| `methodNameToHookName(name)`          | 添加 `use` 并大写首字符；空名称抛错。                                                                 |
| `collectMethods(obj, onAccessor?)`    | 返回绑定方法的 Map，排除 constructor 和 Object.prototype；可选 accessor visitor 支持延迟读取 getter。 |

执行 Hook 不会自动把 controller 注入任意方法参数。方法支持取消时，用 `onBeforeExecute` 写入对应参数位置，或使用查询工厂的标准签名。查询工厂自动转发 attributes 和 controller。两者都通过 result 状态提供结果，而不是 execute promise。

`APIHooks`、`QueryAPIHooks`、`HookName`、`ApiHooksMapping`、`ApiMethod`、`QueryMethod`、`FunctionParameters`、`FunctionReturnType`、`IsPromiseFunction` 描述编译期映射。运行时只检查属性是不是函数，不检查其是否真正返回 Promise。访问器方法可能在首次读取/枚举时才建立，getter 可以抛错；只传入可信服务对象。取消、回调、过期结果和卸载规则见 [共享执行器契约](./promise-and-query-state)。

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
