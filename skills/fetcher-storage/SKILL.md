---
name: fetcher-storage
description: >
  Use when adding typed cross-environment storage with localStorage, sessionStorage, or in-memory fallback, including KeyStorage, serializers, default values, change listeners, cleanup, and cross-tab synchronization.
---

# fetcher-storage

## Use This Skill When

- The task needs typed persistent key-value storage.
- The task mentions localStorage, sessionStorage, in-memory storage, serializers, or default values.
- The task needs storage change listeners or cross-tab synchronization.
- The code must run across browser and non-browser environments.

## Workflow

1. Choose the storage backend first: browser storage when available, in-memory fallback for non-browser contexts or tests.
2. Use `KeyStorage` for one logical value per key and pair it with an explicit serializer.
3. Use `jsonSerializer` for objects and typed identity serializers only when values already have the target representation.
4. Register listeners with the EventHandler object pattern and dispose them during cleanup.
5. Load `references/api.md` for exact options, serializer patterns, and cross-tab behavior.

## Key Practices

- Keep keys stable and namespaced by app or domain.
- Provide `defaultValue` when consumers should not handle missing storage explicitly.
- Use in-memory storage for deterministic tests instead of relying on ambient browser state.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs KeyStorage options, listener APIs, serializers, in-memory storage, cross-tab sync, installation, and quick-start examples.

## Related Skills

- $fetcher-eventbus: Use for lower-level event bus behavior behind storage listeners.
- $fetcher-react-hooks: Use when React state should bind to KeyStorage.
- $fetcher-cosec-auth: Use for JWT and device-id storage patterns.
