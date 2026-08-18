---
name: fetcher-cosec-auth
description: >
  Configure `@ahoo-wang/fetcher-cosec` authentication for Fetcher: JWT storage and refresh, device and space IDs, resource attribution, and 401/403 interceptors. Use for CoSec, bearer-token lifecycle, tenant/owner attribution, or auth recovery.
---

# fetcher-cosec-auth

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
