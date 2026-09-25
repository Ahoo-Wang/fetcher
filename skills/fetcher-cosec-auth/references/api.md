# Fetcher CoSec Auth API Reference

## Contents

- [Core Concepts](#core-concepts)
  - [CoSec Authentication Flow](#cosec-authentication-flow)
  - [Interceptor Names and Orders](#interceptor-names-and-orders)
- [CoSecConfigurer (Recommended Setup)](#cosecconfigurer-recommended-setup)
  - [Basic Usage](#basic-usage)
  - [Configuration Options](#configuration-options)
  - [Conditional Interceptor Registration](#conditional-interceptor-registration)
  - [Request Trust](#request-trust)
- [JWT Token Classes](#jwt-token-classes)
  - [JwtToken](#jwttoken)
  - [CoSecJwtPayload Interface](#cosecjwtpayload-interface)
  - [JwtCompositeToken](#jwtcompositetoken)
  - [JwtCompositeTokenSerializer](#jwtcompositetokenserializer)
- [TokenStorage](#tokenstorage)
  - [Constructor](#constructor)
  - [Usage](#usage)
  - [Listening for Changes (EventHandler pattern)](#listening-for-changes-eventhandler-pattern)
- [DeviceIdStorage](#deviceidstorage)
  - [Constructor](#constructor-1)
  - [Usage](#usage-1)
- [JwtTokenManager](#jwttokenmanager)
- [TokenRefresher Interface](#tokenrefresher-interface)
  - [CoSecTokenRefresher (Built-in Implementation)](#cosectokenrefresher-built-in-implementation)
- [CoSecHeaders Constants](#cosecheaders-constants)
- [CoSecRequestInterceptor](#cosecrequestinterceptor)
- [ResourceAttributionRequestInterceptor](#resourceattributionrequestinterceptor)
- [AuthorizationRequestInterceptor](#authorizationrequestinterceptor)
- [AuthorizationResponseInterceptor](#authorizationresponseinterceptor)
  - [Skip Token Refresh for Specific Requests](#skip-token-refresh-for-specific-requests)
- [SpaceIdProvider (Multi-Tenant Support)](#spaceidprovider-multi-tenant-support)
  - [Interface](#interface)
  - [DefaultSpaceIdProvider](#defaultspaceidprovider)
  - [NoneSpaceIdProvider (Default)](#nonespaceidprovider-default)
- [Error Handling](#error-handling)
  - [UnauthorizedErrorInterceptor (401)](#unauthorizederrorinterceptor-401)
  - [ForbiddenErrorInterceptor (403)](#forbiddenerrorinterceptor-403)
- [Headers Summary](#headers-summary)
- [Complete Example](#complete-example)
- [Key Classes and Exports](#key-classes-and-exports)

## Core Concepts

### CoSec Authentication Flow

```
Request phase (ascending order):
  CoSecRequestInterceptor (CoSec-* headers; skipped for an untrusted URL)
  → AuthorizationRequestInterceptor (proactive refresh, Bearer header; skipped for an untrusted URL)
  → RequestBodyInterceptor → … → ResourceAttributionRequestInterceptor ({tenantId}/{ownerId})
  → UrlResolveInterceptor → FetchInterceptor → Server
Response phase:
  AuthorizationResponseInterceptor (401 → refresh → retry once) → … → ValidateStatusInterceptor
Error phase (only when something threw, e.g. non-2xx status):
  UnauthorizedErrorInterceptor (401 / RefreshTokenError), ForbiddenErrorInterceptor (403)
```

### Interceptor Names and Orders

Every interceptor's `name` and `order` are exported constants (`DEFAULT_INTERCEPTOR_ORDER_STEP` = 1000, from `@ahoo-wang/fetcher`):

| Interceptor                             | Phase    | Name constant / value                                          | Order constant / value                                                                    |
| --------------------------------------- | -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `CoSecRequestInterceptor`               | request  | `COSEC_REQUEST_INTERCEPTOR_NAME` = `'CoSecRequestInterceptor'` | `COSEC_REQUEST_INTERCEPTOR_ORDER` = `Number.MIN_SAFE_INTEGER + 1000`                      |
| `AuthorizationRequestInterceptor`       | request  | `AUTHORIZATION_REQUEST_INTERCEPTOR_NAME`                       | `AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER` = `COSEC_REQUEST_INTERCEPTOR_ORDER + 1000`      |
| `ResourceAttributionRequestInterceptor` | request  | `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME`                | `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER` = `URL_RESOLVE_INTERCEPTOR_ORDER - 1000` |
| `AuthorizationResponseInterceptor`      | response | `AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME`                      | `AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER` = `Number.MIN_SAFE_INTEGER + 1000`             |
| `UnauthorizedErrorInterceptor`          | error    | `UNAUTHORIZED_ERROR_INTERCEPTOR_NAME`                          | `UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER` = `0`                                              |
| `ForbiddenErrorInterceptor`             | error    | `FORBIDDEN_ERROR_INTERCEPTOR_NAME`                             | `FORBIDDEN_ERROR_INTERCEPTOR_ORDER` = `0`                                                 |

Consequences: CoSec and Authorization headers are set before the built-in `RequestBodyInterceptor` (`MIN_SAFE_INTEGER + 10000`); resource attribution runs just before URL resolution, so it sees path params added by earlier interceptors; `AuthorizationResponseInterceptor` runs before the built-in `ValidateStatusInterceptor`, so a 401 is retried before it can throw. Custom request interceptors that must see the `Authorization` header need an order above `AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`.

---

## CoSecConfigurer (Recommended Setup)

Declarative configuration for all CoSec features via a single `applyTo(fetcher)` call. It implements `FetcherConfigurer`; one configurer can be applied to several fetchers, which then share its `tokenStorage`, `deviceIdStorage`, and `tokenManager`.

### Basic Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

new CoSecConfigurer({
  appId: 'your-app-id',
  tokenRefresher: {
    refresh: async token => {
      // Plain fetch bypasses Fetcher interceptors, so no refresh loop.
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token),
      });
      if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);
      return response.json(); // must be { accessToken, refreshToken }
    },
  },
  onUnauthorized: exchange => {
    window.location.href = '/login';
  },
  onForbidden: async exchange => {
    alert('Access denied');
  },
}).applyTo(fetcher);
```

### Configuration Options

`CoSecConfig`:

| Option            | Type                                                 | Description                                                                                                          |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `appId`           | `string`                                             | **Required.** Sent as `CoSec-App-Id`                                                                                 |
| `tokenStorage`    | `TokenStorage`                                       | Defaults to `new TokenStorage()`                                                                                     |
| `deviceIdStorage` | `DeviceIdStorage`                                    | Defaults to `new DeviceIdStorage()`                                                                                  |
| `tokenRefresher`  | `TokenRefresher`                                     | Creates `configurer.tokenManager` and enables the Authorization interceptors                                         |
| `spaceIdProvider` | `SpaceIdProvider`                                    | Defaults to `NoneSpaceIdProvider`                                                                                    |
| `isTrusted`       | `RequestTrust`                                       | Which absolute request URLs carry the token and `CoSec-*` headers; defaults to every request. Pass `sameOriginTrust` |
| `onUnauthorized`  | `(exchange: FetchExchange) => Promise<void> \| void` | Registers `UnauthorizedErrorInterceptor`                                                                             |
| `onForbidden`     | `(exchange: FetchExchange) => Promise<void>`         | Registers `ForbiddenErrorInterceptor` (must return a Promise)                                                        |

The configurer exposes `config`, `tokenStorage`, `deviceIdStorage`, `tokenManager?`, and `spaceIdProvider` as readonly fields.

### Conditional Interceptor Registration

**Always added:**

- `CoSecRequestInterceptor` - Adds CoSec headers (appId, deviceId, requestId, spaceId when resolved)
- `ResourceAttributionRequestInterceptor` - Fills `{tenantId}`/`{ownerId}` URL path params from the stored JWT

**Only when `tokenRefresher` is provided:**

- `AuthorizationRequestInterceptor` - Adds Bearer token authentication
- `AuthorizationResponseInterceptor` - Handles token refresh on 401

Without a `tokenRefresher`, no `Authorization` header is sent at all, even if `TokenStorage` holds a token.

**Only when handlers are provided:**

- `UnauthorizedErrorInterceptor` - Handles 401 errors
- `ForbiddenErrorInterceptor` - Handles 403 errors

### Request Trust

By default every request carries the access token and the `CoSec-*` headers, device ID included — also a request to an absolute URL on another origin (a pagination link, a download URL, a callback). `isTrusted` (on `CoSecConfig`, `CoSecRequestOptions` and `AuthorizationInterceptorOptions`) limits that:

```typescript
import { CoSecConfigurer, sameOriginTrust } from '@ahoo-wang/fetcher-cosec';

new CoSecConfigurer({ appId, tokenRefresher, isTrusted: sameOriginTrust });
```

- `RequestTrust` = `(url: string, exchange: FetchExchange) => boolean`; `RequestTrustCapable` declares the optional `isTrusted`.
- `isTrustedRequest(exchange, isTrusted?)`: without `isTrusted` every request is trusted; with it a relative request URL is always trusted and an absolute one only when `isTrusted(url, exchange)` returns true.
- `sameOriginTrust` trusts the origin of the fetcher's `baseURL` and the page's own origin.
- An untrusted request gets no `CoSec-*` headers, no `Authorization` and no refresh.

---

## JWT Token Classes

### JwtToken

Parses a JWT string and provides typed payload access with expiration checking.

```typescript
import { JwtToken } from '@ahoo-wang/fetcher-cosec';
import type { CoSecJwtPayload } from '@ahoo-wang/fetcher-cosec';

const token = new JwtToken<CoSecJwtPayload>('eyJ...', 300); // earlyPeriod seconds, default 0

token.token; // raw JWT string
token.payload; // CoSecJwtPayload | null (null when parsing fails or the payload is not a JSON object)
token.isExpired; // true when unparseable or now >= exp - earlyPeriod; false when no exp claim
```

### CoSecJwtPayload Interface

```typescript
interface CoSecJwtPayload extends JwtPayload {
  // JwtPayload: jti, sub, exp, iat (+ optional iss, aud, nbf, arbitrary keys)
  tenantId?: string;
  policies?: string[];
  roles?: string[];
  attributes?: Record<string, any>;
}
```

### JwtCompositeToken

Manages access/refresh token pairs as a single unit. Each instance has a readonly
`sessionId` (a new nanoid by default). The optional third constructor argument
restores an existing session generation; managed refreshes preserve it.

```typescript
import { JwtCompositeToken } from '@ahoo-wang/fetcher-cosec';

const composite = new JwtCompositeToken(
  { accessToken: 'eyJ...', refreshToken: 'eyJ...' },
  300, // earlyPeriod in seconds, default 0
);

composite.token; // the CompositeToken passed in
composite.authenticated; // true if access token not expired
composite.isRefreshNeeded; // true if access token expired
composite.isRefreshable; // true if refresh token not expired
composite.access; // JwtToken<CoSecJwtPayload>
composite.refresh; // JwtToken<JwtPayload>
```

### JwtCompositeTokenSerializer

```typescript
import { JwtCompositeTokenSerializer } from '@ahoo-wang/fetcher-cosec';

const serializer = new JwtCompositeTokenSerializer(300);
const serialized = serializer.serialize(compositeToken);
const restored = serializer.deserialize(serialized);
```

The stored JSON is `{ accessToken, refreshToken, sessionId }`; `restored.token`
contains only the two token fields. Legacy JSON without `sessionId` gets a
deterministic `legacy:<128-bit hex>` fingerprint of the exact token pair, so
independent tabs agree on the generation during migration (not an integrity
check). Every explicit `signIn()` creates a fresh random generation, even for
the same token pair. A default instance with `earlyPeriod` 0 is exported as
`jwtCompositeTokenSerializer`.

`deserializeLegacy(value: unknown)` restores the plain-object shape broadcast by
older TokenStorage tabs (`value.token.accessToken` / `value.token.refreshToken`
must be strings, otherwise `TypeError`). KeyStorage uses it only for cross-tab
messages that carry no serialized snapshot.

---

## TokenStorage

Token storage (a `KeyStorage<JwtCompositeToken>`) with cross-tab synchronization.

TokenStorage instances sharing one supplied `eventBus` must use the same `earlyPeriod`; they reuse one serializer object, including across duplicate package modules in the same JavaScript global. A different `earlyPeriod` on that bus throws, including after an earlier instance is destroyed. For independent expiration policies, use separate buses. The default creates one bus per instance with a channel derived from its key, so each receiver keeps its own `earlyPeriod` while synchronizing the same token record.

### Constructor

```text
new TokenStorage(options?: TokenStorageOptions)
```

`TokenStorageOptions` = `Partial<Omit<KeyStorageOptions<JwtCompositeToken>, 'serializer'>>` + `Partial<EarlyPeriodCapable>`:

```text
{
  key?: string;              // defaults to DEFAULT_COSEC_TOKEN_KEY = 'cosec-token'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(key) }), closed by destroy()
  earlyPeriod?: number;      // seconds, defaults to 0
  storage?: Storage;         // defaults to getStorage(): localStorage in browsers, in-memory elsewhere
}
```

### Usage

```typescript
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage({
  key: 'my-app-token',
  earlyPeriod: 300,
});

tokenStorage.signIn({ accessToken: 'eyJ...', refreshToken: 'eyJ...' });

if (tokenStorage.authenticated) {
  const user = tokenStorage.currentUser; // CoSecJwtPayload | null (null when access token expired)
}

tokenStorage.get(); // JwtCompositeToken | null (even when expired)
tokenStorage.signOut(); // remove()
```

`setCompositeToken()` is deprecated; use `signIn()`.

### Listening for Changes (EventHandler pattern)

```typescript
const removeListener = tokenStorage.addListener({
  name: 'token-change-listener',
  handle(event) {
    console.log('Token changed:', event.newValue, event.oldValue);
  },
});

// Later, remove the listener
removeListener();
```

---

## DeviceIdStorage

Manages persistent device identification with cross-tab sync.

### Constructor

```text
new DeviceIdStorage(options?: DeviceIdStorageOptions)
```

`DeviceIdStorageOptions` extends `Partial<KeyStorageOptions<string>>` (the serializer is always the identity serializer):

```text
{
  key?: string;              // defaults to DEFAULT_COSEC_DEVICE_ID_KEY = 'cosec-device-id'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(key) }), closed by destroy()
  storage?: Storage;         // defaults to getStorage(): localStorage in browsers, in-memory elsewhere
}
```

### Usage

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

const deviceStorage = new DeviceIdStorage({ key: 'my-app-device' });

const deviceId = deviceStorage.getOrCreate(); // get existing or generate (nanoid) and store
deviceStorage.set('custom-device-id');
deviceStorage.get(); // string | null
```

---

## JwtTokenManager

```typescript
import { JwtTokenManager, TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

tokenManager.currentToken; // JwtCompositeToken | null (tokenStorage.get())
tokenManager.isRefreshNeeded; // boolean, false without a token
tokenManager.isRefreshable; // boolean, false without a token

await tokenManager.refresh(); // throws Error('No token found') when there is no token
```

`refresh(exchange?: FetchExchange): Promise<void>`: the authorization
interceptors pass the originating exchange; direct calls can omit it.

- Concurrent refreshes of the same current token instance share one refresher call; a replacement session starts its own.
- On success the result is stored as a new `JwtCompositeToken` with the storage's `earlyPeriod` and the same `sessionId`.
- On failure, the manager first re-reads storage (`tokenStorage.reload()`): when another tab has already refreshed the same session (its one-time refresh token made ours fail) and stored the successor, that token is used. Otherwise the stored token is removed only if it is still the token that started the refresh, and `RefreshTokenError` (with `.token`) is thrown.
- If the session changes (sign-out, `signIn`, another user) while refreshing, `RefreshSessionChangedError` rejects the original request; it is not sent or retried as the new user and does not trigger `onUnauthorized`.
- If another tab already stored a successor for the same session, the pending refresh (or a late 401 for an older token) reuses it without refreshing again.
- A request started with no token records an anonymous session; a later login cannot replay it with the new session.

---

## TokenRefresher Interface

```typescript
interface TokenRefresher {
  refresh(token: CompositeToken): Promise<CompositeToken>;
}
// CompositeToken = { accessToken: string; refreshToken: string }
```

A refresher that uses a Fetcher carrying the CoSec interceptors must pass
`attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]])`, or the
refresh request can trigger refresh recursively. A plain `fetch` is unaffected.

### CoSecTokenRefresher (Built-in Implementation)

`new CoSecTokenRefresher({ fetcher, endpoint })` POSTs the whole
`CompositeToken` as the JSON body to `endpoint` via `fetcher.post`, with
`ResultExtractors.Json` and `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` set, and
expects a `CompositeToken` back.

Its method accepts an optional coordination guard:
`refresh(token, shouldNotifyUnauthorized?: () => boolean)`. `JwtTokenManager`
supplies it so that one failure produces one unauthorized notification:
the refresh request's own `onUnauthorized` is suppressed when the session
changed or when a waiting request's fetcher has an `UnauthorizedErrorInterceptor`.
Ordinary callers omit it.

```typescript
import { CoSecTokenRefresher } from '@ahoo-wang/fetcher-cosec';

const refresher = new CoSecTokenRefresher({
  fetcher: myFetcher,
  endpoint: '/auth/refresh',
});

const newToken = await refresher.refresh({
  accessToken: '...',
  refreshToken: '...',
});
```

---

## CoSecHeaders Constants

```typescript
import { CoSecHeaders, ResponseCodes } from '@ahoo-wang/fetcher-cosec';

CoSecHeaders.DEVICE_ID; // 'CoSec-Device-Id'
CoSecHeaders.APP_ID; // 'CoSec-App-Id'
CoSecHeaders.SPACE_ID; // 'CoSec-Space-Id'
CoSecHeaders.AUTHORIZATION; // 'Authorization'
CoSecHeaders.REQUEST_ID; // 'CoSec-Request-Id'

ResponseCodes.UNAUTHORIZED; // 401
ResponseCodes.FORBIDDEN; // 403
```

---

## CoSecRequestInterceptor

```typescript
fetcher.interceptors.request.use(
  new CoSecRequestInterceptor({ appId, deviceIdStorage, spaceIdProvider }),
);
```

`CoSecRequestOptions`: `appId` and `deviceIdStorage` required, `spaceIdProvider`
optional (defaults to `NoneSpaceIdProvider`), `isTrusted` optional (an untrusted
request gets no CoSec headers; see [Request Trust](#request-trust)). Each request gets a new nanoid
`CoSec-Request-Id`; `CoSec-Device-Id` comes from `deviceIdStorage.getOrCreate()`;
`CoSec-Space-Id` is set only when the provider returns a non-empty value.

---

## ResourceAttributionRequestInterceptor

Fills URL template path params from the stored access token: `{tenantId}` from `payload.tenantId`, `{ownerId}` from `payload.sub`.

```typescript
import { ResourceAttributionRequestInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.request.use(
  new ResourceAttributionRequestInterceptor({ tokenStorage }),
);

// Request to /api/tenants/{tenantId}/resources will auto-fill tenantId from token
```

Options: `tokenStorage` (required), `tenantId?` / `ownerId?` rename the
placeholder keys (defaults `'tenantId'` / `'ownerId'`). A param is filled only
when the placeholder appears in the URL template and the caller did not supply
it; nothing happens without a stored token (expiry is not checked), and the
unfilled placeholder then fails URL resolution with `Missing required path
parameter`. The param is written to the exchange's copy of `urlParams`, so a
request object the caller reuses is not changed.

---

## AuthorizationRequestInterceptor

Adds JWT Bearer token to outgoing requests. Refreshes token proactively if expired.

```typescript
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({ tokenManager }),
);
```

**Behavior:**

1. Does nothing for a request `isTrusted` rejects (see [Request Trust](#request-trust)); skips if an Authorization header is already present (case-insensitive, including an empty value); caller-supplied credentials stay outside the managed session
2. Does nothing (records an anonymous session) when there is no stored token
3. Refreshes first if `isRefreshNeeded && isRefreshable`, unless the exchange has `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`
4. Adds `Authorization: Bearer <access-token>`

---

## AuthorizationResponseInterceptor

Handles automatic token refresh on 401 responses.

```typescript
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({ tokenManager }),
);
```

**Behavior:**

1. Acts only on a 401 response; skips when the exchange carries `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`, when Authorization was supplied by the caller, or when a later interceptor replaced or removed the injected header
2. Skips (lets the 401 continue) when the token is not refreshable and no newer token from the same session exists
3. Calls `tokenManager.refresh(exchange)`, which reuses a known successor from the same session or refreshes the current token
4. Removes the managed Authorization header and retries — at most once per exchange (`AUTHORIZATION_RESPONSE_MAX_RETRY` = 1)
5. On refresh failure: the manager reuses a successor another tab stored for the same session; otherwise it clears only the original, unchanged session and throws `RefreshTokenError`. A failure of the retried request itself propagates without clearing the freshly refreshed token
6. The retry replays the whole request phase (new `CoSec-Request-Id`, re-sent fetch) and only the response interceptors up to this one; later response interceptors (status validation, body readers) run once on the fresh response. The error phase is not replayed: when the retry fails, error interceptors run once and `error.exchange.error` is the retry's own error (for example `HttpStatusValidationError`), not a nested `ExchangeError`

### Skip Token Refresh for Specific Requests

```typescript
import { IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY } from '@ahoo-wang/fetcher-cosec';

fetcher.get(
  '/api/public-data',
  {},
  {
    attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]]),
  },
);
```

The key's value is `'Ignore-Refresh-Token'` and only its presence is checked
(`attributes.has`), so `false` also skips. It disables proactive refresh and the
401 retry; the Bearer header is still attached.

---

## SpaceIdProvider (Multi-Tenant Support)

### Interface

```typescript
interface SpaceIdProvider {
  resolveSpaceId(exchange: FetchExchange): string | null;
}
```

### DefaultSpaceIdProvider

Returns `spaceIdStorage.get()` when the predicate matches, otherwise `null`.

```typescript
import {
  DefaultSpaceIdProvider,
  SpaceIdStorage,
} from '@ahoo-wang/fetcher-cosec';

const spaceIdStorage = new SpaceIdStorage(); // key defaults to DEFAULT_COSEC_SPACE_ID_KEY = 'cosec-space-id'
const spaceIdProvider = new DefaultSpaceIdProvider({
  spacedResourcePredicate: {
    test: exchange => exchange.request.url.includes('/spaces/'),
  },
  spaceIdStorage,
});

spaceIdStorage.set('workspace-alpha'); // cross-tab synchronized
```

### NoneSpaceIdProvider (Default)

`NoneSpaceIdProvider` is a constant object (not a class) whose `resolveSpaceId` always returns `null`.

---

## Error Handling

Error interceptors only run when the exchange threw — for a 401/403 that means
the built-in `ValidateStatusInterceptor` rejected the status. Neither CoSec
error interceptor clears `exchange.error`, so the original call still rejects
with `ExchangeError` after the callback runs.

### UnauthorizedErrorInterceptor (401)

```typescript
import { UnauthorizedErrorInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.error.use(
  new UnauthorizedErrorInterceptor({
    onUnauthorized: async exchange => {
      tokenStorage.signOut();
      window.location.href = '/login';
    },
  }),
);
```

**Triggers on:** `exchange.response.status === 401` or `exchange.error instanceof RefreshTokenError`,
at most once per exchange, with one notification shared by requests whose
token refresh failed together. `RefreshSessionChangedError` never notifies.
`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` only disables refresh; it does not
suppress normal 401 notifications.

### ForbiddenErrorInterceptor (403)

```typescript
import { ForbiddenErrorInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.error.use(
  new ForbiddenErrorInterceptor({
    onForbidden: async exchange => {
      alert('You do not have permission to access this resource');
    },
  }),
);
```

**Triggers on:** HTTP 403 responses only. No refresh or retry is attempted for 403.

---

## Headers Summary

| Header             | Constant                     | Added By                                  |
| ------------------ | ---------------------------- | ----------------------------------------- |
| `CoSec-App-Id`     | `CoSecHeaders.APP_ID`        | `CoSecRequestInterceptor`                 |
| `CoSec-Device-Id`  | `CoSecHeaders.DEVICE_ID`     | `CoSecRequestInterceptor`                 |
| `CoSec-Request-Id` | `CoSecHeaders.REQUEST_ID`    | `CoSecRequestInterceptor`                 |
| `CoSec-Space-Id`   | `CoSecHeaders.SPACE_ID`      | `CoSecRequestInterceptor` (when resolved) |
| `Authorization`    | `CoSecHeaders.AUTHORIZATION` | `AuthorizationRequestInterceptor`         |

---

## Complete Example

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
  DeviceIdStorage,
  sameOriginTrust,
} from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const tokenStorage = new TokenStorage({ earlyPeriod: 300 });

new CoSecConfigurer({
  appId: 'my-enterprise-app',
  isTrusted: sameOriginTrust,
  tokenStorage,
  deviceIdStorage: new DeviceIdStorage(),
  tokenRefresher: new CoSecTokenRefresher({
    fetcher, // the refresh POST carries IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: exchange => {
    window.location.href = '/login?reason=session_expired';
  },
  onForbidden: async exchange => {
    alert('Access denied');
  },
}).applyTo(fetcher);

// After login:
tokenStorage.signIn({ accessToken: '...', refreshToken: '...' });
const data = await fetcher.get('/api/protected-resource');
```

---

## Key Classes and Exports

| Class / Export                                                                           | Purpose                                                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `CoSecConfigurer` / `CoSecConfig`                                                        | Declarative configuration for all CoSec features                                     |
| `CoSecHeaders` / `ResponseCodes`                                                         | Header name constants / 401 and 403 status constants                                 |
| `JwtToken<Payload>`                                                                      | Parse JWT with typed payload and expiration check                                    |
| `JwtCompositeToken`                                                                      | Access/refresh token pair with status checks and `sessionId`                         |
| `JwtCompositeTokenSerializer`                                                            | Serialize/deserialize composite tokens                                               |
| `CoSecJwtPayload` / `JwtPayload`                                                         | JWT payload types (tenantId, roles, policies, attributes)                            |
| `CompositeToken`                                                                         | `{ accessToken, refreshToken }` exchanged with the refresher                         |
| `JwtTokenManager`                                                                        | Token lifecycle management with dedup refresh                                        |
| `TokenRefresher` / `CoSecTokenRefresher`                                                 | Refresh contract / built-in implementation using Fetcher POST                        |
| `TokenStorage`                                                                           | JWT token persistence with cross-tab sync (`'cosec-token'`)                          |
| `DeviceIdStorage`                                                                        | Device ID persistence and generation (`'cosec-device-id'`)                           |
| `SpaceIdStorage`                                                                         | Space ID persistence (`'cosec-space-id'`)                                            |
| `DEFAULT_COSEC_TOKEN_KEY` / `DEFAULT_COSEC_DEVICE_ID_KEY` / `DEFAULT_COSEC_SPACE_ID_KEY` | Default storage keys                                                                 |
| `parseJwtPayload` / `isTokenExpired`                                                     | Low-level JWT utilities for custom token logic                                       |
| `idGenerator` / `NanoIdGenerator`                                                        | nanoid-based ID generator used for request, device, and session IDs                  |
| `AuthorizationRequestInterceptor`                                                        | Adds Bearer token to requests                                                        |
| `AuthorizationResponseInterceptor`                                                       | Handles 401 and retries once with a fresh token                                      |
| `CoSecRequestInterceptor`                                                                | Adds CoSec headers (appId, deviceId, requestId, spaceId)                             |
| `ResourceAttributionRequestInterceptor`                                                  | Fills `{tenantId}`/`{ownerId}` URL path params                                       |
| `UnauthorizedErrorInterceptor`                                                           | Custom 401 error handling                                                            |
| `ForbiddenErrorInterceptor`                                                              | Custom 403 error handling                                                            |
| `SpaceIdProvider`                                                                        | Space resolution interface                                                           |
| `DefaultSpaceIdProvider` / `NoneSpaceIdProvider`                                         | Predicate + storage resolution / always-null default                                 |
| `RefreshTokenError`                                                                      | Thrown when token refresh fails (extends `FetcherError`, has `.token`)               |
| `RefreshSessionChangedError`                                                             | Stops a refresh request after its session changes, without unauthorized side effects |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`                                                     | `'Ignore-Refresh-Token'`; attribute key to skip auto-refresh for a request           |
| `RequestTrust` / `RequestTrustCapable` / `sameOriginTrust` / `isTrustedRequest`          | Decide which absolute request URLs carry credentials (`isTrusted`)                   |
| `AuthorizeResult` / `AuthorizeResults`                                                   | Authorization result type and constants (ALLOW, EXPLICIT_DENY, …)                    |
