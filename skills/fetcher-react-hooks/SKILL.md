---
name: fetcher-react-hooks
description: >
  Build React request and state flows with `@ahoo-wang/fetcher-react`: promise state, `useFetcher`, generic and Wow queries, storage/event hooks, CoSec context, debouncing, AbortController, and unmount/race safety. Use when a task mentions these hooks or Fetcher-backed React state.
---

# fetcher-react-hooks

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
