---
name: fetcher-cosec-auth
description: >
  Use when implementing CoSec authentication with Fetcher, including CoSecConfigurer, JWT token lifecycle, token storage, refresh handling, device ID storage, multi-tenant space resolution, resource attribution, authorization headers, and 401 or 403 error handling.
---

# fetcher-cosec-auth

## Use This Skill When

- The task mentions CoSec, JWT, bearer auth, token refresh, or authorization headers.
- The task needs device ID tracking, tenant or space resolution, resource attribution, or policy-aware requests.
- The task involves 401 retry, unauthorized redirects, or forbidden error handling.
- The task needs CoSec interceptors attached to a Fetcher instance.

## Workflow

1. Prefer `CoSecConfigurer` for app-level setup and use manual interceptors only for focused customization.
2. Decide token storage, device storage, token refresher, and space provider before attaching interceptors.
3. Register auth request/response interceptors only when refresh behavior is available.
4. Keep 401 retry and 403 handling separate so auth recovery does not hide authorization failures.
5. Load `references/api.md` for JWT classes, storage options, refresher contracts, headers, interceptors, and complete setup examples.

## Key Practices

- Treat tenant and owner attribution as request metadata, not hard-coded URL fragments.
- Use cross-tab token storage behavior intentionally for multi-window apps.
- Keep redirect/UI side effects in callbacks rather than inside low-level token classes.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs CoSecConfigurer options, JWT token classes, TokenStorage, DeviceIdStorage, JwtTokenManager, TokenRefresher, CoSec headers, interceptors, space providers, and complete examples.

## Related Skills

- $fetcher-integration: Use for core Fetcher interceptor mechanics.
- $fetcher-storage: Use for storage primitives behind token and device persistence.
- $fetcher-react-hooks: Use for React security context and route guards.
