---
title: React reference
description: Manage Fetcher requests, queries, storage, events, and authorization state in React.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-react`

The React package connects Fetcher primitives to component state. Its hooks
protect against stale results, abort requests on replacement or unmount, and
expose explicit loading, result, error, and reset controls.

## Install

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

Install the peer package for each integration you import, such as
`fetcher-storage`, `fetcher-eventbus`, `fetcher-wow`, or `fetcher-cosec`.

## Fetch and query

```tsx
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

interface SearchQuery {
  term: string;
}

interface SearchResult {
  items: Array<{ id: string; title: string }>;
}

function Search() {
  const { loading, result, error, setQuery, execute } = useFetcherQuery<
    SearchQuery,
    SearchResult
  >({
    url: '/api/search',
    initialQuery: { term: '' },
    autoExecute: false,
  });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        void execute();
      }}
    >
      <input onChange={event => setQuery({ term: event.target.value })} />
      <button disabled={loading}>Search</button>
      {error && <p role="alert">Search failed</p>}
      <ul>
        {result?.items.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </form>
  );
}
```

`useFetcher` executes complete `FetchRequest` objects. `useFetcherQuery`
specializes it for JSON POST queries and owns query state. Debounced variants
delay rapidly changing work while preserving cancellation behavior.

## Hook families

| Family             | Primary APIs                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Async state        | `useExecutePromise`, `usePromiseState`, `useQuery`, `useQueryState`                      |
| Fetcher            | `useFetcher`, `useFetcherQuery`, debounced variants                                      |
| API objects        | `createExecuteApiHooks`, `createQueryApiHooks`                                           |
| Storage and events | `useKeyStorage`, `useImmerKeyStorage`, `useEventSubscription`                            |
| Wow                | `useSingleQuery`, `useListQuery`, `usePagedQuery`, `useCountQuery`, `useListStreamQuery` |
| CoSec              | `SecurityProvider`, `useSecurity`, `RouteGuard`, `RefreshableRouteGuard`                 |
| Monitoring         | `useDataMonitor`, `useDataMonitorEventBus`, `DataMonitorService`                         |

## State and ownership

Use one hook as the owner of each request. Render loading, empty, failure, and
success states explicitly. Call `abort()` when a user action cancels work;
automatic cleanup remains the last line of defense.

`createExecuteApiHooks()` and `createQueryApiHooks()` derive named hooks from
promise-returning methods on an API object. Use them when a shared service
already defines the request boundary; do not wrap a one-off call only to create
another abstraction.

## Async state contract

Fetcher hooks expose the same observable state machine:

```text
idle → loading → success
              ↘ error
loading → aborted or replaced → latest request owns the result
```

| Value       | Meaning                                                    |
| ----------- | ---------------------------------------------------------- |
| `loading`   | The owning execution is still pending                      |
| `result`    | Last accepted successful result                            |
| `error`     | Last accepted failure                                      |
| `execute()` | Starts work and returns its promise                        |
| `abort()`   | Cancels the owned operation when cancellation is supported |
| `reset()`   | Returns observable state to its initial shape              |

Replacement and unmount cancellation prevent stale updates, but they do not
replace explicit user feedback. Render loading, empty, error, and success as
different product states.

## Select the narrowest hook

| Need                                    | Start with                                       |
| --------------------------------------- | ------------------------------------------------ |
| An arbitrary promise-returning function | `useExecutePromise`                              |
| A complete Fetcher request              | `useFetcher`                                     |
| Query state plus JSON POST execution    | `useFetcherQuery`                                |
| A typed API object's method             | `createExecuteApiHooks` or `createQueryApiHooks` |
| Wow snapshots or events                 | The corresponding `use*Query` hook               |
| A typed storage key                     | `useKeyStorage` or `useImmerKeyStorage`          |
| A typed event subscription              | `useEventSubscription`                           |

Debounced hooks delay execution, not input state. Keep the visible input
controlled independently and present when a request is pending.

## Source and agent reference

- Public exports: [`packages/react/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts)
- Detailed agent API: [`skills/fetcher-react-hooks/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-react-hooks/references/api.md)
- Skill: [`$fetcher-react-hooks`](../skills/react-and-integrations.md#fetcher-react-hooks)

Continue with [React data flow](../learn/react-data-flow.md).
