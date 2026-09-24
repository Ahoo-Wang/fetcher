---
name: fetcher-cosec-auth
description: >
  Add CoSec authentication to a Fetcher client with `@ahoo-wang/fetcher-cosec`: `CoSecConfigurer`, JWT `TokenStorage`, token refresh and 401 retry, 403 handling, device/space IDs, `{tenantId}`/`{ownerId}` attribution and cross-tab sign-in state. Use for login tokens, bearer headers, refresh loops or auth redirects in this ecosystem. For generic interceptors use fetcher-integration.
---

# fetcher-cosec-auth

## Decisions

- **`CoSecConfigurer` first**: `new CoSecConfigurer(config).applyTo(fetcher)` registers every interceptor in the right order; register the interceptors by hand only to customize one of them.
- **No `tokenRefresher`, no auth**: the Authorization request/response interceptors are registered only when `config.tokenRefresher` is set. Without it only the `CoSec-*` headers and resource attribution apply — no Bearer token is sent even if one is stored.
- **401 vs 403**: `AuthorizationResponseInterceptor` refreshes and retries a 401 once (`AUTHORIZATION_RESPONSE_MAX_RETRY`); `onUnauthorized` fires when that fails. `onForbidden` fires on 403 and never refreshes. Neither callback clears the error — the call still rejects with `ExchangeError`, so redirects/UI go in the callbacks and callers still handle the rejection.

## Gotchas a capable model gets wrong

- Tokens enter through `tokenStorage.signIn({ accessToken, refreshToken })` after login; `signIn()` starts a new session and in-flight requests from the old one reject with `RefreshSessionChangedError`.
- A caller-set `Authorization` header (any value, case-insensitive) skips token injection and 401 refresh for that request. `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` in `attributes` is checked by presence, so even `false` disables refresh.
- A custom `TokenRefresher` that calls through a CoSec-configured fetcher must pass `attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]])` to avoid a refresh loop; `CoSecTokenRefresher` already does.
- Ordering: CoSec headers and Authorization run near `Number.MIN_SAFE_INTEGER` (`AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`), so your own interceptor that reads the Bearer header needs a larger `order`.
- Attribution fills `{tenantId}` / `{ownerId}` URL placeholders from the JWT (`tenantId`, `sub`) only when the caller did not supply them — write placeholders, don't interpolate the values.
- Default storage keys are `cosec-token`, `cosec-device-id` and `cosec-space-id`, synced across tabs; `TokenStorage`s sharing one `eventBus` must use the same `earlyPeriod` or the constructor throws.

## Minimal example

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const tokenStorage = new TokenStorage({ earlyPeriod: 60 }); // seconds
new CoSecConfigurer({
  appId: 'my-app',
  tokenStorage,
  tokenRefresher: new CoSecTokenRefresher({
    fetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => console.warn('forbidden'),
}).applyTo(fetcher);
// after login:
tokenStorage.signIn({ accessToken, refreshToken });
```

## References

- `references/api.md`: `CoSecConfig` options, JWT token classes, `TokenStorage`/`DeviceIdStorage`, `JwtTokenManager`, `TokenRefresher`, headers, interceptor order table, space providers and complete examples. Load it for anything beyond the setup above.

## Related Skills

- $fetcher-integration: interceptor mechanics and error classes.
- $fetcher-storage: `KeyStorage`, which the token and device storages build on.
- $fetcher-react-hooks: `SecurityProvider`, `useSecurity` and `RouteGuard` in React.
