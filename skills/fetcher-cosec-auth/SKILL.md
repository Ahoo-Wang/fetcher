---
name: fetcher-cosec-auth
description: >
  Add CoSec authentication to a Fetcher client with `@ahoo-wang/fetcher-cosec`: `CoSecConfigurer`, JWT `TokenStorage`, token refresh and 401 retry by CoSec 8.0 problem type, 403 and scope-rejected handling, device/space IDs, `{tenantId}`/`{ownerId}` attribution and cross-tab sign-in state. Use for login tokens, bearer headers, refresh loops, sign-out on refresh failure or auth redirects. For generic interceptors use fetcher-integration; for React `SecurityProvider`/`RouteGuard`, fetcher-react-hooks.
---

# fetcher-cosec-auth

## Decisions

- **`CoSecConfigurer` first**: `new CoSecConfigurer(config).applyTo(fetcher)` registers every interceptor in the right order; register the interceptors by hand only to customize one of them.
- **No `tokenRefresher`, no auth**: the Authorization request/response interceptors are registered only when `config.tokenRefresher` is set. Without it only the `CoSec-*` headers and resource attribution apply — no Bearer token is sent even if one is stored.
- **Trust only your origins**: by default every request, including an absolute URL on another origin (a pagination link, a download URL), receives the access token and the `CoSec-*` headers with the device ID. Pass `isTrusted: sameOriginTrust` to keep them to the `baseURL` origin and the page origin, or your own `RequestTrust`; relative URLs are always trusted, and an untrusted request is neither authorized nor refreshed.
- **CoSec 8.0 only**: this version speaks CoSec 8.0 (6.x speaks CoSec 7.x). A refusal is `application/problem+json`; the client reads its type (`CoSecProblemType`, `getCoSecProblem`, `readCoSecProblem`). `appId` is deprecated and does nothing: no `CoSec-App-Id` is sent, the app is the token's `aud`.
- **401 vs 403**: `AuthorizationResponseInterceptor` refreshes and retries a 401 once (`AUTHORIZATION_RESPONSE_MAX_RETRY`) only for `token-expired` (or a 401 with no CoSec problem); `unauthorized` is not refreshed, `token-revoked` and `token-invalid` are not refreshed and remove the stored pair. `onUnauthorized(exchange, problem?)` fires when that fails, or when the refresh endpoint answers 401 (not when it is merely unreachable or rate limited). `onForbidden(exchange, problem?)` fires on 403 and never refreshes; a `scope-rejected` 403 goes to `onScopeRejected(exchange, problem)` when set, and the client never drops the stored space or falls back to the default space itself. A `429`, `503`, `500` or `400` never touches the session. Neither callback clears the error — the call still rejects with `ExchangeError`, so redirects/UI go in the callbacks and callers still handle the rejection. A callback that throws makes the call reject with an `ExchangeError` whose `cause` is the thrown value.
- **React**: this skill wires the Fetcher. `SecurityProvider`, `useSecurity`, `RouteGuard` and `RefreshableRouteGuard` live in `@ahoo-wang/fetcher-react` ($fetcher-react-hooks); hand them the **same** `TokenStorage` instance (and `configurer.tokenManager`) you pass to `CoSecConfigurer`.

## Gotchas a capable model gets wrong

- Tokens enter through `tokenStorage.signIn({ accessToken, refreshToken })` after login; `signIn()` starts a new session and in-flight requests from the old one reject with `RefreshSessionChangedError`.
- A caller-set `Authorization` header (any value, case-insensitive) skips token injection and 401 refresh for that request. `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` in `attributes` is checked by presence, so even `false` disables refresh.
- A custom `TokenRefresher` that calls through a CoSec-configured fetcher must pass `attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]])` to avoid a refresh loop; `CoSecTokenRefresher` already does.
- Ordering: CoSec headers and Authorization run near `Number.MIN_SAFE_INTEGER` (`AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`), so your own interceptor that reads the Bearer header needs a larger `order`.
- Attribution fills `{tenantId}` / `{ownerId}` URL placeholders from the JWT (`tenantId`, `sub`) only when the caller did not supply them — write placeholders, don't interpolate the values.
- When a refresh fails because another tab already spent the one-time refresh token, the manager re-reads storage (`KeyStorage.reload()`) and continues with that tab's token for the same session instead of signing out.
- A failed refresh signs the user out (token removed, `RefreshTokenError`, `onUnauthorized`) only when the refresh endpoint answers **401** (`error.exchange.response.status`), or with a response that is not a composite token; `isRefreshRejected` changes the rule. A `429` (never repeated before its `Retry-After`), another 4xx, a network error, timeout, abort or 5xx keeps the session and rejects with `RefreshUnavailableError` without calling `onUnauthorized`; a later request refreshes again. The caller sees an `ExchangeError` whose `cause` is that error — test `error.cause instanceof RefreshUnavailableError` to show "try again", not a login page. A custom `TokenRefresher` must reject with an error carrying `exchange.response.status` 401 for a rejection to sign out; a bare `Error` keeps the session.
- The refresh route must let an anonymous caller in: the client sends the expired access token, which CoSec 8.0 reads as anonymous; otherwise the refresh is itself `401 token-expired` and the user is signed out at the first expiry. The refresh call and a request with no token carry no `CoSec-Space-Id` (an anonymous request that declares a space is `401`).
- A refresh whose outcome is unknown (timeout, lost response, 5xx) is retried with the same pair only inside `rotationLeeway` of the first attempt (at most the server's `cosec.jwt.session.rotation-leeway`, 30 s); after that one attempt per call is a gamble that revokes the session if the server recorded the first. Tabs must share one storage and one lock: `localStorage`, or a storage declared with `new TokenStorage({ sharedAcrossTabs: true })`; with `sessionStorage` or per-tab memory refresh in one place only.
- In a browser, tabs sharing a `TokenStorage` on `localStorage` refresh one at a time under a Web Lock (`cosec-refresh:<key>`), so a hanging refresh blocks the other tabs: give the refresh client's Fetcher a `timeout`.
- A JWT whose payload is not a JSON object makes `parseJwtPayload` return `null`, so the token reads as expired.
- Default storage keys are `cosec-token`, `cosec-device-id` and `cosec-space-id`, synced across tabs; `destroy()` closes the broadcast bus a storage created (not one passed in `eventBus`); `TokenStorage`s sharing one `eventBus` must use the same `earlyPeriod` or the constructor throws.

## Minimal example

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
  sameOriginTrust,
} from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000, // also bounds the refresh POST
});
const tokenStorage = new TokenStorage({ earlyPeriod: 60 }); // seconds
new CoSecConfigurer({
  isTrusted: sameOriginTrust,
  tokenStorage,
  tokenRefresher: new CoSecTokenRefresher({
    fetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => console.warn('forbidden'),
  onScopeRejected: async (_exchange, problem) =>
    console.warn('scope rejected', problem.requestId),
}).applyTo(fetcher);
// after login:
tokenStorage.signIn({ accessToken, refreshToken });
```

## References

- `references/api.md`: `CoSecConfig` options (including `isTrusted`), JWT token classes, `TokenStorage`/`DeviceIdStorage`, `JwtTokenManager`, `TokenRefresher`, headers, interceptor order table, space providers and complete examples. Load it for anything beyond the setup above.

## Related Skills

- $fetcher-integration: interceptor mechanics and error classes.
- $fetcher-storage: `KeyStorage`, which the token and device storages build on.
- $fetcher-react-hooks: `SecurityProvider`, `useSecurity` and `RouteGuard` in React.
