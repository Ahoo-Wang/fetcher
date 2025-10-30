# @ahoo-wang/fetcher-cosec

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-cosec.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/?path=/docs/cosec-introduction--docs)

Enterprise-grade CoSec authentication integration for the Fetcher HTTP client with comprehensive security features including automatic token management, device tracking, and request attribution.

[CoSec](https://github.com/Ahoo-Wang/CoSec) is a comprehensive authentication and authorization framework designed for enterprise applications.

This package provides seamless integration between the Fetcher HTTP client and the CoSec authentication framework, enabling secure API communication with minimal configuration.

## 🌟 Features

- **🔐 Automatic Authentication**: Seamless CoSec authentication with automatic header injection
- **📱 Device Management**: Persistent device ID management with localStorage and fallback support
- **🔄 Token Refresh**: Intelligent token refresh based on 401 responses with retry logic
- **🌈 Request Attribution**: Unique request ID generation for comprehensive API tracking
- **💾 Secure Token Storage**: Encrypted JWT token storage with configurable backends
- **🛡️ Enterprise Security**: Multi-tenant support, rate limiting, and security monitoring
- **⚡ Performance Optimized**: Minimal overhead with connection pooling and caching
- **🛠️ TypeScript First**: Complete type definitions with strict type safety
- **🔌 Pluggable Architecture**: Modular design for easy integration and customization

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher-cosec

# Using pnpm
pnpm add @ahoo-wang/fetcher-cosec

# Using yarn
yarn add @ahoo-wang/fetcher-cosec
```

### Basic Setup

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  CompositeToken,
  TokenRefresher,
} from '@ahoo-wang/fetcher-cosec';

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Create storage instances
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// Create token refresher
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    // Implement your token refresh logic
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
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

// Create JWT token manager
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// Configure CoSec options
const cosecOptions = {
  appId: 'your-app-id',
  tokenManager,
  deviceIdStorage,
};

// Add CoSec request interceptor
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor(cosecOptions),
);

// Add CoSec response interceptor
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor(cosecOptions),
);
```

## 🔧 Configuration

### CoSecOptions Interface

```typescript
interface CoSecOptions
  extends AppIdCapable,
    DeviceIdStorageCapable,
    JwtTokenManagerCapable {
  // Inherits from capability interfaces
}
```

The `CoSecOptions` interface combines several capability interfaces:

```typescript
interface AppIdCapable {
  /**
   * Application ID to be sent in the CoSec-App-Id header
   */
  appId: string;
}

interface DeviceIdStorageCapable {
  /**
   * Device ID storage instance for managing device identification
   */
  deviceIdStorage: DeviceIdStorage;
}

interface JwtTokenManagerCapable {
  /**
   * JWT token manager for handling token operations
   */
  tokenManager: JwtTokenManager;
}
```

### Headers Added

The interceptor automatically adds the following headers to requests:

1. `CoSec-Device-Id`: Device identifier (stored in localStorage or generated)
2. `CoSec-App-Id`: Application identifier
3. `Authorization`: Bearer token
4. `CoSec-Request-Id`: Unique request identifier for each request

## 📚 API Reference

### Core Classes

#### AuthorizationRequestInterceptor

Automatically adds CoSec authentication headers to outgoing HTTP requests.

```typescript
const interceptor = new AuthorizationRequestInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceIdStorage,
});
```

**Headers Added:**

- `Authorization: Bearer <access-token>`
- `CoSec-App-Id: <app-id>`
- `CoSec-Device-Id: <device-id>`
- `CoSec-Request-Id: <unique-request-id>`

#### AuthorizationResponseInterceptor

Handles automatic token refresh when receiving 401 Unauthorized responses.

```typescript
const interceptor = new AuthorizationResponseInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceIdStorage,
});
```

**Features:**

- Automatic retry with refreshed tokens
- Exponential backoff for failed refresh attempts
- Configurable retry limits

#### JwtTokenManager

Manages JWT token lifecycle including validation, refresh, and storage.

```typescript
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// Check if token is valid
const isValid = await tokenManager.isValid();

// Refresh token manually
await tokenManager.refresh();

// Get current token
const token = tokenManager.getToken();
```

#### TokenStorage

Secure token storage with localStorage backend and fallback support.

```typescript
const tokenStorage = new TokenStorage('optional-prefix');

// Store composite token
tokenStorage.set({
  accessToken: 'eyJ...',
  refreshToken: 'eyJ...',
});

// Retrieve token
const token = tokenStorage.get();

// Remove stored token
tokenStorage.remove();

// Check if token exists
const exists = tokenStorage.exists();
```

#### DeviceIdStorage

Manages persistent device identification with localStorage.

```typescript
const deviceStorage = new DeviceIdStorage('optional-prefix');

// Get or create device ID
const deviceId = await deviceStorage.getOrCreate();

// Set specific device ID
deviceStorage.set('custom-device-id');

// Get current device ID
const currentId = deviceStorage.get();

// Clear stored device ID
deviceStorage.clear();

// Generate new device ID without storing
const newId = deviceStorage.generateDeviceId();
```

#### TokenRefresher

Interface for implementing custom token refresh logic.

```typescript
interface TokenRefresher {
  refresh(token: CompositeToken): Promise<CompositeToken>;
}

class CustomTokenRefresher implements TokenRefresher {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const newTokens = await response.json();
    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }
}
```

### Interfaces & Types

#### Token Types

```typescript
interface AccessToken {
  readonly value: string;
}

interface RefreshToken {
  readonly value: string;
}

interface CompositeToken {
  readonly accessToken: string;
  readonly refreshToken: string;
}
```

#### JWT Token Types

```typescript
interface JwtPayload {
  readonly sub?: string;
  readonly exp?: number;
  readonly iat?: number;
  readonly iss?: string;
  [key: string]: any;
}

interface JwtToken {
  readonly header: JwtHeader;
  readonly payload: JwtPayload;
  readonly signature: string;
  readonly raw: string;
}
```

#### Configuration Types

```typescript
interface CoSecOptions
  extends AppIdCapable,
    DeviceIdStorageCapable,
    JwtTokenManagerCapable {}

interface AppIdCapable {
  readonly appId: string;
}

interface DeviceIdStorageCapable {
  readonly deviceIdStorage: DeviceIdStorage;
}

interface JwtTokenManagerCapable {
  readonly tokenManager: JwtTokenManager;
}
```

#### Response Types

```typescript
interface AuthorizeResult {
  readonly authorized: boolean;
  readonly reason: string;
}

// Predefined authorization results
const AuthorizeResults = {
  ALLOW: { authorized: true, reason: 'Allow' },
  EXPLICIT_DENY: { authorized: false, reason: 'Explicit Deny' },
  IMPLICIT_DENY: { authorized: false, reason: 'Implicit Deny' },
  TOKEN_EXPIRED: { authorized: false, reason: 'Token Expired' },
  TOO_MANY_REQUESTS: { authorized: false, reason: 'Too Many Requests' },
} as const;
```

## 🔗 Built-in Interceptors

The CoSec package provides several specialized interceptors for different authentication and authorization scenarios:

### Request Interceptors

#### AuthorizationRequestInterceptor

**Purpose**: Adds JWT Bearer token authentication headers to outgoing requests.

**Headers Added**:

- `Authorization: Bearer <access-token>`

**Use Case**: Standard JWT authentication for API requests.

```typescript
const interceptor = new AuthorizationRequestInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceStorage,
});
```

#### CoSecRequestInterceptor

**Purpose**: Adds basic CoSec identification headers to requests.

**Headers Added**:

- `CoSec-App-Id: <app-id>`
- `CoSec-Device-Id: <device-id>`
- `CoSec-Request-Id: <unique-request-id>`

**Use Case**: Device tracking and request attribution without full JWT authentication.

```typescript
const interceptor = new CoSecRequestInterceptor({
  appId: 'your-app-id',
  deviceIdStorage: deviceStorage,
});
```

#### ResourceAttributionRequestInterceptor

**Purpose**: Automatically injects tenant and owner ID path parameters from JWT token claims.

**Functionality**: Extracts `tenantId` and `sub` (owner ID) from JWT payload and adds them to URL path parameters.

**Use Case**: Multi-tenant applications with tenant-scoped resources.

```typescript
const interceptor = new ResourceAttributionRequestInterceptor({
  tenantId: 'tenantId', // Path parameter name for tenant ID
  ownerId: 'ownerId', // Path parameter name for owner ID
  tokenStorage: tokenStorage,
});
```

### Response Interceptors

#### AuthorizationResponseInterceptor

**Purpose**: Handles automatic token refresh when receiving 401 Unauthorized responses.

**Functionality**:

- Detects 401 responses
- Attempts token refresh using configured TokenRefresher
- Retries original request with new token
- Exponential backoff for failed refresh attempts

**Use Case**: Seamless token refresh without user intervention.

```typescript
const interceptor = new AuthorizationResponseInterceptor({
  appId: 'your-app-id',
  tokenManager: jwtTokenManager,
  deviceIdStorage: deviceStorage,
});
```

### Error Interceptors

#### UnauthorizedErrorInterceptor

**Purpose**: Provides centralized handling of authentication failures with custom callback logic.

**Functionality**:

- Detects 401 responses and RefreshTokenError exceptions
- Invokes custom callback for error handling
- Allows applications to implement login redirects, token cleanup, etc.

**Use Case**: Custom authentication error handling and user experience flows.

```typescript
const interceptor = new UnauthorizedErrorInterceptor({
  onUnauthorized: exchange => {
    console.log('Authentication failed for:', exchange.request.url);
    // Redirect to login or show error message
    window.location.href = '/login';
  },
});
```

#### ForbiddenErrorInterceptor

**Purpose**: Provides centralized handling of authorization failures (403 Forbidden) with custom callback logic.

**Functionality**:

- Detects 403 Forbidden responses
- Invokes custom callback for permission error handling
- Allows applications to implement access request flows, permission displays, etc.

**Use Case**: Custom authorization error handling, permission management, and user guidance.

```typescript
const interceptor = new ForbiddenErrorInterceptor({
  onForbidden: async exchange => {
    console.log('Access forbidden for:', exchange.request.url);
    // Show permission error or redirect to access request page
    showPermissionError('You do not have permission to access this resource');
  },
});
```

### Interceptor Order & Execution

Interceptors execute in the following default order:

1. **Request Phase**:
   - `AuthorizationRequestInterceptor` (adds Bearer token)
   - `CoSecRequestInterceptor` (adds CoSec headers)
   - `ResourceAttributionRequestInterceptor` (adds path parameters)

2. **Response Phase**:
   - `AuthorizationResponseInterceptor` (handles token refresh)

3. **Error Phase**:
   - `UnauthorizedErrorInterceptor` (handles 401 auth errors)
   - `ForbiddenErrorInterceptor` (handles 403 permission errors)

**Note**: Interceptor execution order can be customized using the `order` property. Higher order values execute later in the chain.

## 🛠️ Examples

### Complete Authentication Setup

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Create storage instances
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// Implement token refresher
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },
};

