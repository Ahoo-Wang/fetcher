---
title: Drive a query from input
description: Send a query as POST JSON and render the current component-owned result.
---

# Drive a query from input

## Prerequisites

Use the React installation and mounting instructions in [the runnable example](../../examples/react.md). This guide adds a different application endpoint: `POST /api/users/search` accepts `{ "name": "Ada" }` and returns a JSON array such as `[{ "id": "u-ada", "name": "Ada" }]`. Empty name returns all users. Implement it or adapt the URL/body to your service; the existing GET-only Storybook fixture does not provide it.

## Add the query component

Save the following as `src/UserSearch.tsx` and mount `<UserSearch />` using the same React entry pattern:

```tsx
import { Fetcher } from '@ahoo-wang/fetcher';
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function UserSearch() {
  const search = useFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    initialQuery: { name: '' },
    autoExecute: true,
  });
  return (
    <section>
      <label>
        Name
        <input
          onChange={event => search.setQuery({ name: event.target.value })}
        />
      </label>
      <button onClick={search.abort}>Cancel</button>
      <output aria-live="polite">
        {search.loading
          ? 'Loading'
          : search.error
            ? String(search.error)
            : search.result?.map(user => user.name).join(', ')}
      </output>
    </section>
  );
}
```

`useFetcherQuery` sends the query object as a POST body and defaults to JSON extraction. It is not a GET hook that appends the query to the URL. Use `useQuery` with your own executor when a different transport or service method is required; pass its third `AbortController` argument to the real operation.

## Verify query changes

On mount the empty-name query loads all users. Enter Ada and inspect the network request: method POST, URL `/api/users/search`, body `{ "name": "Ada" }`. The output should contain Ada. Delay the first response and change the name; only the latest execution may publish its result.

`initialQuery` supplies the initial value. Use `setQuery` for this uncontrolled input pattern; a controlled `query` prop lets the parent own query updates. `autoExecute` defaults to true, shown explicitly here. Set it false for an Apply button, call `setQuery(next)`, then `execute()` to run the current query. If neither `query` nor `initialQuery` is defined at initialization, no query executes. Changing a previously defined `query` prop to `undefined` retains the stored query and can trigger that old query again; it does not pause execution. Set `autoExecute: false` to pause automatic execution, and call `abort()` separately to cancel work already running. The query check only excludes `undefined`; validate business fields before sending.

## Failure and lifetime

Return HTTP 500 from the application endpoint and confirm the output renders the hook error. Invalid response JSON also becomes an execution error. Cancelling or unmounting invalidates the current execution; only operations connected to the controller can stop their actual work. Results are component-local, without global cache invalidation or cross-component request deduplication.

Continue with [debouncing](./debounce.md), [query reference](../../reference/react/promise-and-query-state.md), and [resource ownership](../../architecture/state-and-resources.md).
