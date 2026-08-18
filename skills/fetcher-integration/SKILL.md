---
name: fetcher-integration
description: >
  Set up the core `@ahoo-wang/fetcher` HTTP client with `Fetcher` or `NamedFetcher`, interceptors, URL parameters, timeouts, result extractors, cancellation, status validation, and the named registry. Use for direct Fetcher calls or request-lifecycle behavior.
---

# fetcher-integration

## Workflow

1. Start with `@ahoo-wang/fetcher` before reaching for higher-level packages.
2. Prefer `NamedFetcher` when the client will be reused by decorators, generated clients, or app services.
3. Mutate `FetchExchange` inside interceptors; do not return a replacement exchange from `intercept()`.
4. Use `ResultExtractors` when callers need typed values instead of raw `Response` objects.
5. Load `references/api.md` for exact method signatures, lifecycle order, or full examples.

## Key Practices

- Keep interceptors small and phase-specific: request shaping, response validation, and error recovery are separate responsibilities.
- Use `urlParams.path` for template variables and `urlParams.query` for query strings.
- Use `validateStatus` or `IGNORE_VALIDATE_STATUS` intentionally when non-2xx responses are part of the domain flow.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs method signatures, interceptor ordering, URL parameter examples, error hierarchy, and complete service setup examples.

## Related Skills

- $fetcher-decorator-service: Use when services should be declared with TypeScript decorators.
- $fetcher-openapi-generator: Use when clients should be generated from an OpenAPI document.
- $fetcher-cosec-auth: Use when interceptors need CoSec authentication behavior.
