---
title: React reference
description: Own Fetcher, query, storage, event, security, and Wow state in React.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-react`

`@ahoo-wang/fetcher-react` binds Fetcher ecosystem operations to React state. It is for component-owned asynchronous work, query state, CoSec context, storage, events, and Wow query shapes; it is not a Fetcher provider or a cache/query-client replacement.

## Install and Fetcher source

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

Install a peer package only for the integration used: `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-cosec`, `@ahoo-wang/fetcher-storage`, `@ahoo-wang/fetcher-eventbus`, or `@ahoo-wang/fetcher-eventstream`.

There is **no Fetcher Provider** in this package. `useFetcher` takes an optional `fetcher`; otherwise it resolves `fetcherRegistrar.default` through `getFetcher`. Configure the core registrar before rendering, or pass a stable Fetcher instance created outside render / with `useMemo`. [useFetcher:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37) [useFetcher:162](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L162)

`SecurityProvider` is different: it owns a `TokenStorage`-backed security context for its descendants. [SecurityContext:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L49) [SecurityContext:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L107)

## Choose a public hook

| Need | Public API | Execution and ownership |
| --- | --- | --- |
| Set `idle` / `loading` / `success` / `error` yourself | `usePromiseState` | State only; no promise is started. |
| One abortable promise supplier | `useExecutePromise` | Call `execute(supplier)`; the hook owns its controller and result state. |
| Query object plus arbitrary executor | `useQuery`, `useQueryState` | `autoExecute` defaults to `true`; `setQuery` and mount can execute. |
| Complete `FetchRequest` | `useFetcher` | Call `execute(request)`; optional `fetcher`, otherwise registrar default. |
| JSON POST body from query state | `useFetcherQuery` | Requires `url`; POSTs the query and defaults to `JsonResultExtractor`. |
| Delay callback, query, Fetcher, or Fetcher query | `useDebouncedCallback`, `useDebouncedQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` | Use `run`, `cancel`, and `isPending`, not `execute`. |
| Browser fullscreen state | `useFullscreen`, `FullscreenProvider`, `useFullscreenContext` | Owns fullscreen event subscription; target defaults to `document.documentElement`. |
| CoSec sign-in state / route protection | `SecurityProvider`, `useSecurityContext`, `useSecurity`, `RouteGuard`, `RefreshableRouteGuard` | Provider owns the context; a direct hook call owns only that component's subscription. |
| Typed storage or EventBus subscription | `useKeyStorage`, `useImmerKeyStorage`, `useEventSubscription` | Pass a stable storage/bus object and clean up with the component lifecycle. |
| Data-count monitor | `useDataMonitor`, `useDataMonitorEventBus`, `DataMonitorService` | Hook enables/disables the module-level monitor by `viewId`; it disables an enabled monitor on unmount. |
| Wow query result shape | `useSingleQuery`, `useListQuery`, `usePagedQuery`, `useCountQuery`, `useListStreamQuery` | Supply the executor; result is respectively `R`, `R[]`, `PagedList<R>`, `number`, or an SSE `ReadableStream`. |
| Wow POST query | `useFetcherSingleQuery`, `useFetcherListQuery`, `useFetcherPagedQuery`, `useFetcherCountQuery`, `useFetcherListStreamQuery` | Add the endpoint `url`; these specialize `useFetcherQuery`. |
| Notification center | None from the package root | `notification/` is not re-exported by the published root entry; do not import `src` internals. [index:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14) |

The root barrel is the public boundary; only its re-exported groups are supported. [index:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14)

## Promise and query contract

All execution hooks expose `status`, `loading`, `result`, `error`, `reset`, and `abort`; `useFetcher` additionally exposes the latest `exchange`. `PromiseStatus` is `idle`, `loading`, `success`, or `error`. [usePromiseState:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L22) [useFetcher:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L47)

`useExecutePromise` gives each execution an `AbortController`, aborts an earlier owned operation before another starts, accepts only the latest request ID, and aborts during unmount cleanup. `AbortError` returns the state to idle. Rejections update `error`; they are rethrown only when `propagateError: true` (default `false`). [useExecutePromise:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L27) [useExecutePromise:244](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L244) [useExecutePromise:307](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L307)

`useQuery` / `useFetcherQuery` retain the query in a ref: `getQuery()` can be `undefined`; `setQuery(query)` stores it and executes when `autoExecute` is true. A supplied `query` wins over `initialQuery`. Equal controlled-query values are de-duplicated, while a changed executor or `autoExecute` setting is still honored. [useQueryState:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L18) [useQueryState:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L113) [useFetcherQuery:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L125)

```tsx
import { useCallback } from 'react';
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

