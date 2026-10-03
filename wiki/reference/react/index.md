---
prev: false
title: 'React reference'
description: 'React entry selection, installation and behavior contracts'
---

# React

React hooks connect an asynchronous operation to one mounted component: state, execution, query-driven refresh and optional debounce. They do not provide a shared response cache. Start with an explicit action; add automatic queries only when input changes should issue requests.

One model runs through every hook: a request is identified by its `AbortController`, and only the current one may write state. State is one value `{ status, loading, result, error }`; `execute` never rejects and resolves to the state the execution ended in. Queries are controlled: the query lives in your state and the hook executes when its content changes.

## Choose an entry

| Need                            | Entry                                                                                                       | What you own                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Click to issue HTTP             | [useFetcher](./fetcher-hooks#api-useFetcher)                                                                | Request URL, Fetcher and result extractor. Render `result`; branch on the state `execute` resolves to.  |
| Execute another Promise API     | [useExecutePromise](./promise-and-query-state#api-useExecutePromise)                                        | Supplier and forwarding its controller signal to I/O.                                                   |
| Fetch on query changes          | [useQuery](./promise-and-query-state#api-useQuery) / [useFetcherQuery](./fetcher-hooks#api-useFetcherQuery) | The query, held in your own state; `undefined` means not ready. Automatic execution defaults to true.   |
| Delay search while typing       | [Debounced hooks](./debounce)                                                                               | Required delay; a debounced query adds `pending` and `flush()`, and `abort()` stops the active request. |
| Wrap an existing service        | [API hook factories](./api-hooks)                                                                           | Service object and methods; create hooks outside render.                                                |
| Only track someone else's state | [usePromiseState](./promise-and-query-state#api-usePromiseState)                                            | Execution, cleanup and stale-result handling remain outside this state-only hook.                       |

## Subpath entries {#subpath-entries}

| Entry                              | Exports                                                                                                   | Loads                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | Every hook and component on these pages                                                                   | All declared peers below                             |
| `@ahoo-wang/fetcher-react/core`    | Promise and query state, debounced callbacks, values and queries, `useLatest`, `useStableValue`           | React only; no `@ahoo-wang/*` package                |
| `@ahoo-wang/fetcher-react/fetcher` | `useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` and their option types | `@ahoo-wang/fetcher`; no CoSec, storage or event bus |

The subpaths are ESM-only; the root entry also ships a UMD build. They share one module graph with the root entry, so a hook or `PromiseStatus` imported from `/core` is the same value as the one imported from the root. The [symbol index](./symbols) marks which subpath exports each symbol. Declared peers are still installation requirements when you import a subpath; the subpath only limits what your bundle loads.

## Installation prerequisites

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage react react-dom
```

The library package declares Node >=18.20.8; repository development requires Node >=22.12.0 and pnpm 10.34.5. The command includes all transitive internal peers (React → CoSec → storage → event bus). Direct runtime dependencies (`dequal`, `immer`) are installed automatically. The external peer is React ^19.0.0; install the renderer your app uses (`react-dom` in the browser). Peers are installation requirements even when a particular feature is unused. Consumers do not need to duplicate the repository React Compiler toolchain.

::: info Changed in 6.0
The hooks were reworked around the model above (breaking). Removed: the fullscreen hooks, `useRefs`, `useForceUpdate`, `useMounted`, `useRequestId`, `useQueryState`, the `propagateError` option, `initialQuery`/`setQuery`/`getQuery` and `onBeforeExecute`. Each topic page notes what changed for its hooks; [Latest and stable values](./utilities#removed-in-6-0) lists what to use instead of the removed utilities.
:::

::: info Wow query hooks and data monitoring
The Wow query hooks (`useListQuery`, `usePagedQuery`, `useFetcherListQuery` and the rest) and the data-monitor hooks (`useDataMonitor`, `DataMonitorService`) remain only in the 5.x line (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x/packages/react)). From 6.0 the Wow hooks live in `@ahoo-wang/wow-react` in the Wow repository ([`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), [documentation](https://wow.ahoo.me)); it is not on npm yet and ships with Wow's first stable release. The data-monitor hooks were retired together with `@ahoo-wang/fetcher-viewer`.
:::

## Runnable core example

For setup, fixtures and expected results follow [the guide](../../guides/react/index.md).

<<< @/../stories/docs/ReactRequests.tsx

## Topics

- [Fetcher hooks](./fetcher-hooks)
- [Promise and query state](./promise-and-query-state)
- [API hook factories](./api-hooks)
- [Debounced execution](./debounce)
- [Storage and event subscriptions](./storage-and-events)
- [Security hooks and route guards](./cosec)
- [Latest and stable values](./utilities)
- [Complete symbol index](./symbols)

[State and resource ownership](../../architecture/state-and-resources) · [Failure and cancellation boundaries](../../architecture/failure-model)
