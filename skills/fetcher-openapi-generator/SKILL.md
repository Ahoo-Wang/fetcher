---
name: fetcher-openapi-generator
description: >
  Use when generating type-safe Fetcher API clients from OpenAPI 3.x specs, including fetcher-generator CLI usage, CodeGenerator API, GeneratorConfiguration, parse and generation pipeline, model generation, client generation, barrel exports, and Wow CQRS generation support.
---

# fetcher-openapi-generator

## Use This Skill When

- The user wants TypeScript client code generated from an OpenAPI spec.
- The task mentions `fetcher-generator`, CLI options, config files, or programmatic generation.
- The task involves generated models, API clients, barrel exports, or post-processing.
- The task needs Wow CQRS command/query clients generated from OpenAPI metadata.

## Workflow

1. Choose CLI generation for project usage and `CodeGenerator` only for embedded tooling.
2. Resolve input, output, config, and tsconfig paths before generating.
3. Enable Wow CQRS generation only when bounded-context and aggregate metadata are present and intended.
4. Inspect generated structure and barrel exports after generation.
5. Load `references/api.md` for CLI flags, config shape, pipeline stages, and Wow CQRS generation rules.

## Key Practices

- Treat generated code as an output boundary; adjust generator config rather than hand-editing generated clients.
- Use explicit type mappings when OpenAPI schemas need domain-specific TypeScript types.
- Keep API client tag exclusion and CQRS generation rules aligned so duplicate clients are not emitted.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs CLI commands, CodeGenerator usage, configuration fields, output structure, pipeline stages, and Wow CQRS generation examples.

## Related Skills

- $fetcher-openapi-types: Use for raw OpenAPI TypeScript modeling.
- $fetcher-wow-cqrs: Use for runtime Wow command and query client behavior.
- $fetcher-integration: Use for the generated clients' Fetcher runtime assumptions.
