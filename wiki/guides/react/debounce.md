---
title: Debounce input-driven requests
description: Delay changing input and distinguish queued execution from an active request.
---

# Debounce input-driven requests

## Prerequisites

Complete [the query guide](./queries.md), including its `POST /api/users/search` server contract and React consumer setup. Debounce delays execution while input changes; it does not cache previous search results. Use it when each keystroke need not produce a request.

## Replace immediate query execution

Save this standalone alternative as `src/DebouncedUserSearch.tsx` and mount `<DebouncedUserSearch />` instead of `UserSearch`:

```tsx
import { Fetcher } from '@ahoo-wang/fetcher';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function DebouncedUserSearch() {
  const search = useDebouncedFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    initialQuery: { name: '' },
    autoExecute: true,
    debounce: { delay: 300 },
  });
  return (
    <section>
      <label>
        Name
        <input
          onChange={event => search.setQuery({ name: event.target.value })}
        />
      </label>
      <button
        onClick={() => {
          search.cancel();
          search.abort();
        }}
      >
        Stop
      </button>
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

The trailing execution runs after 300 ms without another input change. `leading` defaults to false and `trailing` to true. The delay is explicit; choose it based on interaction requirements. This hook exposes `run()` for scheduling the current query, not `execute()`. Its return is scheduling control, not a promise for response data.

## Verify fewer requests and the final value

Clear the network log, type Ada quickly, and wait longer than 300 ms plus the response time. The final request body should contain `name: 'Ada'`, and the result should show Ada. An initial empty query may already have run after mounting; distinguish it from the typing burst. With this trailing configuration, intermediate keystrokes in one burst do not each issue a request.

Click Stop before the timer fires and verify no queued request starts. Click Stop during a delayed HTTP request and verify no late result appears. `cancel()` cancels scheduled debounce work; `abort()` cancels active execution. Use both for a Stop action. `isPending()` is a snapshot of the pending timer, not a reactive loading state for network work.

## Failures and cleanup

The same HTTP/JSON errors as immediate queries populate hook state. A later debounced execution cancels its predecessor when that new execution starts; do not assume the first keystroke instantly aborts an already-running request. Unmount cancels pending scheduling and the owned execution. A timer delay is not a request timeout or a server-side rate limit.

See [debounce contracts](../../reference/react/debounce.md), [cleanup](./cleanup.md), and [state ownership](../../architecture/state-and-resources.md).
