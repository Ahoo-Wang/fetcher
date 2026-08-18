---
name: fetcher-storage
description: >
  Add typed cross-environment storage with `@ahoo-wang/fetcher-storage`: `KeyStorage`, serializers, defaults, listeners, localStorage with in-memory fallback, custom sessionStorage, and optional cross-tab event buses. Use for persistent values or storage-backed React/CoSec flows.
---

# fetcher-storage

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
