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
