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
import { useState } from 'react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function DebouncedUserSearch() {
  const [query, setQuery] = useState({ name: '' });
  const search = useDebouncedFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    query,
    debounce: { delay: 300 },
  });
  return (
    <section>
      <label>
        Name
        <input
          value={query.name}
          onChange={event => setQuery({ name: event.target.value })}
          onKeyDown={event => {
            if (event.key === 'Enter') search.flush();
          }}
        />
      </label>
      <button onClick={search.abort}>Stop</button>
      <output aria-live="polite">
        {search.pending
          ? 'Waiting'
          : search.loading
            ? 'Loading'
            : search.error
              ? String(search.error)
              : search.result?.map(user => user.name).join(', ')}
      </output>
    </section>
  );
}
```

The hook debounces the query value, not calls: the first query is sent at once, and a later change is applied once the query has stopped changing for 300 ms. `pending` is true while a change waits; `flush()` applies it now (Enter above); `execute()` re-sends the applied query. `leading` defaults to false and `trailing` to true. The delay is explicit; choose it based on interaction requirements.

## Verify fewer requests and the final value

Clear the network log, type Ada quickly, and wait longer than 300 ms plus the response time. The final request body should contain `name: 'Ada'`, and the result should show Ada. The initial empty query runs on mount; distinguish it from the typing burst. With this trailing configuration, intermediate keystrokes in one burst do not each issue a request.

Type Ada and press Enter before 300 ms: the request starts at once. Click Stop during a delayed HTTP request and verify no late result appears. `abort()` cancels the active execution; it does not drop a waiting change, which still applies after the delay. To discard a waiting change, set the query back to the applied value. `pending` is a render value describing the debounce, not a loading state for network work.

## Failures and cleanup

The same HTTP/JSON errors as immediate queries populate hook state. A newly applied query cancels its predecessor when that new execution starts; do not assume the first keystroke instantly aborts an already-running request. Unmount cancels pending scheduling and the owned execution. A timer delay is not a request timeout or a server-side rate limit.

See [debounce contracts](../../reference/react/debounce.md), [cleanup](./cleanup.md), and [state ownership](../../architecture/state-and-resources.md).
