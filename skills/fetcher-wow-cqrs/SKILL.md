---
name: fetcher-wow-cqrs
description: >
  Build Wow DDD/CQRS clients with `@ahoo-wang/fetcher-wow`: commands and wait stages, snapshot/event queries, aggregate-state loaders, `QueryClientFactory`, resource attribution, and the query DSL. Use for Wow runtime clients or generated CQRS client consumption.
---

# fetcher-wow-cqrs

## Workflow

1. Start from aggregate metadata: service, bounded context, aggregate name, tenant, and owner attribution.
2. Use `CommandClient` for command writes and query clients for read-side access; keep those flows separate.
3. Use `QueryClientFactory` when multiple query clients share the same metadata and attribution path spec.
4. Build query conditions with the DSL instead of ad hoc JSON objects.
5. Load `references/api.md` for constructors, client methods, command stages, query DSL operators, key types, generated clients, and complete flows.

## Key Practices

- Keep command requests explicit about aggregate identity and expected command result behavior.
- Use generated clients when OpenAPI metadata is the source of truth.
- Route generation-time questions to `fetcher-openapi-generator`; keep this skill focused on runtime Wow clients and DSL usage.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs imports, constructors, command APIs, query clients, aggregate load clients, factory setup, query DSL operators, key types, generated clients, and end-to-end examples.

## Related Skills

- $fetcher-openapi-generator: Use to generate Wow CQRS clients from OpenAPI specs.
- $fetcher-viewer-components: Use for table and filter UIs backed by Wow queries.
- $fetcher-react-hooks: Use for React Wow query hooks.
