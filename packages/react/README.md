# `@ahoo-wang/fetcher-react`

React hooks for Fetcher requests, query state, storage, events, and CoSec
security. Use them when a component should own async state and cancellation.

## Install

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

Install the peer package for each integration you import: event bus, storage,
or CoSec.

> **Wow query hooks have moved.** `useSingleQuery`, `useListQuery`,
> `usePagedQuery`, `useCountQuery`, `useListStreamQuery` and the other Wow
> hooks moved to `@ahoo-wang/wow-react` in the
> [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript),
> versioned with Wow. The data-monitor hooks (`useDataMonitor`,
> `DataMonitorService`) were retired with `@ahoo-wang/fetcher-viewer`.
> `@ahoo-wang/wow-react` is on npm from Wow 9.2.0; from Wow 9.2.1 it accepts
> fetcher 6. To upgrade, switch to `@ahoo-wang/wow-react` (9.2.1 or later)
> first, then upgrade fetcher; see [wow.ahoo.me](https://wow.ahoo.me). The 5.x
> line (`5.x` branch, 5.1.x on npm) keeps the Wow hooks and the data-monitor
> hooks in `@ahoo-wang/fetcher-react` for existing consumers.

## Example

A query lives in your own state; the hook runs it whenever its content
changes and cancels the request it replaces.

```tsx
import { useState } from 'react';
import { useQuery } from '@ahoo-wang/fetcher-react';

export function UserSearch() {
  const [query, setQuery] = useState({ keyword: '' });
  const { loading, result, error } = useQuery({
    query,
    execute: (query, abortController) =>
      api.searchUsers(query, abortController),
  });

  return (
    <section>
      <input
        value={query.keyword}
        onChange={e => setQuery({ keyword: e.target.value })}
      />
      {loading && <p>Searching…</p>}
      {error && <p role="alert">Search failed</p>}
      {result?.map(user => (
        <p key={user.id}>{user.name}</p>
      ))}
    </section>
  );
}
```

`execute` never rejects: it resolves to the state the request ended in, and
to `idle` when a newer request, `abort()`, `reset()` or unmounting cancelled it.

```tsx
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

export function SaveButton({ user }: { user: User }) {
  const { loading, execute } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });

  const save = async () => {
    const { status, error } = await execute({
      url: `/api/users/${user.id}`,
      method: 'PUT',
      body: user,
    });
    if (status === 'success') toast('Saved');
    else if (status === 'error') toast(error.message);
  };

  return (
    <button disabled={loading} onClick={() => void save()}>
      Save
    </button>
  );
}
```

## Hooks by job

- Async core: promise state, cancellable execution, controlled queries,
  debounced values and callbacks, latest refs.
- Fetcher: request execution, JSON queries, debounced requests and queries.
- API objects: derive execute/query hooks from promise-returning methods.
- State: typed KeyStorage and event-bus subscriptions.
- CoSec: security provider, user state, and route guards.

## Documentation

- [React data flow](https://fetcher.ahoo.me/guides/react/)
- [React reference](https://fetcher.ahoo.me/reference/react)
- [Interactive hook stories](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)

### Subpath entries

The core hooks (`useExecutePromise`, `useQuery`, `useDebouncedQuery`, …) are
also available from the ESM subpath `@ahoo-wang/fetcher-react/core`, and the
fetcher hooks (`useFetcher`, `useFetcherQuery` and their debounced forms) from
`@ahoo-wang/fetcher-react/fetcher`. Neither loads the security, storage or
event-bus integration. The root entry shares their modules, so hooks from
different entries can be mixed; `pnpm test:package` verifies this on the built
artifacts and runs as part of `build`.
