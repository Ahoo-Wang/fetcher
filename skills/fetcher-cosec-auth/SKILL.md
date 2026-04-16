---
name: fetcher-cosec-auth
description: Implement enterprise authentication using CoSec framework with Fetcher. Use when users mention CoSec, authentication, token refresh, JWT, device ID, multi-tenant support, 401/403 error handling, Bearer token, or authorization headers.
---

# Skill: fetcher-cosec-auth

## Purpose

This skill helps developers implement enterprise authentication using the CoSec framework with the Fetcher HTTP client. It provides comprehensive guidance on configuring secure authentication, token management, device tracking, and multi-tenant support.

## Trigger Conditions

This skill activates when users mention:
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

The `CoSecConfigurer` class provides simplified, declarative configuration for all CoSec features.

### Basic Usage

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const configurer = new CoSecConfigurer({
  appId: 'your-app-id',
  tokenRefresher: {
    refresh: async (token) => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });
      return response.json();
    },
  },
  onUnauthorized: (exchange) => {
    window.location.href = '/login';
  },
  onForbidden: (exchange) => {
    alert('Access denied');
  },
});

configurer.applyTo(fetcher);
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `appId` | `string` | **Required.** Application identifier for CoSec headers |
| `tokenStorage` | `TokenStorage` | Custom token storage (defaults to localStorage) |
| `deviceIdStorage` | `DeviceIdStorage` | Custom device ID storage |
| `tokenRefresher` | `TokenRefresher` | Enables JWT auth interceptors when provided |
| `spaceIdProvider` | `SpaceIdProvider` | Enables multi-tenant support |
| `onUnauthorized` | `(exchange) => void` | Custom 401 error handler |
| `onForbidden` | `(exchange) => void` | Custom 403 error handler |

### Conditional Interceptor Registration

**Always added:**
- `CoSecRequestInterceptor` - Adds CoSec headers (appId, deviceId, requestId)
- `ResourceAttributionRequestInterceptor` - Adds tenant/owner path parameters

**Only when `tokenRefresher` is provided:**
- `AuthorizationRequestInterceptor` - Adds Bearer token authentication
- `AuthorizationResponseInterceptor` - Handles token refresh on 401

**Only when handlers are provided:**
- `UnauthorizedErrorInterceptor` - Handles 401 errors
- `ForbiddenErrorInterceptor` - Handles 403 errors

---

## JwtTokenManager and TokenStorage

### JwtTokenManager

Manages JWT token lifecycle including validation, refresh, and storage.

```typescript
import { JwtTokenManager, TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage();
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// Check if token needs refresh
if (tokenManager.isRefreshNeeded) {
  await tokenManager.refresh();
}

// Check if token can be refreshed
if (tokenManager.isRefreshable) {
  // Token has valid refresh token
}

// Get current token
const currentToken = tokenManager.currentToken;
```

### TokenStorage

Secure token storage with localStorage backend and cross-tab synchronization.

```typescript
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage('custom-prefix');

// Store composite token (sign in)
tokenStorage.signIn({
  accessToken: 'eyJ...',
  refreshToken: 'eyJ...',
});

// Check authentication status
if (tokenStorage.authenticated) {
  const currentUser = tokenStorage.currentUser;
  console.log('Logged in as:', currentUser?.sub);
}

// Sign out (clear token)
tokenStorage.signOut();

// Direct operations
tokenStorage.set(new JwtCompositeToken(compositeToken, earlyPeriod));
tokenStorage.get();
tokenStorage.remove();
```

### TokenRefresher Interface

```typescript
import type { TokenRefresher, CompositeToken } from '@ahoo-wang/fetcher-cosec';

const tokenRefresher: TokenRefresher = {
  refresh: async (token: CompositeToken): Promise<CompositeToken> => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },
};
```

### Resilient Token Refresher with Retry

```typescript
class ResilientTokenRefresher implements TokenRefresher {
  private maxRetries = 3;
  private baseDelay = 1000;

  async refresh(token: CompositeToken): Promise<CompositeToken> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * this.baseDelay;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const newTokens = await response.json();
        return {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        };
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Response && [401, 403].includes(error.status)) {
          throw error;
        }
      }
    }

    throw lastError!;
  }
}
```

---

## DeviceIdStorage

