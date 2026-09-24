# `@ahoo-wang/fetcher-react`

React hooks for Fetcher requests, query state, storage, events, and CoSec
security. Use them when a component should own async state and cancellation.

## Install

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

Install the peer package for each integration you import: event stream, event
bus, storage, or CoSec.

> **Wow query hooks have moved.** `useSingleQuery`, `useListQuery`,
> `usePagedQuery`, `useCountQuery`, `useListStreamQuery` and the other Wow
> hooks now live in `@ahoo-wang/wow-react`, published from the
> [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) and
> versioned with Wow. The data-monitor hooks (`useDataMonitor`,
> `DataMonitorService`) were retired with `@ahoo-wang/fetcher-viewer`. Both
> remain available in `@ahoo-wang/fetcher-react` 5.x.

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
- CoSec: security provider, user state, and route guards.

## Documentation

- [React data flow](https://fetcher.ahoo.me/guides/react/)
- [React reference](https://fetcher.ahoo.me/reference/react)
- [Interactive hook stories](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)

### Lightweight core entry

Generic hooks are also available through the ESM subpath `@ahoo-wang/fetcher-react/core`, including `useExecutePromise`, `useQuery`, and `useDebouncedCallback`. This entry avoids loading HTTP, security, storage and event integrations just to use core hooks. Existing root ESM/UMD exports remain unchanged.

The fetcher hooks (`useFetcher`, `useFetcherQuery` and their debounced forms) are also available through `@ahoo-wang/fetcher-react/fetcher`. Its types and modules load no security, storage or event integration, which is what integrations built on these hooks — such as `@ahoo-wang/wow-react` — import.

`useExecutePromise.abort()` invalidates the active request before cancellation callbacks run. A source that ignores AbortSignal cannot publish late success/error, and asynchronous onAbort callbacks cannot reorder newer executions.

The root ESM entry and `/core` share the same core modules, including FullscreenContext; providers and hooks can be mixed across the two ESM entries. `pnpm test:package` verifies this on built artifacts and is included in `build`. `abort()` detaches the previous controller before notifying synchronous listeners, preserving cancellation of a replacement request started by a listener.
