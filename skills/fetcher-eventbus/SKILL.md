---
name: fetcher-eventbus
description: >
  Use when implementing typed event buses, serial or parallel event execution, BroadcastChannel or storage-based cross-tab messaging, handler priority, once handlers, name generation, or event synchronization across browser contexts.
---

# fetcher-eventbus

## Use This Skill When

- The task mentions event bus, event handlers, broadcasts, or cross-tab communication.
- The task needs serial versus parallel event execution semantics.
- The task involves `BroadcastChannel`, storage fallback messaging, or cross-tab sync.
- The task needs handler ordering, duplicate-name prevention, or once-only handlers.

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
