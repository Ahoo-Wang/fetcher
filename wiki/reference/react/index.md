---
title: 'React Reference'
description: '@ahoo-wang/fetcher-react 5.0.0 API reference'
---

# React

React hooks for Fetcher, asynchronous state, Wow queries and shared browser resources. Import from the package root. React 19 integration is used by this repository; the package declares Node &gt;=18.20.8. The repository contributor toolchain has a separate, higher Node requirement. Notification internals are not root exports.

## Installation

```sh
pnpm add @ahoo-wang/fetcher-react
```

Also satisfy peerDependencies in [package.json](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/package.json#L1); this reference targets 5.0.0.

## Minimal example

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

## Topics

- [Fetcher hooks](/reference/react/fetcher-hooks)
- [Promise and query state](/reference/react/promise-and-query-state)
- [API hook factories](/reference/react/api-hooks)
- [Debounced execution](/reference/react/debounce)
- [Storage and event subscriptions](/reference/react/storage-and-events)
- [Security hooks and route guards](/reference/react/cosec)
- [Wow query hooks](/reference/react/wow)
- [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities)

## Public symbol index {#public-symbols}

| Symbol                              | Topic                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `ANONYMOUS_USER`                    | [Security hooks and route guards](/reference/react/cosec#api-ANONYMOUS_USER)                                    |
| `APIHooks`                          | [API hook factories](/reference/react/api-hooks#api-APIHooks)                                                   |
| `ApiHooksMapping`                   | [API hook factories](/reference/react/api-hooks#api-ApiHooksMapping)                                            |
| `ApiMethod`                         | [API hook factories](/reference/react/api-hooks#api-ApiMethod)                                                  |
| `CreateApiHooksOptions`             | [API hook factories](/reference/react/api-hooks#api-CreateApiHooksOptions)                                      |
| `CreateExecuteApiHooksOptions`      | [API hook factories](/reference/react/api-hooks#api-CreateExecuteApiHooksOptions)                               |
| `CreateQueryApiHooksOptions`        | [API hook factories](/reference/react/api-hooks#api-CreateQueryApiHooksOptions)                                 |
| `DataChangedEvent`                  | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-DataChangedEvent)               |
| `DataMonitorNotificationConfig`     | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-DataMonitorNotificationConfig)  |
| `DataMonitorService`                | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-DataMonitorService)             |
| `DebounceCapable`                   | [Debounced execution](/reference/react/debounce#api-DebounceCapable)                                            |
| `FullscreenContext`                 | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-FullscreenContext)              |
| `FullscreenContextValue`            | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-FullscreenContextValue)         |
| `FullscreenProvider`                | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-FullscreenProvider)             |
| `FullscreenProviderProps`           | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-FullscreenProviderProps)        |
| `FunctionParameters`                | [API hook factories](/reference/react/api-hooks#api-FunctionParameters)                                         |
| `FunctionReturnType`                | [API hook factories](/reference/react/api-hooks#api-FunctionReturnType)                                         |
| `HookName`                          | [API hook factories](/reference/react/api-hooks#api-HookName)                                                   |
| `IsPromiseFunction`                 | [API hook factories](/reference/react/api-hooks#api-IsPromiseFunction)                                          |
| `OnBeforeExecuteCallback`           | [API hook factories](/reference/react/api-hooks#api-OnBeforeExecuteCallback)                                    |
| `PromiseState`                      | [Promise and query state](/reference/react/promise-and-query-state#api-PromiseState)                            |
| `PromiseStateCallbacks`             | [Promise and query state](/reference/react/promise-and-query-state#api-PromiseStateCallbacks)                   |
| `PromiseStatus`                     | [Promise and query state](/reference/react/promise-and-query-state#api-PromiseStatus)                           |
| `PromiseSupplier`                   | [Promise and query state](/reference/react/promise-and-query-state#api-PromiseSupplier)                         |
| `QueryAPIHooks`                     | [API hook factories](/reference/react/api-hooks#api-QueryAPIHooks)                                              |
| `QueryMethod`                       | [API hook factories](/reference/react/api-hooks#api-QueryMethod)                                                |
| `QueryOptions`                      | [Promise and query state](/reference/react/promise-and-query-state#api-QueryOptions)                            |
| `RefreshableRouteGuard`             | [Security hooks and route guards](/reference/react/cosec#api-RefreshableRouteGuard)                             |
| `RefreshableRouteGuardProps`        | [Security hooks and route guards](/reference/react/cosec#api-RefreshableRouteGuardProps)                        |
| `RouteGuard`                        | [Security hooks and route guards](/reference/react/cosec#api-RouteGuard)                                        |
| `RouteGuardProps`                   | [Security hooks and route guards](/reference/react/cosec#api-RouteGuardProps)                                   |
| `SecurityContext`                   | [Security hooks and route guards](/reference/react/cosec#api-SecurityContext)                                   |
| `SecurityContextOptions`            | [Security hooks and route guards](/reference/react/cosec#api-SecurityContextOptions)                            |
| `SecurityContextValue`              | [Security hooks and route guards](/reference/react/cosec#api-SecurityContextValue)                              |
| `SecurityProvider`                  | [Security hooks and route guards](/reference/react/cosec#api-SecurityProvider)                                  |
| `UseApiMethodExecuteOptions`        | [API hook factories](/reference/react/api-hooks#api-UseApiMethodExecuteOptions)                                 |
| `UseApiMethodQueryOptions`          | [API hook factories](/reference/react/api-hooks#api-UseApiMethodQueryOptions)                                   |
| `UseCountQueryOptions`              | [Wow query hooks](/reference/react/wow#api-UseCountQueryOptions)                                                |
| `UseCountQueryReturn`               | [Wow query hooks](/reference/react/wow#api-UseCountQueryReturn)                                                 |
| `UseDataMonitorEventBusReturn`      | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseDataMonitorEventBusReturn)   |
| `UseDataMonitorOptions`             | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseDataMonitorOptions)          |
| `UseDataMonitorReturn`              | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseDataMonitorReturn)           |
| `UseDebouncedCallbackOptions`       | [Debounced execution](/reference/react/debounce#api-UseDebouncedCallbackOptions)                                |
| `UseDebouncedCallbackReturn`        | [Debounced execution](/reference/react/debounce#api-UseDebouncedCallbackReturn)                                 |
| `UseDebouncedExecutePromiseOptions` | [Debounced execution](/reference/react/debounce#api-UseDebouncedExecutePromiseOptions)                          |
| `UseDebouncedExecutePromiseReturn`  | [Debounced execution](/reference/react/debounce#api-UseDebouncedExecutePromiseReturn)                           |
| `UseDebouncedFetcherOptions`        | [Debounced execution](/reference/react/debounce#api-UseDebouncedFetcherOptions)                                 |
| `UseDebouncedFetcherQueryOptions`   | [Debounced execution](/reference/react/debounce#api-UseDebouncedFetcherQueryOptions)                            |
| `UseDebouncedFetcherQueryReturn`    | [Debounced execution](/reference/react/debounce#api-UseDebouncedFetcherQueryReturn)                             |
| `UseDebouncedFetcherReturn`         | [Debounced execution](/reference/react/debounce#api-UseDebouncedFetcherReturn)                                  |
| `UseDebouncedQueryOptions`          | [Debounced execution](/reference/react/debounce#api-UseDebouncedQueryOptions)                                   |
| `UseDebouncedQueryReturn`           | [Debounced execution](/reference/react/debounce#api-UseDebouncedQueryReturn)                                    |
| `UseEventSubscriptionOptions`       | [Storage and event subscriptions](/reference/react/storage-and-events#api-UseEventSubscriptionOptions)          |
| `UseEventSubscriptionReturn`        | [Storage and event subscriptions](/reference/react/storage-and-events#api-UseEventSubscriptionReturn)           |
| `UseExecutePromiseOptions`          | [Promise and query state](/reference/react/promise-and-query-state#api-UseExecutePromiseOptions)                |
| `UseExecutePromiseReturn`           | [Promise and query state](/reference/react/promise-and-query-state#api-UseExecutePromiseReturn)                 |
| `UseFetcherCountQueryOptions`       | [Wow query hooks](/reference/react/wow#api-UseFetcherCountQueryOptions)                                         |
| `UseFetcherCountQueryReturn`        | [Wow query hooks](/reference/react/wow#api-UseFetcherCountQueryReturn)                                          |
| `UseFetcherListQueryOptions`        | [Wow query hooks](/reference/react/wow#api-UseFetcherListQueryOptions)                                          |
| `UseFetcherListQueryReturn`         | [Wow query hooks](/reference/react/wow#api-UseFetcherListQueryReturn)                                           |
| `UseFetcherListStreamQueryOptions`  | [Wow query hooks](/reference/react/wow#api-UseFetcherListStreamQueryOptions)                                    |
| `UseFetcherListStreamQueryReturn`   | [Wow query hooks](/reference/react/wow#api-UseFetcherListStreamQueryReturn)                                     |
| `UseFetcherOptions`                 | [Fetcher hooks](/reference/react/fetcher-hooks#api-UseFetcherOptions)                                           |
| `UseFetcherPagedQueryOptions`       | [Wow query hooks](/reference/react/wow#api-UseFetcherPagedQueryOptions)                                         |
| `UseFetcherPagedQueryReturn`        | [Wow query hooks](/reference/react/wow#api-UseFetcherPagedQueryReturn)                                          |
| `UseFetcherQueryOptions`            | [Fetcher hooks](/reference/react/fetcher-hooks#api-UseFetcherQueryOptions)                                      |
| `UseFetcherQueryReturn`             | [Fetcher hooks](/reference/react/fetcher-hooks#api-UseFetcherQueryReturn)                                       |
| `UseFetcherReturn`                  | [Fetcher hooks](/reference/react/fetcher-hooks#api-UseFetcherReturn)                                            |
| `UseFetcherSingleQueryOptions`      | [Wow query hooks](/reference/react/wow#api-UseFetcherSingleQueryOptions)                                        |
| `UseFetcherSingleQueryReturn`       | [Wow query hooks](/reference/react/wow#api-UseFetcherSingleQueryReturn)                                         |
| `UseFullscreenOptions`              | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseFullscreenOptions)           |
| `UseFullscreenReturn`               | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseFullscreenReturn)            |
| `UseListQueryOptions`               | [Wow query hooks](/reference/react/wow#api-UseListQueryOptions)                                                 |
| `UseListQueryReturn`                | [Wow query hooks](/reference/react/wow#api-UseListQueryReturn)                                                  |
| `UseListStreamQueryOptions`         | [Wow query hooks](/reference/react/wow#api-UseListStreamQueryOptions)                                           |
| `UseListStreamQueryReturn`          | [Wow query hooks](/reference/react/wow#api-UseListStreamQueryReturn)                                            |
| `UsePagedQueryOptions`              | [Wow query hooks](/reference/react/wow#api-UsePagedQueryOptions)                                                |
| `UsePagedQueryReturn`               | [Wow query hooks](/reference/react/wow#api-UsePagedQueryReturn)                                                 |
| `UsePromiseStateOptions`            | [Promise and query state](/reference/react/promise-and-query-state#api-UsePromiseStateOptions)                  |
| `UsePromiseStateReturn`             | [Promise and query state](/reference/react/promise-and-query-state#api-UsePromiseStateReturn)                   |
| `UseQueryOptions`                   | [Promise and query state](/reference/react/promise-and-query-state#api-UseQueryOptions)                         |
| `UseQueryReturn`                    | [Promise and query state](/reference/react/promise-and-query-state#api-UseQueryReturn)                          |
| `UseQueryStateOptions`              | [Promise and query state](/reference/react/promise-and-query-state#api-UseQueryStateOptions)                    |
| `UseQueryStateReturn`               | [Promise and query state](/reference/react/promise-and-query-state#api-UseQueryStateReturn)                     |
| `UseRefsReturn`                     | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseRefsReturn)                  |
| `UseRequestIdReturn`                | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-UseRequestIdReturn)             |
| `UseSecurityOptions`                | [Security hooks and route guards](/reference/react/cosec#api-UseSecurityOptions)                                |
| `UseSecurityReturn`                 | [Security hooks and route guards](/reference/react/cosec#api-UseSecurityReturn)                                 |
| `UseSingleQueryOptions`             | [Wow query hooks](/reference/react/wow#api-UseSingleQueryOptions)                                               |
| `UseSingleQueryReturn`              | [Wow query hooks](/reference/react/wow#api-UseSingleQueryReturn)                                                |
| `addFullscreenChangeListener`       | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-addFullscreenChangeListener)    |
| `collectMethods`                    | [API hook factories](/reference/react/api-hooks#api-collectMethods)                                             |
| `createExecuteApiHooks`             | [API hook factories](/reference/react/api-hooks#api-createExecuteApiHooks)                                      |
| `createQueryApiHooks`               | [API hook factories](/reference/react/api-hooks#api-createQueryApiHooks)                                        |
| `dataMonitorEventBus`               | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-dataMonitorEventBus)            |
| `dataMonitorService`                | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-dataMonitorService)             |
| `enterFullscreen`                   | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-enterFullscreen)                |
| `exitFullscreen`                    | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-exitFullscreen)                 |
| `getFullscreenElement`              | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-getFullscreenElement)           |
| `isFullscreen`                      | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-isFullscreen)                   |
| `isValidateQuery`                   | [Promise and query state](/reference/react/promise-and-query-state#api-isValidateQuery)                         |
| `methodNameToHookName`              | [API hook factories](/reference/react/api-hooks#api-methodNameToHookName)                                       |
| `removeFullscreenChangeListener`    | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-removeFullscreenChangeListener) |
| `useCountQuery`                     | [Wow query hooks](/reference/react/wow#api-useCountQuery)                                                       |
| `useDataMonitor`                    | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useDataMonitor)                 |
| `useDataMonitorEventBus`            | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useDataMonitorEventBus)         |
| `useDebouncedCallback`              | [Debounced execution](/reference/react/debounce#api-useDebouncedCallback)                                       |
| `useDebouncedExecutePromise`        | [Debounced execution](/reference/react/debounce#api-useDebouncedExecutePromise)                                 |
| `useDebouncedFetcher`               | [Debounced execution](/reference/react/debounce#api-useDebouncedFetcher)                                        |
| `useDebouncedFetcherQuery`          | [Debounced execution](/reference/react/debounce#api-useDebouncedFetcherQuery)                                   |
| `useDebouncedQuery`                 | [Debounced execution](/reference/react/debounce#api-useDebouncedQuery)                                          |
| `useEventSubscription`              | [Storage and event subscriptions](/reference/react/storage-and-events#api-useEventSubscription)                 |
| `useExecutePromise`                 | [Promise and query state](/reference/react/promise-and-query-state#api-useExecutePromise)                       |
| `useFetcher`                        | [Fetcher hooks](/reference/react/fetcher-hooks#api-useFetcher)                                                  |
| `useFetcherCountQuery`              | [Wow query hooks](/reference/react/wow#api-useFetcherCountQuery)                                                |
| `useFetcherListQuery`               | [Wow query hooks](/reference/react/wow#api-useFetcherListQuery)                                                 |
| `useFetcherListStreamQuery`         | [Wow query hooks](/reference/react/wow#api-useFetcherListStreamQuery)                                           |
| `useFetcherPagedQuery`              | [Wow query hooks](/reference/react/wow#api-useFetcherPagedQuery)                                                |
| `useFetcherQuery`                   | [Fetcher hooks](/reference/react/fetcher-hooks#api-useFetcherQuery)                                             |
| `useFetcherSingleQuery`             | [Wow query hooks](/reference/react/wow#api-useFetcherSingleQuery)                                               |
| `useForceUpdate`                    | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useForceUpdate)                 |
| `useFullscreen`                     | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useFullscreen)                  |
| `useFullscreenContext`              | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useFullscreenContext)           |
| `useImmerKeyStorage`                | [Storage and event subscriptions](/reference/react/storage-and-events#api-useImmerKeyStorage)                   |
| `useKeyStorage`                     | [Storage and event subscriptions](/reference/react/storage-and-events#api-useKeyStorage)                        |
| `useLatest`                         | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useLatest)                      |
| `useListQuery`                      | [Wow query hooks](/reference/react/wow#api-useListQuery)                                                        |
| `useListStreamQuery`                | [Wow query hooks](/reference/react/wow#api-useListStreamQuery)                                                  |
| `useMounted`                        | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useMounted)                     |
| `usePagedQuery`                     | [Wow query hooks](/reference/react/wow#api-usePagedQuery)                                                       |
| `usePromiseState`                   | [Promise and query state](/reference/react/promise-and-query-state#api-usePromiseState)                         |
| `useQuery`                          | [Promise and query state](/reference/react/promise-and-query-state#api-useQuery)                                |
| `useQueryState`                     | [Promise and query state](/reference/react/promise-and-query-state#api-useQueryState)                           |
| `useRefs`                           | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useRefs)                        |
| `useRequestId`                      | [Monitoring, refs and fullscreen](/reference/react/monitoring-and-utilities#api-useRequestId)                   |
| `useSecurity`                       | [Security hooks and route guards](/reference/react/cosec#api-useSecurity)                                       |
| `useSecurityContext`                | [Security hooks and route guards](/reference/react/cosec#api-useSecurityContext)                                |
| `useSingleQuery`                    | [Wow query hooks](/reference/react/wow#api-useSingleQuery)                                                      |

## Earlier section links

Earlier reference links still lead to the corresponding topics below.

| Earlier section | Current topic |
| --- | --- |
| <span id="install-and-fetcher-source"></span>Install and Fetcher source | [Read this topic](/reference/react/index.md) |
| <span id="choose-a-public-hook"></span>Choose a public hook | [Read this topic](/reference/react/index.md) |
| <span id="remaining-root-helpers-and-api-hook-factories"></span>Remaining root helpers and API-hook factories | [Read this topic](/reference/react/monitoring-and-utilities.md) |
| <span id="promise-and-query-contract"></span>Promise and query contract | [Read this topic](/reference/react/promise-and-query-state.md) |
| <span id="debounce-and-fullscreen"></span>Debounce and fullscreen | [Read this topic](/reference/react/monitoring-and-utilities.md) |
| <span id="cosec-monitors-and-wow"></span>CoSec, monitors, and Wow | [Read this topic](/reference/react/monitoring-and-utilities.md) |
| <span id="diagnose"></span>Diagnose | [Read this topic](/reference/react/index.md) |
| <span id="source-and-runnable-scenarios"></span>Source and runnable scenarios | [Read this topic](/reference/react/index.md) |
