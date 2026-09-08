---
prev: false
title: 'React reference'
description: 'React entry selection, installation and behavior contracts'
---

# React

React hooks connect an asynchronous operation to one mounted component: state, execution, query-driven refresh and optional debounce. They do not provide a shared response cache. Start with an explicit action; add automatic queries only when input changes should issue requests.

## Choose an entry

| Need                            | Entry                                                                                                       | What you own                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Click to issue HTTP             | [useFetcher](./fetcher-hooks#api-useFetcher)                                                                | Request URL, Fetcher and result extractor. Read `result`, not the execute return value. |
| Execute another Promise API     | [useExecutePromise](./promise-and-query-state#api-useExecutePromise)                                        | Supplier and forwarding its controller signal to I/O.                                   |
| Fetch on query changes          | [useQuery](./promise-and-query-state#api-useQuery) / [useFetcherQuery](./fetcher-hooks#api-useFetcherQuery) | Initial/reactive query; automatic execution defaults true for ordinary query hooks.     |
| Delay search while typing       | [Debounced hooks](./debounce)                                                                               | Required delay; timer `cancel()` and active request `abort()` are separate.             |
| Wrap an existing service        | [API hook factories](./api-hooks)                                                                           | Service object and methods; create hooks outside render.                                |
| Only track someone else's state | [usePromiseState](./promise-and-query-state#api-usePromiseState)                                            | Execution, cleanup and stale-result handling remain outside this state-only hook.       |

## Installation prerequisites

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-wow react react-dom
```

This reference targets 5.0.0. The library package declares Node >=18.20.8; repository development requires Node >=20.20.2 and pnpm 10.34.5. The command includes all transitive internal peers, including packages reached through Wow/React/CoSec. Direct runtime dependencies are installed automatically. External peer ranges are React/ReactDOM ^19.2.8. They are installation requirements even when a particular feature is unused. Consumers do not need to duplicate the repository React Compiler toolchain.

## Runnable core example

For setup, fixtures and expected results follow [the guide](../../guides/react/index.md).

<<< @/../stories/docs/ReactRequests.tsx

## Topics

- [Fetcher hooks](./fetcher-hooks)
- [Promise and query state](./promise-and-query-state)
- [API hook factories](./api-hooks)
- [Debounced execution](./debounce)
- [Wow query hooks](./wow)
- [Storage and event subscriptions](./storage-and-events)
- [Security hooks and route guards](./cosec)
- [Monitoring, refs and fullscreen](./monitoring-and-utilities)
- [Complete symbol index](./symbols)

[State and resource ownership](../../architecture/state-and-resources) · [Failure and cancellation boundaries](../../architecture/failure-model)
