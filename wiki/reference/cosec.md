---
title: CoSec reference
description: Configure CoSec request attribution, JWT storage and refresh, retry limits, cleanup, and security boundaries.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-cosec`

CoSec composes request attribution and optional JWT refresh into a Fetcher
interceptor chain. It is a client-side convenience layer: decoding a JWT is not
signature verification, and the server remains the authorization authority.

## Install and choose the setup

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

| Need | Entry | Result |
| --- | --- | --- |
| App/device/request attribution only | `new CoSecConfigurer({ appId })` | CoSec, resource-attribution request interceptors |
| Bearer injection and automatic refresh | Add `tokenRefresher` | Adds authorization request and 401-response interceptors |
| Application-level 401 / 403 reaction | Add `onUnauthorized` / `onForbidden` | Adds the corresponding error interceptor |
| Different resource path names or ordering | Individual public interceptors | Application owns the complete pipeline |

`appId` is required. `CoSecConfigurer` always resolves and retains its storage
and space-provider dependencies: it uses a supplied instance first, otherwise
creates the default `TokenStorage` or `DeviceIdStorage`, or selects
`NoneSpaceIdProvider`. It creates `JwtTokenManager` only when `tokenRefresher`
exists ([`cosecConfigurer.ts:445`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L445)).

## Configuration and minimal safe example

| `CoSecConfig` field | Default | Effect |
| --- | --- | --- |
| `appId` | required | `CoSec-App-Id` on every configured request |
| `tokenStorage` | `new TokenStorage()` | Token state and token-change event bus |
| `deviceIdStorage` | `new DeviceIdStorage()` | Stable `CoSec-Device-Id` |
| `tokenRefresher` | absent | Enables Bearer injection and refresh/retry |
| `spaceIdProvider` | `NoneSpaceIdProvider` | Resolves optional `CoSec-Space-Id` |
| `onUnauthorized` | absent | Runs for final 401 or `RefreshTokenError` |
| `onForbidden` | absent | Runs for 403 |

The default browser storage is `localStorage`; `TokenStorage` serializes the
access and refresh token pair as JSON. That is plaintext, JavaScript-readable
persistence, not a safe production default for a browser exposed to XSS. The
package has no built-in secure persistent token store. Use an HttpOnly-cookie or
server-side session design where possible; otherwise pass a deliberately chosen
storage implementation after a security review. The in-memory example below is
for tests and short-lived demos only
([`env.ts:25`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L25),
[`jwtToken.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L255)).

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.test' });
const refreshApi = new Fetcher({ baseURL: 'https://api.example.test' });
const tokenStorage = new TokenStorage({ storage: new InMemoryStorage() });