// Create JWT token manager
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// Create fetcher with CoSec interceptors
const secureFetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Add request interceptor for authentication headers
secureFetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({
    appId: 'my-app-id',
    tokenManager,
    deviceIdStorage,
  }),
);

// Add response interceptor for token refresh
secureFetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({
    appId: 'my-app-id',
    tokenManager,
    deviceIdStorage,
  }),
);

// Now all requests will be automatically authenticated
const userProfile = await secureFetcher.get('/api/user/profile');
const userPosts = await secureFetcher.get('/api/user/posts');
```

### Advanced Token Refresh with Retry Logic

```typescript
import {
  TokenRefresher,
  CompositeToken,
  JwtTokenManager,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

class ResilientTokenRefresher implements TokenRefresher {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  async refresh(token: CompositeToken): Promise<CompositeToken> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Exponential backoff with jitter
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * this.baseDelay;
          const jitter = Math.random() * 0.1 * delay;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Retry-Attempt': attempt.toString(),
          },
          body: JSON.stringify({
            refreshToken: token.refreshToken,
            deviceId: await this.getDeviceId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newTokens = await response.json();

        // Validate token structure
        if (!newTokens.accessToken || !newTokens.refreshToken) {
          throw new Error('Invalid token response structure');
        }

        return {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Token refresh attempt ${attempt}/${this.maxRetries} failed:`,
          error,
        );

        // Don't retry on authentication errors (401/403)
        if (error instanceof Response) {
          const status = error.status;
          if (status === 401 || status === 403) {
            throw error;
          }
        }

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }
      }
    }

    throw lastError!;
  }

  private async getDeviceId(): Promise<string> {
    // Implementation to get current device ID
    const deviceStorage = new DeviceIdStorage();
    return await deviceStorage.getOrCreate();
  }
}

// Usage
const tokenStorage = new TokenStorage();
const tokenRefresher = new ResilientTokenRefresher();
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);
```

### Multi-Tenant Authentication

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Tenant configuration interface
interface TenantConfig {
  id: string;
  name: string;
  appId: string;
  baseURL: string;
  refreshEndpoint: string;
  tokenStoragePrefix?: string;
}

// Tenant registry for managing multiple tenants
class TenantRegistry {
  private tenants = new Map<string, TenantConfig>();
  private fetchers = new Map<string, Fetcher>();

  registerTenant(config: TenantConfig): void {
    // Use tenant ID as storage prefix for isolation
    const storagePrefix = config.tokenStoragePrefix || `tenant-${config.id}`;
    config.tokenStoragePrefix = storagePrefix;
    this.tenants.set(config.id, config);
  }

  getFetcher(tenantId: string): Fetcher {
    if (this.fetchers.has(tenantId)) {
      return this.fetchers.get(tenantId)!;
    }

    const config = this.tenants.get(tenantId);
    if (!config) {
      throw new Error(`Tenant '${tenantId}' not registered`);
    }

    const fetcher = this.createTenantFetcher(config);
    this.fetchers.set(tenantId, fetcher);
    return fetcher;
  }

  private createTenantFetcher(config: TenantConfig): Fetcher {
    const fetcher = new Fetcher({
      baseURL: config.baseURL,
    });

    // Isolated storage per tenant
    const tokenStorage = new TokenStorage(config.tokenStoragePrefix);
    const deviceStorage = new DeviceIdStorage(config.tokenStoragePrefix);

    // Tenant-specific token refresher
    const tokenRefresher: TokenRefresher = {
      async refresh(token: CompositeToken): Promise<CompositeToken> {
        const response = await fetch(
          `${config.baseURL}${config.refreshEndpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': config.id,
            },
            body: JSON.stringify({
              refreshToken: token.refreshToken,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Token refresh failed for tenant ${config.id}`);
        }

        const tokens = await response.json();
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      },
    };

    const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

    // Add CoSec interceptors with tenant context
    fetcher.interceptors.request.use(
      new AuthorizationRequestInterceptor({
        appId: config.appId,
        tokenManager,
        deviceIdStorage: deviceStorage,
      }),
    );

    fetcher.interceptors.response.use(
      new AuthorizationResponseInterceptor({
        appId: config.appId,
        tokenManager,
        deviceIdStorage: deviceStorage,
      }),
    );

    return fetcher;
  }

  // Cleanup method for tenant logout
  async logoutTenant(tenantId: string): Promise<void> {
    const config = this.tenants.get(tenantId);
    if (config) {
      const tokenStorage = new TokenStorage(config.tokenStoragePrefix);
      tokenStorage.remove();

      const deviceStorage = new DeviceIdStorage(config.tokenStoragePrefix);
      deviceStorage.clear();

      this.fetchers.delete(tenantId);
    }
  }
}

// Usage example
const tenantRegistry = new TenantRegistry();

// Register multiple tenants
tenantRegistry.registerTenant({
  id: 'enterprise-a',
  name: 'Enterprise A',
  appId: 'app-enterprise-a',
  baseURL: 'https://api.enterprise-a.com',
  refreshEndpoint: '/auth/refresh',
});

tenantRegistry.registerTenant({
  id: 'enterprise-b',
  name: 'Enterprise B',
  appId: 'app-enterprise-b',
  baseURL: 'https://api.enterprise-b.com',
  refreshEndpoint: '/auth/refresh',
});

// Use tenant-specific fetchers
const tenantAFetcher = tenantRegistry.getFetcher('enterprise-a');
const tenantBFetcher = tenantRegistry.getFetcher('enterprise-b');

// Each tenant maintains completely isolated authentication
const profileA = await tenantAFetcher.get('/user/profile');
const profileB = await tenantBFetcher.get('/user/profile');

// Logout specific tenant
await tenantRegistry.logoutTenant('enterprise-a');
```

### Comprehensive Error Handling and Recovery

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  TokenStorage,
  DeviceIdStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Enhanced authentication error handler
class AuthErrorHandler {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  static async handleAuthError(
    error: any,
    tokenManager: JwtTokenManager,
    context?: { endpoint?: string; attempt?: number },
  ): Promise<boolean> {
    // Returns true if error was handled
    const status = error.status || error.response?.status;
    const attempt = context?.attempt || 1;

    switch (status) {
      case 401: // Unauthorized - token expired or invalid
        console.warn('Authentication token expired or invalid');
        await this.handleTokenExpiration(tokenManager);
        return true;

      case 403: // Forbidden - insufficient permissions
        console.error('Access forbidden - insufficient permissions');
        this.handleForbiddenAccess(error, context?.endpoint);
        return true;

      case 429: // Too Many Requests - rate limited
        console.warn('Rate limited - implementing backoff strategy');
        await this.handleRateLimit(attempt);
        return true;

      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
      case 504: // Gateway Timeout
        console.warn(`Server error (${status}) - retrying with backoff`);
        await this.handleServerError(attempt);
        return attempt < this.MAX_RETRY_ATTEMPTS;

      default:
        // Network errors, CORS issues, etc.
        console.error('Authentication network error:', error);
        return this.handleNetworkError(error, attempt);
    }
  }

  private static async handleTokenExpiration(
    tokenManager: JwtTokenManager,
  ): Promise<void> {
    try {
      // Clear expired tokens
      tokenManager.tokenStorage.remove();

      // Attempt refresh if refresh token exists
      const currentToken = tokenManager.getToken();
      if (currentToken?.refreshToken) {
        await tokenManager.refresh();
      } else {
        // No refresh token - redirect to login
        this.redirectToLogin('token_expired');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      this.redirectToLogin('refresh_failed');
    }
  }

  private static handleForbiddenAccess(error: any, endpoint?: string): void {
    // Log security event
    console.error(`Forbidden access to ${endpoint}:`, error);

    // Show user-friendly error message
    this.showErrorNotification(
      'Access Denied',
      'You do not have permission to access this resource.',
    );

    // Optionally redirect to appropriate page
    // window.location.href = '/access-denied';
  }

  private static async handleRateLimit(attempt: number): Promise<void> {
    const delay = Math.min(
      this.RETRY_DELAY_MS * Math.pow(2, attempt - 1),
      30000, // Max 30 seconds
    );

    console.log(`Rate limited - waiting ${delay}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private static async handleServerError(attempt: number): Promise<void> {
    const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    console.log(`Server error - retrying in ${delay}ms (attempt ${attempt})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private static handleNetworkError(error: any, attempt: number): boolean {
    // Check if it's a network connectivity issue
    if (!navigator.onLine) {
      console.warn('Network offline - queuing request for retry');
      // Could implement request queuing here
      return true; // Allow retry when back online
    }

    // CORS or other network errors
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      console.error('CORS error - check server configuration');
      return false; // Don't retry CORS errors
    }

    // Allow retry for other network errors up to max attempts
    return attempt < this.MAX_RETRY_ATTEMPTS;
  }

  private static redirectToLogin(reason: string): void {
    const loginUrl = `/login?reason=${reason}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
    window.location.href = loginUrl;
  }

  private static showErrorNotification(title: string, message: string): void {
    // Implementation depends on your notification system
    console.error(`${title}: ${message}`);
    // Example: show toast notification
    // toast.error(message, { title });
  }
}

// Create resilient fetcher with comprehensive error handling
function createResilientFetcher(
  baseURL: string,
  tokenRefresher: TokenRefresher,
) {
  const fetcher = new Fetcher({ baseURL });

  const tokenManager = new JwtTokenManager(new TokenStorage(), tokenRefresher);

  const deviceStorage = new DeviceIdStorage();

  // Add response interceptor with error recovery
  fetcher.interceptors.response.use(
    new AuthorizationResponseInterceptor({
      appId: 'your-app-id',
      tokenManager,
      deviceIdStorage: deviceStorage,
    }),
    // Global error handler
    {
      onRejected: async error => {
        const wasHandled = await AuthErrorHandler.handleAuthError(
          error,
          tokenManager,
          { endpoint: error.config?.url },
        );

        if (!wasHandled) {
          throw error; // Re-throw unhandled errors
        }

        // For handled errors, return a resolved promise to prevent rejection
        return Promise.resolve();
      },
    },
  );

  return { fetcher, tokenManager };
}

// Usage
const { fetcher, tokenManager } = createResilientFetcher(
  'https://api.example.com',
  yourTokenRefresher,
);

// All requests now have automatic error handling and recovery
try {
  const data = await fetcher.get('/protected/resource');
} catch (error) {
  // Only unhandled errors will reach here
  console.error('Unhandled error:', error);
}
```

### Performance Monitoring and Optimization

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  TokenStorage,
  DeviceIdStorage,
  JwtTokenManager,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Comprehensive authentication performance monitor
class AuthPerformanceMonitor {
  private metrics = {
    // Token operations
    tokenRefreshCount: 0,
    tokenRefreshTotalTime: 0,
    tokenRefreshAverageTime: 0,
    tokenRefreshSuccessRate: 1.0,

    // Storage operations
    storageReadCount: 0,
    storageWriteCount: 0,
    storageReadTime: 0,
    storageWriteTime: 0,

    // Interceptor performance
    requestInterceptorOverhead: 0,
    responseInterceptorOverhead: 0,
    totalRequests: 0,

    // Device operations
    deviceIdGenerationTime: 0,
    deviceIdReadTime: 0,

    // Error tracking
    errorCount: 0,
    retryCount: 0,

    // Cache performance
    cacheHitRate: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private startTimes = new Map<string, number>();

  // Token refresh monitoring
  startTokenRefresh(operationId: string): void {
    this.startTimes.set(`refresh-${operationId}`, performance.now());
  }

  endTokenRefresh(operationId: string, success: boolean): void {
    const startTime = this.startTimes.get(`refresh-${operationId}`);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.tokenRefreshCount++;
      this.metrics.tokenRefreshTotalTime += duration;
      this.metrics.tokenRefreshAverageTime =
        this.metrics.tokenRefreshTotalTime / this.metrics.tokenRefreshCount;

      if (!success) {
        this.metrics.tokenRefreshSuccessRate =
          ((this.metrics.tokenRefreshCount - 1) /
            this.metrics.tokenRefreshCount) *
          this.metrics.tokenRefreshSuccessRate;
      }

      this.startTimes.delete(`refresh-${operationId}`);
      this.reportMetric('token_refresh_duration', duration);
    }
  }

  // Storage operation monitoring
  recordStorageOperation(operation: 'read' | 'write', duration: number): void {
    if (operation === 'read') {
      this.metrics.storageReadCount++;
      this.metrics.storageReadTime += duration;
    } else {
      this.metrics.storageWriteCount++;
      this.metrics.storageWriteTime += duration;
    }
  }

  // Interceptor overhead monitoring
  recordInterceptorOverhead(
    type: 'request' | 'response',
    duration: number,
  ): void {
    if (type === 'request') {
      this.metrics.requestInterceptorOverhead += duration;
    } else {
      this.metrics.responseInterceptorOverhead += duration;
    }
    this.metrics.totalRequests++;
  }

  // Device operation monitoring
  recordDeviceOperation(
    operation: 'generate' | 'read',
    duration: number,
  ): void {
    if (operation === 'generate') {
      this.metrics.deviceIdGenerationTime += duration;
    } else {
      this.metrics.deviceIdReadTime += duration;
    }
  }

  // Error and retry tracking
  recordError(): void {
    this.metrics.errorCount++;
  }

  recordRetry(): void {
    this.metrics.retryCount++;
  }

  // Cache performance
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? this.metrics.cacheHits / total : 0;
  }

  // Reporting
  private reportMetric(name: string, value: number): void {
    // Send to monitoring service (e.g., DataDog, New Relic, etc.)
    console.log(`[AuthPerf] ${name}: ${value.toFixed(2)}ms`);

    // Threshold alerts
    if (name === 'token_refresh_duration' && value > 5000) {
      console.warn(
        `[AuthPerf] Slow token refresh detected: ${value.toFixed(2)}ms`,
      );
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      // Calculated fields
      averageStorageReadTime:
        this.metrics.storageReadCount > 0
          ? this.metrics.storageReadTime / this.metrics.storageReadCount
          : 0,
      averageStorageWriteTime:
        this.metrics.storageWriteCount > 0
          ? this.metrics.storageWriteTime / this.metrics.storageWriteCount
          : 0,
      averageRequestOverhead:
        this.metrics.totalRequests > 0
          ? this.metrics.requestInterceptorOverhead / this.metrics.totalRequests
          : 0,
      averageResponseOverhead:
        this.metrics.totalRequests > 0
          ? this.metrics.responseInterceptorOverhead /
            this.metrics.totalRequests
          : 0,
    };
  }

  reset(): void {
    // Reset counters but keep averages
    this.metrics.tokenRefreshCount = 0;
    this.metrics.tokenRefreshTotalTime = 0;
    this.metrics.storageReadCount = 0;
    this.metrics.storageWriteCount = 0;
    this.metrics.storageReadTime = 0;
    this.metrics.storageWriteTime = 0;
    this.metrics.totalRequests = 0;
    this.metrics.requestInterceptorOverhead = 0;
    this.metrics.responseInterceptorOverhead = 0;
    this.metrics.errorCount = 0;
    this.metrics.retryCount = 0;
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }
}

// Enhanced token refresher with performance monitoring
class MonitoredTokenRefresher implements TokenRefresher {
  constructor(
    private baseRefresher: TokenRefresher,
    private monitor: AuthPerformanceMonitor,
  ) {}

  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const operationId = `refresh-${Date.now()}-${Math.random()}`;
    this.monitor.startTokenRefresh(operationId);

    try {
      const result = await this.baseRefresher.refresh(token);
      this.monitor.endTokenRefresh(operationId, true);
      return result;
    } catch (error) {
      this.monitor.endTokenRefresh(operationId, false);
      this.monitor.recordError();
      throw error;
    }
  }
}

// Enhanced storage with performance monitoring
class MonitoredTokenStorage extends TokenStorage {
  constructor(
    private baseStorage: TokenStorage,
    private monitor: AuthPerformanceMonitor,
  ) {
    super();
  }

  set(token: CompositeToken): void {
    const startTime = performance.now();
    this.baseStorage.set(token);
    const duration = performance.now() - startTime;
    this.monitor.recordStorageOperation('write', duration);
  }

  get(): CompositeToken | null {
    const startTime = performance.now();
    const result = this.baseStorage.get();
    const duration = performance.now() - startTime;
    this.monitor.recordStorageOperation('read', duration);
    return result;
  }

  remove(): void {
    const startTime = performance.now();
    this.baseStorage.remove();
    const duration = performance.now() - startTime;
    this.monitor.recordStorageOperation('write', duration);
  }
}

// Create monitored fetcher
function createMonitoredFetcher(
  baseURL: string,
  baseTokenRefresher: TokenRefresher,
) {
  const monitor = new AuthPerformanceMonitor();

  const tokenStorage = new MonitoredTokenStorage(new TokenStorage(), monitor);

  const tokenRefresher = new MonitoredTokenRefresher(
    baseTokenRefresher,
    monitor,
  );

  const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);
  const deviceStorage = new DeviceIdStorage();

  const fetcher = new Fetcher({ baseURL });

  // Add request interceptor with monitoring
  fetcher.interceptors.request.use(
    new AuthorizationRequestInterceptor({
      appId: 'monitored-app',
      tokenManager,
      deviceIdStorage: deviceStorage,
    }),
    // Monitor request interceptor overhead
    {
      onFulfilled: async config => {
        const startTime = performance.now();
        const result = await config;
        const duration = performance.now() - startTime;
        monitor.recordInterceptorOverhead('request', duration);
        return result;
      },
    },
  );

  // Add response interceptor with monitoring
  fetcher.interceptors.response.use(
    new AuthorizationResponseInterceptor({
      appId: 'monitored-app',
      tokenManager,
      deviceIdStorage: deviceStorage,
    }),
    // Monitor response interceptor overhead
    {
      onFulfilled: async response => {
        const startTime = performance.now();
        const result = await response;
        const duration = performance.now() - startTime;
        monitor.recordInterceptorOverhead('response', duration);
        return result;
      },
    },
  );

  return { fetcher, monitor };
}

// Usage example
const baseTokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  },
};

const { fetcher, monitor } = createMonitoredFetcher(
  'https://api.example.com',
  baseTokenRefresher,
);

// Use the monitored fetcher
await fetcher.get('/user/profile');

// Get performance metrics
setInterval(() => {
  const metrics = monitor.getMetrics();
  console.log('Authentication Performance Metrics:', {
    tokenRefresh: {
      count: metrics.tokenRefreshCount,
      averageTime: `${metrics.tokenRefreshAverageTime.toFixed(2)}ms`,
      successRate: `${(metrics.tokenRefreshSuccessRate * 100).toFixed(1)}%`,
    },
    storage: {
      reads: metrics.storageReadCount,
      writes: metrics.storageWriteCount,
      averageReadTime: `${metrics.averageStorageReadTime.toFixed(2)}ms`,
      averageWriteTime: `${metrics.averageStorageWriteTime.toFixed(2)}ms`,
    },
    interceptors: {
      totalRequests: metrics.totalRequests,
      averageRequestOverhead: `${metrics.averageRequestOverhead.toFixed(2)}ms`,
      averageResponseOverhead: `${metrics.averageResponseOverhead.toFixed(2)}ms`,
    },
    cache: {
      hitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    },
    errors: {
      count: metrics.errorCount,
      retries: metrics.retryCount,
    },
  });
}, 30000); // Report every 30 seconds
```

## 🧪 Testing

The package includes comprehensive test coverage for all components:

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test --coverage

# Run tests in watch mode during development
pnpm test --watch

# Run specific test file
pnpm test tokenStorage.test.ts

# Run integration tests
pnpm test:it
```

### Test Coverage

- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: End-to-end authentication flows
- **Security Tests**: Token validation and security scenarios
- **Performance Tests**: Benchmarking and memory leak detection

### Testing Utilities

```typescript
import {
  createMockJwtToken,
  createExpiredJwtToken,
  MockTokenStorage,
  MockDeviceStorage,
} from '@ahoo-wang/fetcher-cosec/test-utils';

// Create test tokens
const validToken = createMockJwtToken({ sub: 'user123' });
const expiredToken = createExpiredJwtToken();

// Use mock storage for isolated testing
const tokenStorage = new MockTokenStorage();
const deviceStorage = new MockDeviceStorage();
```

## 🌐 CoSec Framework Integration

This package provides seamless integration with the [CoSec authentication framework](https://github.com/Ahoo-Wang/CoSec), enabling enterprise-grade security features:

### Key Integration Points

- **Centralized Authentication**: Connects to CoSec's authentication server
- **Device Management**: Automatic device registration and tracking
- **Token Lifecycle**: Full JWT token management with refresh capabilities
- **Security Policies**: Enforces CoSec security policies and rules
- **Audit Logging**: Comprehensive request attribution and logging

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│  Fetcher CoSec   │────│     CoSec       │
│                 │    │   Integration    │    │   Framework     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └─ HTTP Requests        └─ Auth Headers         └─ Token Validation
         └─ Response Handling    └─ Token Refresh        └─ Device Tracking
         └─ Error Recovery       └─ Security Policies    └─ Audit Logging
```

For detailed CoSec framework documentation and advanced configuration options, visit the [CoSec GitHub repository](https://github.com/Ahoo-Wang/CoSec).

## 🤝 Contributing

We welcome contributions! Please see our [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for details on:

- **Development Setup**: Getting started with the codebase
- **Code Standards**: TypeScript, linting, and testing guidelines
- **Pull Request Process**: How to submit changes
- **Issue Reporting**: Bug reports and feature requests

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run linting and type checking
pnpm lint
pnpm typecheck

# Run test suite
pnpm test

# Build package
pnpm build
```

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE) for details.

## 🙏 Acknowledgments

- [CoSec Framework](https://github.com/Ahoo-Wang/CoSec) - Enterprise authentication framework
- [Fetcher HTTP Client](https://github.com/Ahoo-Wang/fetcher) - Modern TypeScript HTTP client
- [JWT.io](https://jwt.io) - JWT token standard and tooling

---

<p align="center">
  <strong>Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem</strong>
  <br>
  <sub>Modern HTTP client libraries for TypeScript applications</sub>
</p>