Manages persistent device identification with localStorage and cross-tab synchronization.

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

const deviceStorage = new DeviceIdStorage('optional-prefix');

// Get existing or generate new device ID
const deviceId = await deviceStorage.getOrCreate();

// Set specific device ID
deviceStorage.set('custom-device-id');

// Get current device ID (may be null if not set)
const currentId = deviceStorage.get();

// Clear stored device ID
deviceStorage.clear();

// Generate without storing
const newId = deviceStorage.generateDeviceId();
```

**Headers Added:**
- `CoSec-Device-Id: <device-id>`

---

## AuthorizationRequestInterceptor

Adds JWT Bearer token authentication headers to outgoing requests.

```typescript
import { AuthorizationRequestInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({
    tokenManager,
  }),
);
```

**Headers Added:**
- `Authorization: Bearer <access-token>`

**Behavior:**
1. Checks if Authorization header is already present (skips if so)
2. Refreshes token if needed and refreshable
3. Adds Bearer token to request

---

## AuthorizationResponseInterceptor

Handles automatic token refresh when receiving 401 Unauthorized responses.

```typescript
import { AuthorizationResponseInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({
    tokenManager,
  }),
);
```

**Behavior:**
1. Detects 401 responses
2. Attempts token refresh using configured TokenRefresher
3. Retries original request with new token
4. On refresh failure: clears tokens and throws `RefreshTokenError`

---

## Automatic Token Refresh on 401

The token refresh flow works as follows:

```
1. Request sent with Bearer token
2. Server returns 401 (token expired)
3. AuthorizationResponseInterceptor intercepts
4. Calls tokenManager.refresh()
5. TokenRefresher.refresh() exchanges refresh token for new tokens
6. New tokens stored in TokenStorage
7. Original request retried with new Bearer token
8. Success: response returned to caller
9. Failure: tokens cleared, error propagated
```

### Skip Token Refresh for Specific Requests

```typescript
import { IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY } from '@ahoo-wang/fetcher-cosec';

fetcher.get('/api/public-data', {
  attributes: {
    [IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY]: true,
  },
});
```

---

## SpaceIdProvider (Multi-Tenant Support)

Enables resource isolation within tenant spaces for multi-tenant applications.

### Interface

```typescript
import type { SpaceIdProvider } from '@ahoo-wang/fetcher-cosec';
import type { FetchExchange } from '@ahoo-wang/fetcher';

const spaceIdProvider: SpaceIdProvider = {
  resolveSpaceId: (exchange: FetchExchange): string | null => {
    // Extract from header
    return exchange.request.headers['X-Current-Space'] || null;

    // Or from URL path
    // const match = exchange.request.url.match(/\/spaces\/([^\/]+)/);
    // return match ? match[1] : null;
  },
};
```

### DefaultSpaceIdProvider

Combines predicate-based filtering with persistent storage.

```typescript
import { DefaultSpaceIdProvider, SpaceIdStorage } from '@ahoo-wang/fetcher-cosec';

const spaceStorage = new SpaceIdStorage();

const spaceIdProvider = new DefaultSpaceIdProvider({
  spacedResourcePredicate: {
    test: (exchange) => exchange.request.url.includes('/spaces/'),
  },
  spaceIdStorage: spaceStorage,
});
```

### NoneSpaceIdProvider (Default)

```typescript
import { NoneSpaceIdProvider } from '@ahoo-wang/fetcher-cosec';