const cosec = new CoSecConfigurer({
  appId: 'example-console',
  tokenStorage,
  tokenRefresher: new CoSecTokenRefresher({
    fetcher: refreshApi,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => tokenStorage.signOut(),
  onForbidden: async () => {
    // Update application UI without exposing token material.
  },
});

cosec.applyTo(api);
```

Use a refresh Fetcher that is not configured with this CoSec configurer. The
built-in refresher marks its request with
`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`, preventing the request interceptor from
trying to refresh again ([`tokenRefresher.ts:192`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L192)).

## Token lifecycle and state

After a trusted sign-in response, call `tokenStorage.signIn()` with the token
pair. `authenticated` means a parsable, unexpired access JWT; `currentUser`
returns its decoded CoSec payload or `null`. `signOut()` removes the stored
value; `destroy()` only detaches the storage object's own event handler, so it
does **not** sign out or erase persisted tokens
([`tokenStorage.ts:95`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L95),
[`keyStorage.ts:208`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L208)).

| API | Return | Contract |
| --- | --- | --- |
| `signIn(token)` | `void` | Wraps and stores a `CompositeToken` |
| `signOut()` | `void` | Removes the configured token key |
| `authenticated` | `boolean` | `true` only when the access JWT is not expired |
| `currentUser` | `CoSecJwtPayload \| null` | Decoded payload only; never proof of trust |
| `JwtTokenManager.currentToken` | `JwtCompositeToken \| null` | Current wrapped pair |
| `JwtTokenManager.refresh()` | `Promise<void>` | Replaces the stored pair or fails and removes it |

`earlyPeriod` defaults to `0` seconds. It shifts expiration earlier for both
access and refresh JWTs; malformed JWTs are considered expired
([`tokenStorage.ts:60`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L60),
[`jwtToken.ts:96`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L96)).

## Interceptor pipeline and refresh semantics

`applyTo()` registers these interceptors. Request interceptors are ordered by
their public numeric `order`; the flow below records the Configurer's intended
composition, not an authorization decision made by the client.

```text
CoSecRequest
  → AuthorizationRequest (only with tokenRefresher)
  → ResourceAttribution
  → network response
  → AuthorizationResponse (only with tokenRefresher)
  → Unauthorized / Forbidden error callback (only when configured)
```

| Stage | Public type | Behavior |
| --- | --- | --- |
| Request identity | `CoSecRequestInterceptor` | Sets app, device, unique request, and optional space headers |
| Resource attribution | `ResourceAttributionRequestInterceptor` | Fills missing URL-template `tenantId` and `ownerId` from decoded claims |
| Bearer request | `AuthorizationRequestInterceptor` | Keeps an explicit `Authorization` header for that request phase; otherwise refreshes if needed and adds `Bearer` |
| 401 response | `AuthorizationResponseInterceptor` | Refreshes, drops stale Bearer, then reruns the exchange at most once |
| Final errors | `UnauthorizedErrorInterceptor`, `ForbiddenErrorInterceptor` | Invoke application callbacks; they do not repair permissions |

The request order is ascending numeric `order`: `CoSecRequestInterceptor`, then
`AuthorizationRequestInterceptor`, then `ResourceAttributionRequestInterceptor`.
The last interceptor is deliberately placed immediately before URL resolution
([`interceptor.ts:173`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L173),
[`authorizationRequestInterceptor.ts:28`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L28),
[`resourceAttributionRequestInterceptor.ts:50`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L50)).

Resource attribution is opt-in by URL template: it only fills the default
`tenantId` and `ownerId` keys when those placeholders exist and the caller did
not already provide a value. It reads `tenantId` and `sub` from the decoded
access payload ([`resourceAttributionRequestInterceptor.ts:84`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L84)).
Use its constructor options only when your templates use different parameter
names.

Before sending a request, `AuthorizationRequestInterceptor` preserves an
explicit `Authorization` Header. With an owned token, it refreshes only when
the access token needs refresh, the refresh JWT remains valid, and the request
does not contain the ignore-refresh attribute
([`authorizationRequestInterceptor.ts:63`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L63)).
That preservation applies only to the initial request-interceptor pass: on a
401, `AuthorizationResponseInterceptor` does not inspect who supplied the
header. It can refresh, deletes that header, and retries with the managed token.
For a deliberately different credential, use an independent Fetcher that does
not install CoSec's authorization-response interceptor
([`authorizationResponseInterceptor.ts:102`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L102)).

## Concurrent refresh, retry, and errors

`JwtTokenManager` stores one in-flight refresh promise. Simultaneous callers
await that same promise; a successful refresh writes the new pair. A refresh
failure removes stored state and throws `RefreshTokenError` wrapping the old
token and original cause ([`jwtTokenManager.ts:59`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L59)).

A 401 response is separate from proactive expiry refresh. The response
interceptor retries one exchange at most once (`AUTHORIZATION_RESPONSE_MAX_RETRY
=== 1`). It refreshes only when a refresh token is still usable, removes the
stale Bearer header before retry, and propagates a retry failure without
clearing an otherwise fresh token
([`authorizationResponseInterceptor.ts:72`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L72)).

| Failure | Result |
| --- | --- |
| No current token and `refresh()` is called directly | Rejects with `Error('No token found')` |
| Refresh endpoint / parsing fails | Token storage is removed; `RefreshTokenError` propagates |
| Refresh JWT expired | No 401 refresh/retry; the original response continues |
| Retry still returns 401 | No second refresh/retry; final error pipeline may run |
| 401 with configured `onUnauthorized` | Callback runs for 401 or `RefreshTokenError` |
| 403 with configured `onForbidden` | Callback runs for 403 only |

## Cleanup, security, and troubleshooting

`signOut()` does not cancel an in-progress `JwtTokenManager.refresh()`. A refresh
that succeeds later unconditionally writes its new pair, so it can restore a
token after sign-out ([`jwtTokenManager.ts:68`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L68)).
For final logout, stop admitting new protected requests, coordinate cancellation
or completion of in-flight requests that can trigger refresh, then call
`signOut()` after that work settles; call it again as the final cleanup if a
refresh may have completed during the transition. When the storage object itself
is no longer used, also call `destroy()`. Do not log `CompositeToken`, raw JWT
strings, Authorization headers, or decoded payloads that contain sensitive
claims. `parseJwtPayload()` is a
decode helper, not signature verification; invalid parsing returns `null`, and
the current implementation writes a generic parsing error to `console.error`,
so do not rely on it as a redaction boundary
([`jwts.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L91)).

| Symptom | Check |
| --- | --- |
| No `Authorization` header | Supply `tokenRefresher`, sign in a valid access JWT, and check that the request did not set its own header. |
| Repeated 401 | The client retries only once; inspect server-side authorization and refresh endpoint behavior without logging token data. |
| Token unexpectedly disappears | A failed refresh intentionally removes storage; handle `RefreshTokenError` through `onUnauthorized`. |
| Wrong tenant/owner path | Ensure `{tenantId}` / `{ownerId}` are in the URL template, or pass the explicit values to override attribution. |
| Tokens survive component teardown | `destroy()` is cleanup only; call `signOut()` to remove the stored entry. |
| Token reappears after logout | Coordinate in-flight refresh/request work, then perform final `signOut()`; sign-out alone cannot cancel refresh. |
| Browser security concern | Default `localStorage` is plaintext; move credentials to an HttpOnly/server-side design or provide a reviewed storage adapter. |

## Source references

- [packages/cosec/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts#L14)
- [packages/cosec/src/cosecConfigurer.ts:445](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L445)
- [packages/cosec/src/tokenStorage.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L60)
- [packages/cosec/src/jwtTokenManager.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L59)
- [packages/cosec/src/authorizationResponseInterceptor.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L29)
