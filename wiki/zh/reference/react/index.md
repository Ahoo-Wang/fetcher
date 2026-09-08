---
title: 'React 参考'
description: 'Fetcher React Hooks 的请求状态、查询、取消与集成 API 参考。'
---

# React

面向 Fetcher、异步状态、Wow 查询及共享浏览器资源的 React Hook。统一从包根入口导入。本仓库采用 React 19 集成，包声明 Node &gt;=18.20.8；仓库贡献者工具链有独立、更高的 Node 要求。notification 内部模块不是根导出。

## 安装

```sh
pnpm add @ahoo-wang/fetcher-react
```

同时满足 [package.json](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/package.json#L1) 中的 peerDependencies；包版本基线为 5.0.0。

## 最小示例

```tsx
import { JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';
export function Profile() {
  const request = useFetcher<{ name: string }>({
    resultExtractor: JsonResultExtractor,
  });
  return (
    <section>
      <button
        disabled={request.loading}
        onClick={() => {
          void request.execute({ url: '/api/profile', method: 'GET' });
        }}
      >
        Load
      </button>
      {request.error && <p role="alert">{request.error.message}</p>}
      <p>{request.result?.name}</p>
    </section>
  );
}
```

## 专题

- [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks)
- [Promise 与查询状态](/zh/reference/react/promise-and-query-state)
- [API Hook 工厂](/zh/reference/react/api-hooks)
- [防抖执行](/zh/reference/react/debounce)
- [存储与事件订阅](/zh/reference/react/storage-and-events)
- [安全 Hook 与路由守卫](/zh/reference/react/cosec)
- [Wow 查询 Hook](/zh/reference/react/wow)
- [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities)

## 公开符号索引 {#public-symbols}

| 符号                                | 专题                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `ANONYMOUS_USER`                    | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-ANONYMOUS_USER)                                |
| `APIHooks`                          | [API Hook 工厂](/zh/reference/react/api-hooks#api-APIHooks)                                         |
| `ApiHooksMapping`                   | [API Hook 工厂](/zh/reference/react/api-hooks#api-ApiHooksMapping)                                  |
| `ApiMethod`                         | [API Hook 工厂](/zh/reference/react/api-hooks#api-ApiMethod)                                        |
| `CreateApiHooksOptions`             | [API Hook 工厂](/zh/reference/react/api-hooks#api-CreateApiHooksOptions)                            |
| `CreateExecuteApiHooksOptions`      | [API Hook 工厂](/zh/reference/react/api-hooks#api-CreateExecuteApiHooksOptions)                     |
| `CreateQueryApiHooksOptions`        | [API Hook 工厂](/zh/reference/react/api-hooks#api-CreateQueryApiHooksOptions)                       |
| `DataChangedEvent`                  | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-DataChangedEvent)               |
| `DataMonitorNotificationConfig`     | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-DataMonitorNotificationConfig)  |
| `DataMonitorService`                | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-DataMonitorService)             |
| `DebounceCapable`                   | [防抖执行](/zh/reference/react/debounce#api-DebounceCapable)                                        |
| `FullscreenContext`                 | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-FullscreenContext)              |
| `FullscreenContextValue`            | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-FullscreenContextValue)         |
| `FullscreenProvider`                | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-FullscreenProvider)             |
| `FullscreenProviderProps`           | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-FullscreenProviderProps)        |
| `FunctionParameters`                | [API Hook 工厂](/zh/reference/react/api-hooks#api-FunctionParameters)                               |
| `FunctionReturnType`                | [API Hook 工厂](/zh/reference/react/api-hooks#api-FunctionReturnType)                               |
| `HookName`                          | [API Hook 工厂](/zh/reference/react/api-hooks#api-HookName)                                         |
| `IsPromiseFunction`                 | [API Hook 工厂](/zh/reference/react/api-hooks#api-IsPromiseFunction)                                |
| `OnBeforeExecuteCallback`           | [API Hook 工厂](/zh/reference/react/api-hooks#api-OnBeforeExecuteCallback)                          |
| `PromiseState`                      | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-PromiseState)                  |
| `PromiseStateCallbacks`             | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-PromiseStateCallbacks)         |
| `PromiseStatus`                     | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-PromiseStatus)                 |
| `PromiseSupplier`                   | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-PromiseSupplier)               |
| `QueryAPIHooks`                     | [API Hook 工厂](/zh/reference/react/api-hooks#api-QueryAPIHooks)                                    |
| `QueryMethod`                       | [API Hook 工厂](/zh/reference/react/api-hooks#api-QueryMethod)                                      |
| `QueryOptions`                      | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-QueryOptions)                  |
| `RefreshableRouteGuard`             | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-RefreshableRouteGuard)                         |
| `RefreshableRouteGuardProps`        | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-RefreshableRouteGuardProps)                    |
| `RouteGuard`                        | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-RouteGuard)                                    |
| `RouteGuardProps`                   | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-RouteGuardProps)                               |
| `SecurityContext`                   | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-SecurityContext)                               |
| `SecurityContextOptions`            | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-SecurityContextOptions)                        |
| `SecurityContextValue`              | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-SecurityContextValue)                          |
| `SecurityProvider`                  | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-SecurityProvider)                              |
| `UseApiMethodExecuteOptions`        | [API Hook 工厂](/zh/reference/react/api-hooks#api-UseApiMethodExecuteOptions)                       |
| `UseApiMethodQueryOptions`          | [API Hook 工厂](/zh/reference/react/api-hooks#api-UseApiMethodQueryOptions)                         |
| `UseCountQueryOptions`              | [Wow 查询 Hook](/zh/reference/react/wow#api-UseCountQueryOptions)                                   |
| `UseCountQueryReturn`               | [Wow 查询 Hook](/zh/reference/react/wow#api-UseCountQueryReturn)                                    |
| `UseDataMonitorEventBusReturn`      | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseDataMonitorEventBusReturn)   |
| `UseDataMonitorOptions`             | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseDataMonitorOptions)          |
| `UseDataMonitorReturn`              | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseDataMonitorReturn)           |
| `UseDebouncedCallbackOptions`       | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedCallbackOptions)                            |
| `UseDebouncedCallbackReturn`        | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedCallbackReturn)                             |
| `UseDebouncedExecutePromiseOptions` | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedExecutePromiseOptions)                      |
| `UseDebouncedExecutePromiseReturn`  | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedExecutePromiseReturn)                       |
| `UseDebouncedFetcherOptions`        | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedFetcherOptions)                             |
| `UseDebouncedFetcherQueryOptions`   | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedFetcherQueryOptions)                        |
| `UseDebouncedFetcherQueryReturn`    | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedFetcherQueryReturn)                         |
| `UseDebouncedFetcherReturn`         | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedFetcherReturn)                              |
| `UseDebouncedQueryOptions`          | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedQueryOptions)                               |
| `UseDebouncedQueryReturn`           | [防抖执行](/zh/reference/react/debounce#api-UseDebouncedQueryReturn)                                |
| `UseEventSubscriptionOptions`       | [存储与事件订阅](/zh/reference/react/storage-and-events#api-UseEventSubscriptionOptions)            |
| `UseEventSubscriptionReturn`        | [存储与事件订阅](/zh/reference/react/storage-and-events#api-UseEventSubscriptionReturn)             |
| `UseExecutePromiseOptions`          | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseExecutePromiseOptions)      |
| `UseExecutePromiseReturn`           | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseExecutePromiseReturn)       |
| `UseFetcherCountQueryOptions`       | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherCountQueryOptions)                            |
| `UseFetcherCountQueryReturn`        | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherCountQueryReturn)                             |
| `UseFetcherListQueryOptions`        | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherListQueryOptions)                             |
| `UseFetcherListQueryReturn`         | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherListQueryReturn)                              |
| `UseFetcherListStreamQueryOptions`  | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherListStreamQueryOptions)                       |
| `UseFetcherListStreamQueryReturn`   | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherListStreamQueryReturn)                        |
| `UseFetcherOptions`                 | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-UseFetcherOptions)                        |
| `UseFetcherPagedQueryOptions`       | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherPagedQueryOptions)                            |
| `UseFetcherPagedQueryReturn`        | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherPagedQueryReturn)                             |
| `UseFetcherQueryOptions`            | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-UseFetcherQueryOptions)                   |
| `UseFetcherQueryReturn`             | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-UseFetcherQueryReturn)                    |
| `UseFetcherReturn`                  | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-UseFetcherReturn)                         |
| `UseFetcherSingleQueryOptions`      | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherSingleQueryOptions)                           |
| `UseFetcherSingleQueryReturn`       | [Wow 查询 Hook](/zh/reference/react/wow#api-UseFetcherSingleQueryReturn)                            |
| `UseFullscreenOptions`              | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseFullscreenOptions)           |
| `UseFullscreenReturn`               | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseFullscreenReturn)            |
| `UseListQueryOptions`               | [Wow 查询 Hook](/zh/reference/react/wow#api-UseListQueryOptions)                                    |
| `UseListQueryReturn`                | [Wow 查询 Hook](/zh/reference/react/wow#api-UseListQueryReturn)                                     |
| `UseListStreamQueryOptions`         | [Wow 查询 Hook](/zh/reference/react/wow#api-UseListStreamQueryOptions)                              |
| `UseListStreamQueryReturn`          | [Wow 查询 Hook](/zh/reference/react/wow#api-UseListStreamQueryReturn)                               |
| `UsePagedQueryOptions`              | [Wow 查询 Hook](/zh/reference/react/wow#api-UsePagedQueryOptions)                                   |
| `UsePagedQueryReturn`               | [Wow 查询 Hook](/zh/reference/react/wow#api-UsePagedQueryReturn)                                    |
| `UsePromiseStateOptions`            | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UsePromiseStateOptions)        |
| `UsePromiseStateReturn`             | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UsePromiseStateReturn)         |
| `UseQueryOptions`                   | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseQueryOptions)               |
| `UseQueryReturn`                    | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseQueryReturn)                |
| `UseQueryStateOptions`              | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseQueryStateOptions)          |
| `UseQueryStateReturn`               | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-UseQueryStateReturn)           |
| `UseRefsReturn`                     | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseRefsReturn)                  |
| `UseRequestIdReturn`                | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-UseRequestIdReturn)             |
| `UseSecurityOptions`                | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-UseSecurityOptions)                            |
| `UseSecurityReturn`                 | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-UseSecurityReturn)                             |
| `UseSingleQueryOptions`             | [Wow 查询 Hook](/zh/reference/react/wow#api-UseSingleQueryOptions)                                  |
| `UseSingleQueryReturn`              | [Wow 查询 Hook](/zh/reference/react/wow#api-UseSingleQueryReturn)                                   |
| `addFullscreenChangeListener`       | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-addFullscreenChangeListener)    |
| `collectMethods`                    | [API Hook 工厂](/zh/reference/react/api-hooks#api-collectMethods)                                   |
| `createExecuteApiHooks`             | [API Hook 工厂](/zh/reference/react/api-hooks#api-createExecuteApiHooks)                            |
| `createQueryApiHooks`               | [API Hook 工厂](/zh/reference/react/api-hooks#api-createQueryApiHooks)                              |
| `dataMonitorEventBus`               | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-dataMonitorEventBus)            |
| `dataMonitorService`                | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-dataMonitorService)             |
| `enterFullscreen`                   | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-enterFullscreen)                |
| `exitFullscreen`                    | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-exitFullscreen)                 |
| `getFullscreenElement`              | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-getFullscreenElement)           |
| `isFullscreen`                      | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-isFullscreen)                   |
| `isValidateQuery`                   | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-isValidateQuery)               |
| `methodNameToHookName`              | [API Hook 工厂](/zh/reference/react/api-hooks#api-methodNameToHookName)                             |
| `removeFullscreenChangeListener`    | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-removeFullscreenChangeListener) |
| `useCountQuery`                     | [Wow 查询 Hook](/zh/reference/react/wow#api-useCountQuery)                                          |
| `useDataMonitor`                    | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useDataMonitor)                 |
| `useDataMonitorEventBus`            | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useDataMonitorEventBus)         |
| `useDebouncedCallback`              | [防抖执行](/zh/reference/react/debounce#api-useDebouncedCallback)                                   |
| `useDebouncedExecutePromise`        | [防抖执行](/zh/reference/react/debounce#api-useDebouncedExecutePromise)                             |
| `useDebouncedFetcher`               | [防抖执行](/zh/reference/react/debounce#api-useDebouncedFetcher)                                    |
| `useDebouncedFetcherQuery`          | [防抖执行](/zh/reference/react/debounce#api-useDebouncedFetcherQuery)                               |
| `useDebouncedQuery`                 | [防抖执行](/zh/reference/react/debounce#api-useDebouncedQuery)                                      |
| `useEventSubscription`              | [存储与事件订阅](/zh/reference/react/storage-and-events#api-useEventSubscription)                   |
| `useExecutePromise`                 | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-useExecutePromise)             |
| `useFetcher`                        | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-useFetcher)                               |
| `useFetcherCountQuery`              | [Wow 查询 Hook](/zh/reference/react/wow#api-useFetcherCountQuery)                                   |
| `useFetcherListQuery`               | [Wow 查询 Hook](/zh/reference/react/wow#api-useFetcherListQuery)                                    |
| `useFetcherListStreamQuery`         | [Wow 查询 Hook](/zh/reference/react/wow#api-useFetcherListStreamQuery)                              |
| `useFetcherPagedQuery`              | [Wow 查询 Hook](/zh/reference/react/wow#api-useFetcherPagedQuery)                                   |
| `useFetcherQuery`                   | [Fetcher 请求 Hook](/zh/reference/react/fetcher-hooks#api-useFetcherQuery)                          |
| `useFetcherSingleQuery`             | [Wow 查询 Hook](/zh/reference/react/wow#api-useFetcherSingleQuery)                                  |
| `useForceUpdate`                    | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useForceUpdate)                 |
| `useFullscreen`                     | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useFullscreen)                  |
| `useFullscreenContext`              | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useFullscreenContext)           |
| `useImmerKeyStorage`                | [存储与事件订阅](/zh/reference/react/storage-and-events#api-useImmerKeyStorage)                     |
| `useKeyStorage`                     | [存储与事件订阅](/zh/reference/react/storage-and-events#api-useKeyStorage)                          |
| `useLatest`                         | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useLatest)                      |
| `useListQuery`                      | [Wow 查询 Hook](/zh/reference/react/wow#api-useListQuery)                                           |
| `useListStreamQuery`                | [Wow 查询 Hook](/zh/reference/react/wow#api-useListStreamQuery)                                     |
| `useMounted`                        | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useMounted)                     |
| `usePagedQuery`                     | [Wow 查询 Hook](/zh/reference/react/wow#api-usePagedQuery)                                          |
| `usePromiseState`                   | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-usePromiseState)               |
| `useQuery`                          | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-useQuery)                      |
| `useQueryState`                     | [Promise 与查询状态](/zh/reference/react/promise-and-query-state#api-useQueryState)                 |
| `useRefs`                           | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useRefs)                        |
| `useRequestId`                      | [监控、ref 与全屏](/zh/reference/react/monitoring-and-utilities#api-useRequestId)                   |
| `useSecurity`                       | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-useSecurity)                                   |
| `useSecurityContext`                | [安全 Hook 与路由守卫](/zh/reference/react/cosec#api-useSecurityContext)                            |
| `useSingleQuery`                    | [Wow 查询 Hook](/zh/reference/react/wow#api-useSingleQuery)                                         |
