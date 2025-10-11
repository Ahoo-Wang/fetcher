# @ahoo-wang/fetcher-cosec

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-cosec.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-cosec.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-cosec)](https://www.npmjs.com/package/@ahoo-wang/fetcher-cosec)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

Support for CoSec authentication in Fetcher HTTP client.

[CoSec](https://github.com/Ahoo-Wang/CoSec) is a comprehensive authentication and authorization framework.

This package provides integration between the Fetcher HTTP client and the CoSec authentication framework.

## 🌟 Features

- **🔐 Automatic Authentication**: Automatic CoSec authentication headers
- **📱 Device Management**: Device ID management with localStorage persistence
- **🔄 Token Refresh**: Automatic token refresh based on response codes (401)
- **🌈 Request Tracking**: Unique request ID generation for tracking
- **💾 Token Storage**: Secure token storage management
- **🛡️ TypeScript Support**: Complete TypeScript type definitions
- **🔌 Pluggable Architecture**: Easy to integrate with existing applications

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
  TokenRefresher,
  CompositeToken,
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
    // Refresh token logic here
    const response = await fetcher.fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: token,
    });

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  },
};

// Add CoSec request interceptor
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

// Add CoSec response interceptor
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);
```

## 🔧 Configuration

### CoSecOptions Interface

```typescript
interface CoSecOptions {
  /**
   * Application ID to be sent in the CoSec-App-Id header
   */
  appId: string;

  /**
   * Device ID storage instance
   */
  deviceIdStorage: DeviceIdStorage;

  /**
   * Token storage instance
   */
  tokenStorage: TokenStorage;

