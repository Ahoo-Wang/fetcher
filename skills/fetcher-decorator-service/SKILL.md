---
name: fetcher-decorator-service
description: >
  Use when creating declarative TypeScript API service classes with fetcher-decorator, including @api, HTTP method decorators, path/query/header/body/request parameters, result extractors, lifecycle hooks, inheritance, and reflect-metadata setup.
---

# fetcher-decorator-service

## Use This Skill When

- The user wants API service classes rather than hand-written Fetcher calls.
- The task mentions `@api`, `@get`, `@post`, `@body`, `@query`, or endpoint decorators.
- The task needs typed method return extraction or `EndpointReturnType` behavior.
- The task involves decorator lifecycle hooks, inheritance, or fetcher resolution.

## Workflow

1. Ensure `reflect-metadata` is imported once at the application entry point.
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
