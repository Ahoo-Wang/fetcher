# `@ahoo-wang/fetcher-react`

React hooks for Fetcher requests, query state, storage, events, Wow queries,
CoSec security, and data monitoring. Use them when a component should own async
state and cancellation.

## Install

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

Install the peer package for each integration you import: event stream, event
bus, storage, Wow, or CoSec.

## Example

```tsx
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

interface User {
  id: string;
  name: string;
}

export function UserProfile({ id }: { id: string }) {
  const { loading, result, error, execute } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });

  return (
    <section>
      <button
        disabled={loading}
        onClick={() => void execute({ url: `/api/users/${id}` })}
      >
        Load user
      </button>
      {error && <p role="alert">Unable to load user</p>}
      {result && <p>{result.name}</p>}
    </section>
  );
}
```

## Hooks by job

- Async core: promise state, execution, query state, debounce, latest refs.
- Fetcher: request execution, JSON queries, manual or debounced refresh.
- API objects: derive execute/query hooks from promise-returning methods.
- State: typed KeyStorage and event-bus subscriptions.
- Wow: single, list, paged, count, and list-stream queries.
- CoSec: security provider, user state, and route guards.
- Monitoring: polling and data-change notifications.

## Documentation

- [React data flow](https://fetcher.ahoo.me/learn/react-data-flow)
- [React reference](https://fetcher.ahoo.me/reference/react)
- [Interactive hook stories](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
