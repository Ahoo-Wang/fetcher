---
name: fetcher-openapi-generator
description: >
  Generate type-safe Fetcher clients from OpenAPI 3.x documents with the `fetcher-generator` CLI or `CodeGenerator`, including models, plain API clients, and Wow CQRS clients. Use for generator configuration, output structure, or aggregate discovery rules.
---

# fetcher-openapi-generator

## Workflow

1. Choose CLI generation for project usage and `CodeGenerator` only for embedded tooling.
2. Resolve input, output, config, and tsconfig paths before generating.
3. Enable Wow CQRS generation only when bounded-context and aggregate metadata are present and intended.
4. Inspect generated structure and barrel exports after generation.
5. Load `references/api.md` for CLI flags, config shape, pipeline stages, and Wow CQRS generation rules.

## Key Practices

- Treat generated code as an output boundary; adjust generator config rather than hand-editing generated clients.
- Remember aggregates need root-level tags plus both `.snapshot_state.single` and `.snapshot.count` operations; otherwise only plain API clients are emitted.
- Keep API client tag exclusion and CQRS generation rules aligned so duplicate clients are not emitted.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs CLI commands, CodeGenerator usage, configuration fields, output structure, pipeline stages, and Wow CQRS generation examples.

## Related Skills

- $fetcher-openapi-types: Use for raw OpenAPI TypeScript modeling.
- $fetcher-wow-cqrs: Use for runtime Wow command and query client behavior.
- $fetcher-integration: Use for the generated clients' Fetcher runtime assumptions.
