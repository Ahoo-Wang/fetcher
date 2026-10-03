---
next: false
title: 'React 完整符号索引'
description: 'React 完整符号索引 — @ahoo-wang/fetcher-react 根入口、/core 与 /fetcher'
---

# 完整符号索引

下表每个符号都从根入口 `@ahoo-wang/fetcher-react` 导出。“子路径”列给出同样导出它的子路径：`/core`（只依赖 React 的 Hook，不加载任何集成包）或 `/fetcher`（Fetcher Hook，不加载 CoSec、存储或事件总线代码）。见[子路径入口](./index#subpath-entries)；— 表示只在根入口。

| 符号                                | 子路径     | 专题                                                                         |
| ----------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `ANONYMOUS_USER`                    | —          | [安全 Hook 与路由守卫](./cosec#api-ANONYMOUS_USER)                           |
| `APIHooks`                          | —          | [API Hook 工厂](./api-hooks#api-APIHooks)                                    |
| `ApiHooksMapping`                   | —          | [API Hook 工厂](./api-hooks#api-ApiHooksMapping)                             |
| `ApiMethod`                         | —          | [API Hook 工厂](./api-hooks#api-ApiMethod)                                   |
| `CreateApiHooksOptions`             | —          | [API Hook 工厂](./api-hooks#api-CreateApiHooksOptions)                       |
| `CreateExecuteApiHooksOptions`      | —          | [API Hook 工厂](./api-hooks#api-CreateExecuteApiHooksOptions)                |
| `CreateQueryApiHooksOptions`        | —          | [API Hook 工厂](./api-hooks#api-CreateQueryApiHooksOptions)                  |
| `DebounceCapable`                   | `/core`    | [防抖执行](./debounce#api-DebounceCapable)                                   |
| `FunctionParameters`                | —          | [API Hook 工厂](./api-hooks#api-FunctionParameters)                          |
| `FunctionReturnType`                | —          | [API Hook 工厂](./api-hooks#api-FunctionReturnType)                          |
| `HookName`                          | —          | [API Hook 工厂](./api-hooks#api-HookName)                                    |
| `IsPromiseFunction`                 | —          | [API Hook 工厂](./api-hooks#api-IsPromiseFunction)                           |
| `PromiseState`                      | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-PromiseState)             |
| `PromiseStatus`                     | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-PromiseStatus)            |
| `PromiseSupplier`                   | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-PromiseSupplier)          |
| `QueryAPIHooks`                     | —          | [API Hook 工厂](./api-hooks#api-QueryAPIHooks)                               |
| `QueryMethod`                       | —          | [API Hook 工厂](./api-hooks#api-QueryMethod)                                 |
| `QueryOptions`                      | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-QueryOptions)             |
| `RefreshableRouteGuard`             | —          | [安全 Hook 与路由守卫](./cosec#api-RefreshableRouteGuard)                    |
| `RefreshableRouteGuardProps`        | —          | [安全 Hook 与路由守卫](./cosec#api-RefreshableRouteGuardProps)               |
| `RouteGuard`                        | —          | [安全 Hook 与路由守卫](./cosec#api-RouteGuard)                               |
| `RouteGuardProps`                   | —          | [安全 Hook 与路由守卫](./cosec#api-RouteGuardProps)                          |
| `SecurityContext`                   | —          | [安全 Hook 与路由守卫](./cosec#api-SecurityContext)                          |
| `SecurityContextOptions`            | —          | [安全 Hook 与路由守卫](./cosec#api-SecurityContextOptions)                   |
| `SecurityContextValue`              | —          | [安全 Hook 与路由守卫](./cosec#api-SecurityContextValue)                     |
| `SecurityProvider`                  | —          | [安全 Hook 与路由守卫](./cosec#api-SecurityProvider)                         |
| `UseApiMethodExecuteOptions`        | —          | [API Hook 工厂](./api-hooks#api-UseApiMethodExecuteOptions)                  |
| `UseApiMethodExecuteReturn`         | —          | [API Hook 工厂](./api-hooks#api-UseApiMethodExecuteReturn)                   |
| `UseApiMethodQueryOptions`          | —          | [API Hook 工厂](./api-hooks#api-UseApiMethodQueryOptions)                    |
| `UseDebouncedCallbackOptions`       | `/core`    | [防抖执行](./debounce#api-UseDebouncedCallbackOptions)                       |
| `UseDebouncedCallbackReturn`        | `/core`    | [防抖执行](./debounce#api-UseDebouncedCallbackReturn)                        |
| `UseDebouncedExecutePromiseOptions` | `/core`    | [防抖执行](./debounce#api-UseDebouncedExecutePromiseOptions)                 |
| `UseDebouncedExecutePromiseReturn`  | `/core`    | [防抖执行](./debounce#api-UseDebouncedExecutePromiseReturn)                  |
| `UseDebouncedFetcherOptions`        | `/fetcher` | [防抖执行](./debounce#api-UseDebouncedFetcherOptions)                        |
| `UseDebouncedFetcherQueryOptions`   | `/fetcher` | [防抖执行](./debounce#api-UseDebouncedFetcherQueryOptions)                   |
| `UseDebouncedFetcherQueryReturn`    | `/fetcher` | [防抖执行](./debounce#api-UseDebouncedFetcherQueryReturn)                    |
| `UseDebouncedFetcherReturn`         | `/fetcher` | [防抖执行](./debounce#api-UseDebouncedFetcherReturn)                         |
| `UseDebouncedQueryOptions`          | `/core`    | [防抖执行](./debounce#api-UseDebouncedQueryOptions)                          |
| `UseDebouncedQueryReturn`           | `/core`    | [防抖执行](./debounce#api-UseDebouncedQueryReturn)                           |
| `UseDebouncedValueReturn`           | `/core`    | [防抖执行](./debounce#api-UseDebouncedValueReturn)                           |
| `UseEventSubscriptionOptions`       | —          | [存储与事件订阅](./storage-and-events#api-UseEventSubscriptionOptions)       |
| `UseEventSubscriptionReturn`        | —          | [存储与事件订阅](./storage-and-events#api-UseEventSubscriptionReturn)        |
| `UseExecutePromiseOptions`          | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UseExecutePromiseOptions) |
| `UseExecutePromiseReturn`           | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UseExecutePromiseReturn)  |
| `UseFetcherOptions`                 | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-UseFetcherOptions)                   |
| `UseFetcherQueryOptions`            | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-UseFetcherQueryOptions)              |
| `UseFetcherQueryReturn`             | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-UseFetcherQueryReturn)               |
| `UseFetcherReturn`                  | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-UseFetcherReturn)                    |
| `UsePromiseStateOptions`            | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UsePromiseStateOptions)   |
| `UsePromiseStateReturn`             | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UsePromiseStateReturn)    |
| `UseQueryOptions`                   | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UseQueryOptions)          |
| `UseQueryReturn`                    | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-UseQueryReturn)           |
| `UseSecurityOptions`                | —          | [安全 Hook 与路由守卫](./cosec#api-UseSecurityOptions)                       |
| `UseSecurityReturn`                 | —          | [安全 Hook 与路由守卫](./cosec#api-UseSecurityReturn)                        |
| `collectMethods`                    | —          | [API Hook 工厂](./api-hooks#api-collectMethods)                              |
| `createExecuteApiHooks`             | —          | [API Hook 工厂](./api-hooks#api-createExecuteApiHooks)                       |
| `createQueryApiHooks`               | —          | [API Hook 工厂](./api-hooks#api-createQueryApiHooks)                         |
| `methodNameToHookName`              | —          | [API Hook 工厂](./api-hooks#api-methodNameToHookName)                        |
| `useDebouncedCallback`              | `/core`    | [防抖执行](./debounce#api-useDebouncedCallback)                              |
| `useDebouncedExecutePromise`        | `/core`    | [防抖执行](./debounce#api-useDebouncedExecutePromise)                        |
| `useDebouncedFetcher`               | `/fetcher` | [防抖执行](./debounce#api-useDebouncedFetcher)                               |
| `useDebouncedFetcherQuery`          | `/fetcher` | [防抖执行](./debounce#api-useDebouncedFetcherQuery)                          |
| `useDebouncedQuery`                 | `/core`    | [防抖执行](./debounce#api-useDebouncedQuery)                                 |
| `useDebouncedValue`                 | `/core`    | [防抖执行](./debounce#api-useDebouncedValue)                                 |
| `useEventSubscription`              | —          | [存储与事件订阅](./storage-and-events#api-useEventSubscription)              |
| `useExecutePromise`                 | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-useExecutePromise)        |
| `useFetcher`                        | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-useFetcher)                          |
| `useFetcherQuery`                   | `/fetcher` | [Fetcher 请求 Hook](./fetcher-hooks#api-useFetcherQuery)                     |
| `useImmerKeyStorage`                | —          | [存储与事件订阅](./storage-and-events#api-useImmerKeyStorage)                |
| `useKeyStorage`                     | —          | [存储与事件订阅](./storage-and-events#api-useKeyStorage)                     |
| `useLatest`                         | `/core`    | [最新值与稳定值](./utilities#api-useLatest)                                  |
| `usePromiseState`                   | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-usePromiseState)          |
| `useQuery`                          | `/core`    | [Promise 与查询状态](./promise-and-query-state#api-useQuery)                 |
| `useSecurity`                       | —          | [安全 Hook 与路由守卫](./cosec#api-useSecurity)                              |
| `useSecurityContext`                | —          | [安全 Hook 与路由守卫](./cosec#api-useSecurityContext)                       |
| `useStableValue`                    | `/core`    | [最新值与稳定值](./utilities#api-useStableValue)                             |
