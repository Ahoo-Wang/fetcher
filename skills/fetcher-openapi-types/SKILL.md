---
name: fetcher-openapi-types
description: >
  Use when modeling OpenAPI 3.x documents in TypeScript, including schemas, operations, parameters, responses, security schemes, components, references, extensions, media types, request bodies, and reusable utility types.
---

# fetcher-openapi-types

## Use This Skill When

- The task is about OpenAPI type definitions, not code generation execution.
- The task mentions OpenAPI schemas, operations, parameters, responses, components, references, or extensions.
- The task needs to model security schemes, media types, request bodies, or reusable document fragments.
- The task needs accurate TypeScript shapes for generator or validation work.

## Workflow

1. Identify the OpenAPI object category first: document, path, operation, schema, parameter, response, security, component, or extension.
2. Use reference-aware types when values may be inline objects or `$ref` references.
3. Keep extension fields behind explicit extension types instead of broad untyped records when possible.
4. Use generator-focused types only when the task needs code generation metadata.
5. Load `references/api.md` for the full exported type map and quick reference.

## Key Practices

- Do not use this skill to generate clients; hand off to `fetcher-openapi-generator` for generation workflows.
- Prefer precise OpenAPI vocabulary over informal API terms when naming types.
- Keep schema composition and polymorphism explicit so generator behavior remains predictable.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs complete exported type lists, schema variants, operation fields, parameter and response types, security types, components, references, and extension utilities.

## Related Skills

- $fetcher-openapi-generator: Use when the task must generate Fetcher client code.
- $fetcher-wow-cqrs: Use when OpenAPI metadata maps to Wow CQRS clients.
- $fetcher-integration: Use for runtime HTTP client behavior.
