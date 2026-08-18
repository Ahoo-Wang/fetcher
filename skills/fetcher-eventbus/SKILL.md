---
name: fetcher-eventbus
description: >
  Build with `@ahoo-wang/fetcher-eventbus`: serial, parallel, and broadcast typed buses; handler ordering and once semantics; and BroadcastChannel/storage messengers. Use for this package's event buses or browser-tab event synchronization.
---

# fetcher-eventbus

## Workflow

1. Choose `SerialTypedEventBus` when ordering and sequential side effects matter.
2. Choose `ParallelTypedEventBus` when handlers are independent and latency matters.
3. Choose `BroadcastTypedEventBus` or a cross-tab messenger for browser-tab synchronization.
4. Give handlers stable names and explicit order values when behavior must be predictable.
5. Load `references/api.md` for interface details, messenger fallback behavior, and examples.

## Key Practices

- Use one event type per focused bus unless a multi-type router materially reduces duplication.
- Treat handler names as identifiers, not labels; duplicate names are rejected.
- Call cleanup functions or `destroy()` for long-lived UI and test code.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs TypedEventBus contracts, event handler fields, serial/parallel/broadcast examples, messenger APIs, and fallback chains.

## Related Skills

- $fetcher-storage: Use when eventing is tied to persistent key-value state.
- $fetcher-react-hooks: Use when React components subscribe to event buses.
- $fetcher-cosec-auth: Use when auth token or device storage changes must broadcast.
