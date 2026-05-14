---
name: fetcher-cosec-auth
description: >
  Implement enterprise authentication with CoSec framework and Fetcher. Covers JWT token lifecycle (JwtToken, JwtCompositeToken, JwtTokenManager), token refresh (TokenRefresher, CoSecTokenRefresher), device tracking (DeviceIdStorage), multi-tenant space resolution (SpaceIdProvider, ResourceAttributionRequestInterceptor), 401/403 error handling (UnauthorizedErrorInterceptor, ForbiddenErrorInterceptor), CoSecHeaders constants, and declarative setup via CoSecConfigurer.
  Use for: CoSec, authentication, JWT, token refresh, Bearer token, authorization, 401/403 errors, multi-tenant, SpaceIdProvider, tenant isolation, device tracking, CoSecConfigurer, CoSecHeaders.
---

# Skill: fetcher-cosec-auth

## Purpose

This skill helps developers implement enterprise authentication using the CoSec framework with the Fetcher HTTP client. It provides guidance on configuring secure authentication, token management, device tracking, and multi-tenant support.

## Trigger Conditions

- CoSec, authentication, token refresh
- JWT, device ID, multi-tenant support
- 401/403 error handling
- Bearer token, authorization headers
- Enterprise security, access control

---

## Core Concepts

### CoSec Authentication Flow

```
Request → AuthorizationRequestInterceptor → CoSecRequestInterceptor → Server
                                                                      ↓
Response ← AuthorizationResponseInterceptor (401 retry with fresh token)
```

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

| Option            | Type                                   | Description                                            |
| ----------------- | -------------------------------------- | ------------------------------------------------------ |
| `appId`           | `string`                               | **Required.** Application identifier for CoSec headers |
| `tokenStorage`    | `TokenStorage`                         | Custom token storage (defaults to `new TokenStorage()`) |
| `deviceIdStorage` | `DeviceIdStorage`                      | Custom device ID storage (defaults to `new DeviceIdStorage()`) |
| `tokenRefresher`  | `TokenRefresher`                       | Enables JWT auth interceptors when provided            |
| `spaceIdProvider` | `SpaceIdProvider`                      | Enables multi-tenant support                           |
| `onUnauthorized`  | `(exchange) => Promise<void> \| void`  | Custom 401 error handler (async supported)             |
| `onForbidden`     | `(exchange) => Promise<void>`          | Custom 403 error handler (async)                       |

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

const token = new JwtToken<CoSecJwtPayload>('eyJ...', 300000); // 5 min early period

token.token;      // raw JWT string
token.payload;    // CoSecJwtPayload | null
token.isExpired;  // boolean (considers earlyPeriod)
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

Manages access/refresh token pairs as a single unit.

```typescript
import { JwtCompositeToken } from '@ahoo-wang/fetcher-cosec';

const composite = new JwtCompositeToken(
  { accessToken: 'eyJ...', refreshToken: 'eyJ...' },
  300000, // earlyPeriod in ms
);

composite.authenticated;     // true if access token not expired
composite.isRefreshNeeded;   // true if access token expired
composite.isRefreshable;     // true if refresh token not expired
composite.access;            // JwtToken<CoSecJwtPayload>
composite.refresh;           // JwtToken<JwtPayload>
```

### JwtCompositeTokenSerializer

```typescript
import { JwtCompositeTokenSerializer } from '@ahoo-wang/fetcher-cosec';

const serializer = new JwtCompositeTokenSerializer(300000);
const serialized = serializer.serialize(compositeToken);
const restored = serializer.deserialize(serialized);
```

---

## TokenStorage

Secure token storage with localStorage backend and cross-tab synchronization.

### Constructor

```typescript
new TokenStorage(options?: TokenStorageOptions)
```

`TokenStorageOptions` extends `KeyStorageOptions<JwtCompositeToken>` (excluding `serializer`) with:

```typescript
{
  key?: string;              // defaults to 'cosec-token'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus
  earlyPeriod?: number;      // defaults to 0
  storage?: Storage;         // defaults to localStorage
}
```

### Usage

```typescript
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage({ key: 'my-app-token', earlyPeriod: 300 });

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

```typescript
new DeviceIdStorage(options?: DeviceIdStorageOptions)
```

`DeviceIdStorageOptions` extends `Partial<KeyStorageOptions<string>>`:

```typescript
{
  key?: string;              // defaults to 'cosec-device-id'
  eventBus?: TypedEventBus;  // defaults to BroadcastTypedEventBus
  storage?: Storage;         // defaults to localStorage
}
```

### Usage

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

const deviceStorage = new DeviceIdStorage({ key: 'my-app-device' });

const deviceId = deviceStorage.getOrCreate(); // get existing or generate new
deviceStorage.set('custom-device-id');
deviceStorage.get();   // string | null
```

