# @ahoo-wang/fetcher-cosec

Support for CoSec authentication in Fetcher HTTP client.

[CoSec](https://github.com/Ahoo-Wang/CoSec) is a comprehensive authentication and authorization framework.

This package provides integration between the Fetcher HTTP client and the CoSec authentication framework.

## Features

- Automatic CoSec authentication headers
- Device ID management with localStorage persistence
- Automatic token refresh based on response codes (401)
- Request ID generation for tracking
- Token storage management

## Installation

```bash
npm install @ahoo-wang/fetcher-cosec
```

## Usage

### Basic Setup

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  TokenRefresher,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Create storage instances
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// Create token refresher
const tokenRefresher: TokenRefresher = {
  async refresh(token: CompositeToken): Promise<CompositeToken> {
    // Refresh token logic here
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  },
};

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Add CoSec request interceptor
fetcher.interceptors.request.use(
  new CoSecRequestInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);

// Add CoSec response interceptor
fetcher.interceptors.response.use(
  new CoSecResponseInterceptor({
    appId: 'your-app-id',
    deviceIdStorage,
    tokenStorage,
    tokenRefresher,
  }),
);
```

### Configuration Options

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

### Token Refresh

The response interceptor automatically handles token refresh when the server returns status code 401. When this happens,
the `tokenRefresher.refresh` function is called to obtain new access and refresh tokens.

### Token Storage

The package includes a `TokenStorage` class for managing tokens in localStorage:

```typescript
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage();

// Store tokens
tokenStorage.set({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
});

// Get tokens
const token = tokenStorage.get();
if (token) {
  console.log('Access token:', token.accessToken);
  console.log('Refresh token:', token.refreshToken);
}

// Clear tokens
tokenStorage.clear();
```

### Device ID Storage

The package includes a `DeviceIdStorage` class for managing device identifiers in localStorage:

```typescript
import { DeviceIdStorage } from '@ahoo-wang/fetcher-cosec';

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

## API

### Interfaces

- `AccessToken`: Contains an access token
- `RefreshToken`: Contains a refresh token
- `CompositeToken`: Contains both access and refresh tokens
- `TokenRefresher`: Provides a method to refresh tokens

### Classes

- `TokenStorage`: Manages token storage in localStorage
- `DeviceIdStorage`: Manages device ID storage in localStorage
- `CoSecRequestInterceptor`: Adds CoSec headers to requests
- `CoSecResponseInterceptor`: Handles token refresh on 401 responses
- `InMemoryStorage`: In-memory storage fallback for environments without localStorage

## CoSec Framework

This package is designed to work with the [CoSec authentication framework](https://github.com/Ahoo-Wang/CoSec). For more
information about CoSec features and capabilities, please visit
the [CoSec GitHub repository](https://github.com/Ahoo-Wang/CoSec).

## License

Apache-2.0