// Use when space identification is not required
const configurer = new CoSecConfigurer({
  appId: 'my-app',
  spaceIdProvider: NoneSpaceIdProvider, // Default
});
```

---

## Error Handling

### UnauthorizedErrorInterceptor (401)

Handles authentication failures with custom callback logic.

```typescript
import { UnauthorizedErrorInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.error.use(
  new UnauthorizedErrorInterceptor({
    onUnauthorized: (exchange) => {
      console.log('Authentication failed for:', exchange.request.url);
      tokenStorage.signOut();
      window.location.href = '/login';
    },
  }),
);
```

**Triggers on:**
- HTTP 401 responses
- `RefreshTokenError` exceptions (refresh token invalid/expired)

### ForbiddenErrorInterceptor (403)

Handles authorization failures with custom callback logic.

```typescript
import { ForbiddenErrorInterceptor } from '@ahoo-wang/fetcher-cosec';

fetcher.interceptors.error.use(
  new ForbiddenErrorInterceptor({
    onForbidden: (exchange) => {
      console.log('Access forbidden for:', exchange.request.url);
      alert('You do not have permission to access this resource');
    },
  }),
);
```

**Triggers on:**
- HTTP 403 responses

---

## Multi-Tenant Setup Example

```typescript
class TenantRegistry {
  private fetchers = new Map<string, Fetcher>();

  getFetcher(tenantId: string, config: TenantConfig): Fetcher {
    if (this.fetchers.has(tenantId)) {
      return this.fetchers.get(tenantId)!;
    }

    const fetcher = new Fetcher({ baseURL: config.baseURL });

    const configurer = new CoSecConfigurer({
      appId: config.appId,
      tokenStorage: new TokenStorage(`tenant-${tenantId}`),
      deviceIdStorage: new DeviceIdStorage(`tenant-${tenantId}`),
      tokenRefresher: {
        refresh: async (token) => {
          const response = await fetch(`${config.baseURL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': tenantId,
            },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
          });
          return response.json();
        },
      },
      onUnauthorized: () => this.logoutTenant(tenantId),
    });

    configurer.applyTo(fetcher);
    this.fetchers.set(tenantId, fetcher);
    return fetcher;
  }

  async logoutTenant(tenantId: string): Promise<void> {
    const fetcher = this.fetchers.get(tenantId);
    if (fetcher) {
      const tokenStorage = new TokenStorage(`tenant-${tenantId}`);
      tokenStorage.signOut();
      this.fetchers.delete(tenantId);
    }
  }
}
```

---

## Headers Summary

| Header | Description | Added By |
|--------|-------------|----------|
| `CoSec-App-Id` | Application identifier | `CoSecRequestInterceptor` |
| `CoSec-Device-Id` | Device identifier | `CoSecRequestInterceptor` |
| `CoSec-Request-Id` | Unique request ID | `CoSecRequestInterceptor` |
| `CoSec-Space-Id` | Space/tenant identifier | `CoSecRequestInterceptor` (when configured) |
| `Authorization` | Bearer token | `AuthorizationRequestInterceptor` |

---

## Complete Example

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

new CoSecConfigurer({
  appId: 'my-enterprise-app',

  // Storage (optional - defaults work fine)
  tokenStorage: new TokenStorage(),
  deviceIdStorage: new DeviceIdStorage(),

  // Token refresh
  tokenRefresher: {
    refresh: async (token) => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    },
  },

  // Error handlers
  onUnauthorized: (exchange) => {
    window.location.href = '/login?reason=session_expired';
  },
  onForbidden: (exchange) => {
    alert('Access denied');
  },
}).applyTo(fetcher);

// All requests now include:
// - CoSec-App-Id, CoSec-Device-Id, CoSec-Request-Id headers
// - Authorization: Bearer <token>
// - Automatic 401 token refresh and retry
// - Custom 401/403 error handling

const data = await fetcher.get('/api/protected-resource');
```

---

## Key Classes and Exports

| Class | Purpose |
|-------|---------|
| `CoSecConfigurer` | Simplified configuration for all CoSec features |
| `AuthorizationRequestInterceptor` | Adds Bearer token to requests |
| `AuthorizationResponseInterceptor` | Handles 401 and retries with fresh token |
| `CoSecRequestInterceptor` | Adds CoSec headers (appId, deviceId, requestId) |
| `ResourceAttributionRequestInterceptor` | Adds tenant/owner path parameters |
| `UnauthorizedErrorInterceptor` | Custom 401 error handling |
| `ForbiddenErrorInterceptor` | Custom 403 error handling |
| `JwtTokenManager` | Token lifecycle management |
| `TokenStorage` | JWT token persistence |
| `DeviceIdStorage` | Device ID persistence and generation |
| `SpaceIdProvider` | Multi-tenant space resolution |

---

## Related Documentation

- Package: `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/packages/cosec/README.md`
- Integration Test: `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/integration-test/src/cosec/cosec.ts`
- Source Files: `/Users/ahoo/work/ahoo-git/agent-coder/fetcher/packages/cosec/src/`