---
name: fetcher-react-hooks
description: >
  Use when building React data-fetching and state hooks with fetcher-react, including usePromiseState, useExecutePromise, useFetcher, useQuery, useFetcherQuery, storage hooks, event subscriptions, utility hooks, Wow query hooks, data monitor hooks, and AbortController behavior.
---

# fetcher-react-hooks

## Use This Skill When

- The task involves React hooks for Fetcher requests, generic queries, or promise state.
- The task mentions `useFetcher`, `useQuery`, `usePromise`, `useExecutePromise`, or `PromiseStatus`.
- The task needs AbortController, unmount safety, race prevention, or auto-execute behavior.
- The task needs storage hooks, event subscriptions, Wow query hooks, or data monitor hooks.

## Workflow

1. Choose the lowest hook layer that matches the task: promise state, generic execution, Fetcher HTTP, or query helpers.
2. Pass `PromiseSupplier` functions to `execute`; do not pass raw promises.
3. Use `setQuery` to update query state and `execute()` to rerun current Fetcher queries.
4. Keep abort, unmount safety, and stale-result behavior explicit in examples and tests.
5. Load `references/api.md` for hook signatures, state machine details, Wow hooks, storage hooks, event hooks, and generated hook helpers.

## Key Practices

- Separate query state from rendering state in reusable components.
- Use Fetcher-based query variants when the backend endpoint accepts POST query objects.
- Route UI table/filter work to `fetcher-viewer-components` when the task is about data presentation rather than fetching state.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs hook architecture, PromiseStatus transitions, hook signatures, Wow query hooks, utility hooks, storage hooks, event hooks, data monitor hooks, and API hook generation.

## Related Skills

- $fetcher-integration: Use for core Fetcher request configuration.
- $fetcher-storage: Use for the underlying storage abstraction.
- $fetcher-eventbus: Use for event bus behavior behind event subscriptions and data monitors.
- $fetcher-decorator-service: Use for decorator APIs behind generated hook helpers.
- $fetcher-viewer-components: Use for Ant Design table and filter UI.
