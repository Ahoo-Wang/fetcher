---
title: State and resource ownership
description: Assign request state, stale results, subscriptions and cleanup to their actual owners.
---

# State and resource ownership

Decide who owns each value before connecting a component to a request Hook. A Hook can protect its own state from stale results without owning your data source or undoing server work.

## Application, Hook, and service

Arrows below name data passed or actions requested. They are ownership interactions, not package dependencies.

```mermaid
flowchart LR
  App[Application] -->|creates executor and handles errors| Hook[React Hook]
  Hook -->|runs executor with abort signal| Server[Application service]
  Server -->|result or failure| Hook
  Hook -->|loading result error| UI[Application UI]
  App -->|query input and data shaping| UI
  classDef default fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

| State or resource                  | Owner and update path                                                                                      | Cleanup or limit                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Hook `loading/result/error/status` | `useExecutePromise` holds one state value; only the execution whose `AbortController` is current writes it | New execution, `abort()`, `reset()` and unmount abort the controller; executor must use it to stop real work |
| Hook exchange                      | `useFetcher` derives it from `result` or an `ExchangeError`, and selects explicit or registered client     | Shared client state has its own lifetime                                                                     |
| Query input                        | Your state; `useQuery` / `useFetcherQuery` re-execute when its content changes (`undefined` = not ready)   | The Hook does not cache responses across components; share data through your own state or service            |
| Debounce timer                     | Debounced Hooks own their timer; debounced queries debounce the query value (`pending`, `flush()`)         | Timer `cancel()`/waiting query and active request `abort()` are separate                                     |
| Rows, totals and view preferences  | The application and its service                                                                            | Filtering, sorting, pagination and persistence are application decisions                                     |

Hook behavior: [packages/react/src/core/useExecutePromise.ts:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L107), [packages/react/src/core/useQuery.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQuery.ts#L58), and [packages/react/src/fetcher/useFetcher.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L67). `abort()` and `reset()` both cancel the execution in flight; `abort()` keeps a settled result, `reset()` clears it.

Stale-result protection keeps an old response from overwriting newer UI state. It does not authorize access, revoke a command already sent, or promise that a later read reflects an earlier write; decide those with the service.

## Identity changes and disposal

Remount the subtree that owns request state when the tenant or user changes, so no Hook result crosses identities. Scope storage keys and event buses to the same identity.

| Resource                 | What disposal does                                                                                   | What its creator still owns                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| React event subscription | Effect cleanup removes the subscription it made, never another subscriber's handler of the same name | Shared bus lifetime                                                                                                |
| KeyStorage               | `destroy()` removes its own event handler and closes the bus it created                              | Persistent data and any event bus passed in `eventBus`; default serial bus is local, not cross-tab synchronization |
| BroadcastTypedEventBus   | `destroy()` closes its messenger                                                                     | Appropriate lifetime of shared users before closing it                                                             |

See [packages/react/src/eventbus/useEventSubscription.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/eventbus/useEventSubscription.ts#L94), [packages/storage/src/keyStorage.ts:119](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L119), [packages/storage/src/keyStorage.ts:340](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L340), and [packages/eventbus/src/broadcastTypedEventBus.ts:252](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/broadcastTypedEventBus.ts#L252). Follow [React cleanup](../guides/react/cleanup.md), [storage and events](../guides/integrations/storage-and-events.md), and [SSR scope](./runtime-support.md).

The saved-view confirmation rules of the 5.x Viewer and FetcherViewer are documented with that line in the [saved-view guide](../guides/viewer/saved-views.md) and the [FetcherViewer reference](../reference/viewer/fetcher-viewer.md).
