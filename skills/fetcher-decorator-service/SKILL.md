---
name: fetcher-decorator-service
description: >
  Build declarative TypeScript API services with `@ahoo-wang/fetcher-decorator`: `@api`, HTTP and parameter decorators, result extractors, lifecycle hooks, inheritance, and generated method stubs. Use when a task needs decorator-based services instead of hand-written Fetcher calls.
---

# fetcher-decorator-service

## Workflow

1. `reflect-metadata` ships with the package and is imported automatically; an explicit entry-point import is only needed for other decorator libraries.
2. Define a service class with `@api()` and method decorators; leave method bodies as generated-error stubs.
3. Bind path, query, header, body, request, and attribute values with parameter decorators.
4. Choose the result extractor or endpoint return type that matches the caller contract.
5. Load `references/api.md` for decorator signatures, lifecycle hooks, inheritance, and CRUD examples.

## Key Practices

- Prefer decorator services when endpoint shape is stable and discoverability matters.
- Use core Fetcher directly for highly dynamic request construction.
- Keep `reflect-metadata` setup out of individual service modules unless the app has no shared entry point.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs decorator signatures, parameter mapping, lifecycle hooks, inheritance rules, error stubs, and complete CRUD service examples.

## Related Skills

- $fetcher-integration: Use for the underlying Fetcher and NamedFetcher setup.
- $fetcher-openapi-generator: Use when service code should come from an OpenAPI spec.
- $fetcher-llm-streaming: Use when a decorator endpoint returns SSE or streaming data.