type SearchQuery = { term: string };
type SearchResult = { items: Array<{ id: string; title: string }> };

export function Search() {
  const search = useFetcherQuery<SearchQuery, SearchResult>({
    url: '/api/search',
    initialQuery: { term: '' },
    autoExecute: false,
  });
  const submit = useCallback(() => void search.execute(), [search]);

  return (
    <form onSubmit={event => { event.preventDefault(); submit(); }}>
      <input onChange={event => search.setQuery({ term: event.target.value })} />
      <button disabled={search.loading}>Search</button>
      {search.error && <p role="alert">Search failed</p>}
      {search.result?.items.map(item => <p key={item.id}>{item.title}</p>)}
    </form>
  );
}
```

The hook, not the component, owns request cancellation. The component still owns when to call `abort()`, whether an empty successful list is meaningful, and the UI for loading/error/retry. Keep option callbacks and any explicit Fetcher stable when their identity should not change request semantics.

## Debounce and fullscreen

`useDebouncedCallback` requires a positive `delay`; defaults are `leading: false` and `trailing: true`, and setting both to `false` throws. Pending timeouts are cancelled at unmount. The debounced query variants force their inner query's auto-execution off, then call `run()` on mount and after `setQuery` only when the caller requested `autoExecute`. `cancel()` cancels a timer; `abort()` cancels an already-started request. [useDebouncedCallback:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L19) [useDebouncedCallback:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L87) [useDebouncedQuery:139](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L139)

`useFullscreen` tracks the browser `fullscreenchange` event and returns `fullscreen`, `getTarget`, `enter`, `exit`, and `toggle`; a direct target argument takes precedence over the configured ref and the document root fallback. `FullscreenProvider` supplies that same return value and wraps children in a `<div>` only when it supplies the target itself. [useFullscreen:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/useFullscreen.ts#L24) [FullscreenContext:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L28)

## CoSec, monitors, and Wow

`SecurityProvider` requires `tokenStorage`; `useSecurityContext()` throws outside it. `signIn` accepts a `CompositeToken` or async supplier, persists through `TokenStorage.signIn`, and runs `onSignIn`; `signOut` removes the stored key and runs `onSignOut`. Do not create a token storage in render. [SecurityContext:146](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L146) [useSecurity:150](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L150)

`useDataMonitor` requires `viewId`, `countUrl`, `viewName`, `condition`, and notification settings. It updates the enabled monitor when condition or notification changes and disables the current `viewId` on unmount. `useDataMonitorEventBus` returns named `subscribe` / `unsubscribe`; unsubscribe it when its subscription should end. [useDataMonitor:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L9) [useDataMonitor:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L61) [useDataMonitorEventBus:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L18)

The non-Fetcher Wow hooks are type-specialized `useQuery` calls; they do not know an endpoint. For a projection or partial result, declare the returned row type rather than the full aggregate. The streaming variant returns a `ReadableStream<JsonServerSentEvent<R>>`; consume/cancel its reader in your effect cleanup in addition to aborting a replacement request. [usePagedQuery:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/usePagedQuery.ts#L32) [useListStreamQuery:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/useListStreamQuery.ts#L32) [useFetcherListStreamQuery:175](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/fetcher/useFetcherListStreamQuery.ts#L175)

## Diagnose

| Symptom | Check |
| --- | --- |
| Request fires on first render | `autoExecute` defaults to `true`; set it to `false` for user-triggered work. |
| Older result appears to win | Do not bypass the hook with a separate state write; one hook must own that operation. |
| Debounce cancel did not stop HTTP | `cancel()` only clears a pending timer; call `abort()` after `run()` has started the request. |
| `useSecurityContext` throws | Render below `SecurityProvider` with a stable `TokenStorage`. |
| Fullscreen target is wrong | Pass a ref through `target`, or pass the target to `enter` / `toggle`. |
| Cannot import notifications | The root barrel excludes `notification`; use a supported public integration instead of an internal path. |

## Source and runnable scenarios

- Public exports: [packages/react/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14)
- Promise and Fetcher scenarios: [Async State](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-async-state--success), [Fetcher success](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-fetcher--get-success), and [debounced request](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-fetcher--debounced-request)
- Wow result-shape scenarios: [single, list, paged, count, and stream](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-wow-queries--single)

Continue with [React data flow](../learn/react-data-flow.md).