---

## JwtTokenManager

Manages JWT token lifecycle with deduplicated concurrent refresh calls.

```typescript
import { JwtTokenManager, TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

tokenManager.currentToken;     // JwtCompositeToken | null
tokenManager.isRefreshNeeded;  // boolean
tokenManager.isRefreshable;    // boolean

await tokenManager.refresh();  // deduplicates concurrent calls
```

---

## TokenRefresher Interface

```typescript
interface TokenRefresher {
  refresh(token: CompositeToken): Promise<CompositeToken>;
}
```

### CoSecTokenRefresher (Built-in Implementation)

Sends POST requests via a Fetcher instance. Automatically includes `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` to prevent infinite loops.

```typescript
import { CoSecTokenRefresher } from '@ahoo-wang/fetcher-cosec';

const refresher = new CoSecTokenRefresher({
  fetcher: myFetcher,
  endpoint: '/auth/refresh',
});

const newToken = await refresher.refresh({ accessToken: '...', refreshToken: '...' });
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

CoSecHeaders.DEVICE_ID;      // 'CoSec-Device-Id'
CoSecHeaders.APP_ID;         // 'CoSec-App-Id'
CoSecHeaders.SPACE_ID;       // 'CoSec-Space-Id'
CoSecHeaders.AUTHORIZATION;  // 'Authorization'
CoSecHeaders.REQUEST_ID;     // 'CoSec-Request-Id'
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

1. Skips if Authorization header already present
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

1. Detects 401 responses
2. Calls `tokenManager.refresh()`
3. Retries original request with new token
4. On failure: clears tokens and throws

### Skip Token Refresh for Specific Requests

```typescript
import { IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY } from '@ahoo-wang/fetcher-cosec';

fetcher.get('/api/public-data', {
  attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]]),
});
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
import { DefaultSpaceIdProvider, SpaceIdStorage } from '@ahoo-wang/fetcher-cosec';

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

**Triggers on:** HTTP 401 responses and `RefreshTokenError` exceptions.

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

| Header             | Constant                      | Added By                                    |
| ------------------ | ----------------------------- | ------------------------------------------- |
| `CoSec-App-Id`     | `CoSecHeaders.APP_ID`         | `CoSecRequestInterceptor`                   |
| `CoSec-Device-Id`  | `CoSecHeaders.DEVICE_ID`      | `CoSecRequestInterceptor`                   |
| `CoSec-Request-Id` | `CoSecHeaders.REQUEST_ID`     | `CoSecRequestInterceptor`                   |
| `CoSec-Space-Id`   | `CoSecHeaders.SPACE_ID`       | `CoSecRequestInterceptor` (when configured) |
| `Authorization`    | `CoSecHeaders.AUTHORIZATION`  | `AuthorizationRequestInterceptor`           |

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

| Class / Export                           | Purpose                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `CoSecConfigurer`                        | Declarative configuration for all CoSec features  |
| `CoSecHeaders`                           | Header name constants (DEVICE_ID, APP_ID, etc.)   |
| `JwtToken<Payload>`                      | Parse JWT with typed payload and expiration check  |
| `JwtCompositeToken`                      | Access/refresh token pair with status checks       |
| `JwtCompositeTokenSerializer`            | Serialize/deserialize composite tokens             |
| `CoSecJwtPayload`                        | Extended JWT payload (tenantId, roles, policies)   |
| `JwtTokenManager`                        | Token lifecycle management with dedup refresh      |
| `CoSecTokenRefresher`                    | Built-in TokenRefresher using Fetcher POST         |
| `TokenStorage`                           | JWT token persistence with cross-tab sync          |
| `DeviceIdStorage`                        | Device ID persistence and generation               |
| `AuthorizationRequestInterceptor`        | Adds Bearer token to requests                      |
| `AuthorizationResponseInterceptor`       | Handles 401 and retries with fresh token           |
| `CoSecRequestInterceptor`                | Adds CoSec headers (appId, deviceId, requestId)    |
| `ResourceAttributionRequestInterceptor`  | Injects tenantId/ownerId into URL path params      |
| `UnauthorizedErrorInterceptor`           | Custom 401 error handling                          |
| `ForbiddenErrorInterceptor`              | Custom 403 error handling                          |
| `SpaceIdProvider`                        | Multi-tenant space resolution interface            |
| `DefaultSpaceIdProvider`                 | Predicate + storage based space resolution         |
| `RefreshTokenError`                      | Error thrown when token refresh fails              |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`     | Attribute key to skip auto-refresh for a request   |
