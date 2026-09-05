# Fetcher CoSec Auth API Reference

## Contents

- [Core Concepts](#core-concepts)
  - [CoSec Authentication Flow](#cosec-authentication-flow)
- [CoSecConfigurer (Recommended Setup)](#cosecconfigurer-recommended-setup)
  - [Basic Usage](#basic-usage)
  - [Configuration Options](#configuration-options)
  - [Conditional Interceptor Registration](#conditional-interceptor-registration)
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
  - [Custom TokenRefresher with Retry](#custom-tokenrefresher-with-retry)
- [CoSecHeaders Constants](#cosecheaders-constants)
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
Request → CoSecRequestInterceptor (CoSec-* headers) → AuthorizationRequestInterceptor (Bearer) → Server
                                                                                                         ↓
Response ← AuthorizationResponseInterceptor (401 retry with fresh token)
```

Interceptor order matters: CoSec headers are attached first (`Number.MIN_SAFE_INTEGER + step`), then the Authorization header.

---

## CoSecConfigurer (Recommended Setup)

Declarative configuration for all CoSec features via a single `applyTo(fetcher)` call.

### Basic Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

new CoSecConfigurer({
  appId: 'your-app-id',
  tokenRefresher: {
    refresh: async token => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });
      return response.json();
    },
  },
  onUnauthorized: async exchange => {
    window.location.href = '/login';
  },
  onForbidden: async exchange => {
    alert('Access denied');
  },
}).applyTo(fetcher);
```

### Configuration Options

| Option            | Type                                  | Description                                                    |
| ----------------- | ------------------------------------- | -------------------------------------------------------------- |
| `appId`           | `string`                              | **Required.** Application identifier for CoSec headers         |
| `tokenStorage`    | `TokenStorage`                        | Custom token storage (defaults to `new TokenStorage()`)        |
| `deviceIdStorage` | `DeviceIdStorage`                     | Custom device ID storage (defaults to `new DeviceIdStorage()`) |
| `tokenRefresher`  | `TokenRefresher`                      | Enables JWT auth interceptors when provided                    |
| `spaceIdProvider` | `SpaceIdProvider`                     | Enables multi-tenant support                                   |
| `onUnauthorized`  | `(exchange) => Promise<void> \| void` | Custom 401 error handler (async supported)                     |
| `onForbidden`     | `(exchange) => Promise<void>`         | Custom 403 error handler (async)                               |

### Conditional Interceptor Registration

**Always added:**

- `CoSecRequestInterceptor` - Adds CoSec headers (appId, deviceId, requestId)
- `ResourceAttributionRequestInterceptor` - Adds tenant/owner path parameters from JWT

**Only when `tokenRefresher` is provided:**

- `AuthorizationRequestInterceptor` - Adds Bearer token authentication
- `AuthorizationResponseInterceptor` - Handles token refresh on 401

**Only when handlers are provided:**

- `UnauthorizedErrorInterceptor` - Handles 401 errors
- `ForbiddenErrorInterceptor` - Handles 403 errors

---

## JWT Token Classes

### JwtToken

Parses a JWT string and provides typed payload access with expiration checking.

```typescript
import { JwtToken } from '@ahoo-wang/fetcher-cosec';
import type { CoSecJwtPayload } from '@ahoo-wang/fetcher-cosec';

const token = new JwtToken<CoSecJwtPayload>('eyJ...', 300); // 5 min early period

token.token; // raw JWT string
token.payload; // CoSecJwtPayload | null
token.isExpired; // boolean (considers earlyPeriod)
```

### CoSecJwtPayload Interface

```typescript
interface CoSecJwtPayload extends JwtPayload {
  tenantId?: string;
  policies?: string[];
  roles?: string[];
  attributes?: Record<string, any>;
}
```

### JwtCompositeToken

Manages access/refresh token pairs as a single unit. Each instance has a readonly
`sessionId` generated for a new login. The optional third constructor argument
restores an existing session generation; managed refreshes preserve it.

```typescript
import { JwtCompositeToken } from '@ahoo-wang/fetcher-cosec';

const composite = new JwtCompositeToken(
  { accessToken: 'eyJ...', refreshToken: 'eyJ...' },
  300, // earlyPeriod in seconds
);

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

The stored JSON contains `accessToken`, `refreshToken`, and `sessionId`. The
session generation survives storage restoration and cross-tab broadcasts;
`restored.token` still contains only the original token fields. Legacy JSON
without `sessionId` derives a stable, non-cryptographic 128-bit fingerprint of the exact token pair
so independent tabs retain the same generation during migration. The ID contains
no raw JWT, does not infer identity from the subject, and survives later
refreshes. Every explicit `signIn()` still creates a fresh random generation,
even when the same token pair is reused. This legacy record identifier is not an
authentication or integrity check; the server still validates JWTs.

---

## TokenStorage

Token storage with a localStorage backend and cross-tab synchronization.

### Constructor

```text
new TokenStorage(options?: TokenStorageOptions)
```

`TokenStorageOptions` extends `KeyStorageOptions<JwtCompositeToken>` (excluding `serializer`) with:

```text
{
  key?: string;              // defaults to 'cosec-token'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus
  earlyPeriod?: number;      // defaults to 0
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
  const user = tokenStorage.currentUser; // CoSecJwtPayload | null
}

tokenStorage.signOut();
```

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

Manages persistent device identification with localStorage and cross-tab sync.

### Constructor

```text
new DeviceIdStorage(options?: DeviceIdStorageOptions)
```

`DeviceIdStorageOptions` extends `Partial<KeyStorageOptions<string>>`:

```text
{
  key?: string;              // defaults to 'cosec-device-id'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus
  storage?: Storage;         // defaults to getStorage(): localStorage in browsers, in-memory elsewhere
}
```

### Usage

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

const deviceStorage = new DeviceIdStorage({ key: 'my-app-device' });

const deviceId = deviceStorage.getOrCreate(); // get existing or generate new
deviceStorage.set('custom-device-id');
deviceStorage.get(); // string | null
```

---

## JwtTokenManager

Manages JWT token lifecycle with concurrent refresh calls deduplicated only for
the same current token instance. A replacement session starts its own refresh
without waiting for an older session. A refresh only writes or removes the
token instance that started it; signing out or replacing the session prevents
an old result from overwriting the new state.
If the session changes while refreshing, `RefreshSessionChangedError` rejects
the original request without sending or retrying it as the replacement user.
It does not trigger `onUnauthorized`, including when the original response was 401.
This protection also covers sign-in from token-storage write/removal listeners.
Each exchange keeps the concrete refresh result and rechecks ownership after
awaiting refresh, before selecting Authorization, and before unauthorized
notification. An old `RefreshTokenError` may still propagate after cleanup,
but its callback cannot sign out a replacement session.
The request interceptor also records an anonymous start when no token is present.
A later login cannot replay that earlier anonymous request with the new session;
a response-only interceptor configuration keeps its existing behavior.
Tokens created by a successful managed refresh inherit the same login session.
If another tab finishes refreshing that session first, the pending refresh
reuses the already stored successor when its duplicate request succeeds or fails.
A late 401 for an earlier token reuses the stored successor without refreshing
it again, including successors received from another tab. `signIn` starts a separate session even for the same user or composite
token object.

`refresh(exchange?: FetchExchange): Promise<void>` accepts the originating
exchange from authorization interceptors to reuse its session's newer token and
identify its notification handler.
Direct calls can continue to omit it.

```typescript
import { JwtTokenManager, TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

tokenManager.currentToken; // JwtCompositeToken | null
tokenManager.isRefreshNeeded; // boolean
tokenManager.isRefreshable; // boolean

await tokenManager.refresh(); // deduplicates calls for the same session
```

---

## TokenRefresher Interface

```typescript
interface TokenRefresher {
  refresh(token: CompositeToken): Promise<CompositeToken>;
}
```

### CoSecTokenRefresher (Built-in Implementation)

Sends POST requests via a Fetcher instance. Automatically includes
`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` to prevent infinite loops. Direct calls
retain the refresh Fetcher's `onUnauthorized` callback. A manager suppresses
that callback when the session changed or any request waiting on that refresh
has its own unauthorized interceptor. Otherwise the refresh Fetcher retains
notification responsibility. Concurrent waiters share one failure notification;
a notification already started by the refresh Fetcher is not repeated, even
if its callback throws or rejects. Notification ownership is claimed before
the callback starts; unrelated refresh errors do not claim it.

The built-in method accepts an optional coordination guard:
`refresh(token: CompositeToken, shouldNotifyUnauthorized?: () => boolean)`.
The manager supplies it; ordinary callers can omit it. The `TokenRefresher`
interface remains the single-token contract above.

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

### Custom TokenRefresher with Retry

```typescript
class ResilientTokenRefresher implements TokenRefresher {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error('Max retries');
  }
}
```

---

## CoSecHeaders Constants

```typescript
import { CoSecHeaders } from '@ahoo-wang/fetcher-cosec';

CoSecHeaders.DEVICE_ID; // 'CoSec-Device-Id'
CoSecHeaders.APP_ID; // 'CoSec-App-Id'
CoSecHeaders.SPACE_ID; // 'CoSec-Space-Id'
CoSecHeaders.AUTHORIZATION; // 'Authorization'
CoSecHeaders.REQUEST_ID; // 'CoSec-Request-Id'
```

---

## ResourceAttributionRequestInterceptor

Injects `tenantId` and `ownerId` from JWT payload into URL template placeholders `{tenantId}`/`{ownerId}`.

```typescript
import { ResourceAttributionRequestInterceptor } from '@ahoo-wang/fetcher-cosec';

// Reads tenantId from JWT payload.tenantId and ownerId from payload.sub
fetcher.interceptors.request.use(
  new ResourceAttributionRequestInterceptor({ tokenStorage }),
);

// Request to /api/tenants/{tenantId}/resources will auto-fill tenantId from token
```

---

## AuthorizationRequestInterceptor

Adds JWT Bearer token to outgoing requests. Refreshes token proactively if expired.

```typescript
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({ tokenManager }),
);
```

**Behavior:**

1. Skips if Authorization header already present (case-insensitive, including an empty value)
2. Refreshes token if `isRefreshNeeded && isRefreshable` (unless `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` set)
3. Adds `Authorization: Bearer <access-token>`

---

## AuthorizationResponseInterceptor

Handles automatic token refresh on 401 responses.

```typescript
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({ tokenManager }),
);
```

**Behavior:**

1. Detects 401 responses (skips when the exchange carries `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`, Authorization was supplied by the caller, or a later interceptor replaced or removed the injected header)
2. Calls `tokenManager.refresh(exchange)` to reuse a known successor from the same session, or refreshes the current token if it is refreshable
3. Removes only the managed Authorization header and retries with the new token — at most once per exchange
4. On refresh failure: the manager clears only the original, unchanged session and throws. The response interceptor does not clear a replacement session. A failure of the retried request itself propagates normally without clearing the freshly refreshed token

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

---

## SpaceIdProvider (Multi-Tenant Support)

### Interface

```typescript
interface SpaceIdProvider {
  resolveSpaceId(exchange: FetchExchange): string | null;
}
```

### DefaultSpaceIdProvider

Combines predicate-based filtering with persistent storage.

```typescript
import {
  DefaultSpaceIdProvider,
  SpaceIdStorage,
} from '@ahoo-wang/fetcher-cosec';

const spaceIdProvider = new DefaultSpaceIdProvider({
  spacedResourcePredicate: {
    test: exchange => exchange.request.url.includes('/spaces/'),
  },
  spaceIdStorage: new SpaceIdStorage(),
});
```

### NoneSpaceIdProvider (Default)

```typescript
import { NoneSpaceIdProvider } from '@ahoo-wang/fetcher-cosec';
// Always returns null - used when space identification is not needed
```

---

## Error Handling

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

**Triggers on:** HTTP 401 responses and `RefreshTokenError` exceptions, once
per exchange, with one notification shared by requests whose token refresh
failed together. The built-in refresh request defers notification when any
waiting request has an unauthorized handler. `RefreshSessionChangedError`
does not notify the replacement session. `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`
alone only disables refresh and does not suppress normal 401 notifications.

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

**Triggers on:** HTTP 403 responses.

---

## Headers Summary

| Header             | Constant                     | Added By                                    |
| ------------------ | ---------------------------- | ------------------------------------------- |
| `CoSec-App-Id`     | `CoSecHeaders.APP_ID`        | `CoSecRequestInterceptor`                   |
| `CoSec-Device-Id`  | `CoSecHeaders.DEVICE_ID`     | `CoSecRequestInterceptor`                   |
| `CoSec-Request-Id` | `CoSecHeaders.REQUEST_ID`    | `CoSecRequestInterceptor`                   |
| `CoSec-Space-Id`   | `CoSecHeaders.SPACE_ID`      | `CoSecRequestInterceptor` (when configured) |
| `Authorization`    | `CoSecHeaders.AUTHORIZATION` | `AuthorizationRequestInterceptor`           |

---

## Complete Example

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
  DeviceIdStorage,
} from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

new CoSecConfigurer({
  appId: 'my-enterprise-app',
  tokenStorage: new TokenStorage({ earlyPeriod: 300 }),
  deviceIdStorage: new DeviceIdStorage(),
  tokenRefresher: new CoSecTokenRefresher({
    fetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: async exchange => {
    window.location.href = '/login?reason=session_expired';
  },
  onForbidden: async exchange => {
    alert('Access denied');
  },
}).applyTo(fetcher);

const data = await fetcher.get('/api/protected-resource');
```

---

## Key Classes and Exports

| Class / Export                          | Purpose                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `CoSecConfigurer`                       | Declarative configuration for all CoSec features                                     |
| `CoSecHeaders`                          | Header name constants (DEVICE_ID, APP_ID, etc.)                                      |
| `JwtToken<Payload>`                     | Parse JWT with typed payload and expiration check                                    |
| `JwtCompositeToken`                     | Access/refresh token pair with status checks                                         |
| `JwtCompositeTokenSerializer`           | Serialize/deserialize composite tokens                                               |
| `CoSecJwtPayload`                       | Extended JWT payload (tenantId, roles, policies)                                     |
| `JwtTokenManager`                       | Token lifecycle management with dedup refresh                                        |
| `CoSecTokenRefresher`                   | Built-in TokenRefresher using Fetcher POST                                           |
| `TokenStorage`                          | JWT token persistence with cross-tab sync                                            |
| `DeviceIdStorage`                       | Device ID persistence and generation                                                 |
| `SpaceIdStorage`                        | Space ID persistence (used by space providers)                                       |
| `parseJwtPayload` / `isTokenExpired`    | Low-level JWT utilities for custom token logic                                       |
| `AuthorizationRequestInterceptor`       | Adds Bearer token to requests                                                        |
| `AuthorizationResponseInterceptor`      | Handles 401 and retries with fresh token                                             |
| `CoSecRequestInterceptor`               | Adds CoSec headers (appId, deviceId, requestId)                                      |
| `ResourceAttributionRequestInterceptor` | Injects tenantId/ownerId into URL path params                                        |
| `UnauthorizedErrorInterceptor`          | Custom 401 error handling                                                            |
| `ForbiddenErrorInterceptor`             | Custom 403 error handling                                                            |
| `SpaceIdProvider`                       | Multi-tenant space resolution interface                                              |
| `DefaultSpaceIdProvider`                | Predicate + storage based space resolution                                           |
| `RefreshTokenError`                     | Error thrown when token refresh fails                                                |
| `RefreshSessionChangedError`            | Stops a refresh request after its session changes, without unauthorized side effects |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`    | Attribute key to skip auto-refresh for a request                                     |