  /**
   * Token refresher function
   */
  tokenRefresher: TokenRefresher;
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

Adds CoSec authentication headers to outgoing requests.

```typescript
new AuthorizationRequestInterceptor(options
:
CoSecOptions
)
```

#### AuthorizationResponseInterceptor

Handles token refresh when the server returns status code 401.

```typescript
new AuthorizationResponseInterceptor(options
:
CoSecOptions
)
```

#### TokenStorage

Manages token storage in localStorage.

```typescript
const tokenStorage = new TokenStorage();

// Store tokens
tokenStorage.set({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
});

// Get tokens
const token = tokenStorage.get();

// Clear tokens
tokenStorage.clear();
```

#### DeviceIdStorage

Manages device ID storage in localStorage.

```typescript
const deviceIdStorage = new DeviceIdStorage();

// Get or create a device ID
const deviceId = deviceIdStorage.getOrCreate();

// Store a specific device ID
deviceIdStorage.set('specific-device-id');

// Get the current device ID
const currentDeviceId = deviceIdStorage.get();

// Clear the stored device ID
deviceIdStorage.clear();

// Generate a new device ID (without storing it)
const newDeviceId = deviceIdStorage.generateDeviceId();
```

#### InMemoryStorage

In-memory storage fallback for environments without localStorage.

```typescript
const inMemoryStorage = new InMemoryStorage();
```

### Interfaces

- `AccessToken`: Contains an access token
- `RefreshToken`: Contains a refresh token
- `CompositeToken`: Contains both access and refresh tokens
- `TokenRefresher`: Provides a method to refresh tokens

## 🛠️ Examples

### Complete Authentication Setup

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

// Create storage instances
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// Create token refresher
const tokenRefresher = {
  async refresh(token) {
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

// Create fetcher with CoSec interceptors
const secureFetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

secureFetcher.interceptors.request.use(
  new CoSecRequestInterceptor({
    appId: 'my-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

secureFetcher.interceptors.response.use(
  new CoSecResponseInterceptor({
    appId: 'my-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

// Use the fetcher
const response = await secureFetcher.get('/api/user/profile');
```

### Advanced Token Refresh

```typescript
import { CoSecTokenRefresher } from '@ahoo-wang/fetcher-cosec';

// Custom token refresher with retry logic
class ResilientTokenRefresher extends CoSecTokenRefresher {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add exponential backoff
        if (attempt > 1) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }

        const response = await this.options.fetcher.post<CompositeToken>(
          this.options.endpoint,
          { body: token },
          {
            resultExtractor: ResultExtractors.Json,
            attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]]),
          },
        );

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Token refresh attempt ${attempt} failed:`, error);

        // Don't retry on authentication errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }
      }
    }

    throw lastError!;
  }
}
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
} from '@ahoo-wang/fetcher-cosec';

// Tenant configuration
interface TenantConfig {
  id: string;
  appId: string;
  baseURL: string;
  refreshEndpoint: string;
}

// Create tenant-specific fetcher
function createTenantFetcher(tenant: TenantConfig) {
  const fetcher = new Fetcher({
    baseURL: tenant.baseURL,
  });

  // Tenant-specific storage with prefixed keys
  const tokenStorage = new TokenStorage(`tenant-${tenant.id}`);
  const deviceStorage = new DeviceIdStorage(`tenant-${tenant.id}`);

  // Tenant-specific token refresher
  const tokenRefresher = new CoSecTokenRefresher({
    fetcher,
    endpoint: tenant.refreshEndpoint,
  });

  const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

  // Add interceptors with tenant context
  fetcher.interceptors.request.use(
    new AuthorizationRequestInterceptor({
      tokenManager,
      appId: tenant.appId,
      deviceIdStorage: deviceStorage,
    }),
  );

  fetcher.interceptors.response.use(
    new AuthorizationResponseInterceptor({
      tokenManager,
      appId: tenant.appId,
      deviceIdStorage: deviceStorage,
    }),
  );

  return fetcher;
}

// Usage
const tenantA = createTenantFetcher({
  id: 'tenant-a',
  appId: 'app-a-id',
  baseURL: 'https://api-tenant-a.example.com',
  refreshEndpoint: '/auth/refresh',
});

const tenantB = createTenantFetcher({
  id: 'tenant-b',
  appId: 'app-b-id',
  baseURL: 'https://api-tenant-b.example.com',
  refreshEndpoint: '/auth/refresh',
});

// Each tenant maintains isolated authentication state
const userProfileA = await tenantA.get('/user/profile');
const userProfileB = await tenantB.get('/user/profile');
```

### Error Handling and Recovery

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  TokenStorage,
  DeviceIdStorage,
  JwtTokenManager,
} from '@ahoo-wang/fetcher-cosec';

// Enhanced error handling
class AuthErrorHandler {
  static handleAuthError(error: any, tokenManager: JwtTokenManager) {
    if (error.status === 401) {
      // Token expired - clear stored tokens
      tokenManager.tokenStorage.remove();

      // Redirect to login or trigger re-authentication
      window.location.href = '/login?reason=expired';
    } else if (error.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Access forbidden:', error);
      // Show permission error UI
    } else if (error.status === 429) {
      // Rate limited
      console.warn('Rate limited, retrying after delay...');
      // Implement retry logic
    } else {
      // Network or other errors
      console.error('Authentication error:', error);
    }
  }
}

// Create fetcher with error handling
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const tokenManager = new JwtTokenManager(new TokenStorage(), tokenRefresher);

// Add response interceptor with error handling
fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({
    tokenManager,
    appId: 'your-app-id',
    deviceIdStorage: new DeviceIdStorage(),
  }),
  // Add error handler after auth interceptor
  {
    onRejected: error => {
      AuthErrorHandler.handleAuthError(error, tokenManager);
      throw error; // Re-throw to maintain error chain
    },
  },
);
```

### Performance Monitoring

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  AuthorizationRequestInterceptor,
  TokenStorage,
  JwtTokenManager,
} from '@ahoo-wang/fetcher-cosec';

// Performance monitoring interceptor
class AuthPerformanceMonitor {
  private metrics = {
    tokenRefreshCount: 0,
    averageRefreshTime: 0,
    totalRefreshTime: 0,
    interceptorOverhead: 0,
  };

  recordTokenRefresh(duration: number) {
    this.metrics.tokenRefreshCount++;
    this.metrics.totalRefreshTime += duration;
    this.metrics.averageRefreshTime =
      this.metrics.totalRefreshTime / this.metrics.tokenRefreshCount;

    // Report to monitoring service
    console.log(
      `Token refresh: ${duration}ms (avg: ${this.metrics.averageRefreshTime.toFixed(2)}ms)`,
    );
  }

  recordInterceptorOverhead(duration: number) {
    this.metrics.interceptorOverhead = duration;
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Create performance monitor
const performanceMonitor = new AuthPerformanceMonitor();

// Enhanced token refresher with monitoring
const tokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    const startTime = performance.now();

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const newToken = await response.json();

      const duration = performance.now() - startTime;
      performanceMonitor.recordTokenRefresh(duration);

      return newToken;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordTokenRefresh(duration);
      throw error;
    }
  },
};

// Create fetcher with monitoring
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const tokenManager = new JwtTokenManager(new TokenStorage(), tokenRefresher);

// Add request interceptor with performance monitoring
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({ tokenManager }),
  // Monitor interceptor performance
  {
    onFulfilled: async config => {
      const startTime = performance.now();
      // Process request
      const result = await config;
      const duration = performance.now() - startTime;
      performanceMonitor.recordInterceptorOverhead(duration);
      return result;
    },
  },
);

// Access metrics
console.log('Auth Performance Metrics:', performanceMonitor.getMetrics());
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```

## 🌐 CoSec Framework

This package is designed to work with the [CoSec authentication framework](https://github.com/Ahoo-Wang/CoSec). For more
information about CoSec features and capabilities, please visit
the [CoSec GitHub repository](https://github.com/Ahoo-Wang/CoSec).

## 🤝 Contributing

Contributions are welcome! Please see
the [contributing guide](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

Apache-2.0

---

<p align="center">
  Part of the <a href="https://github.com/Ahoo-Wang/fetcher">Fetcher</a> ecosystem
</p>
