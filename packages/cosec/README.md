# @ahoo-wang/fetcher-cosec

Support for CoSec authentication in Fetcher HTTP client.

[CoSec](https://github.com/Ahoo-Wang/CoSec) is a comprehensive authentication and authorization framework that provides:

- Fine-grained access control
- Multi-factor authentication
- Token-based authentication with automatic refresh
- Device identification and management
- Audit logging and monitoring

This package provides integration between the Fetcher HTTP client and the CoSec authentication framework.

## Features

- Automatic CoSec authentication headers
- Device ID management with localStorage persistence
- Automatic token refresh based on response codes (401, 403)
- Request ID generation for tracking
- Token storage management

## Installation

```bash
npm install @ahoo-wang/fetcher-cosec
```

## Usage

### Basic Setup

```typescript
import {Fetcher} from '@ahoo-wang/fetcher';
import {
    CoSecRequestInterceptor,
    CoSecResponseInterceptor,
    TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

// Create token storage
const tokenStorage = new TokenStorage();

// Create a Fetcher instance
const fetcher = new Fetcher({
    baseURL: 'https://api.example.com',
});

// Add CoSec request interceptor
fetcher.interceptors.request.use(
    new CoSecRequestInterceptor({
        appId: 'your-app-id',
        getAccessToken: () => tokenStorage.getAccessToken(),
        getRefreshToken: () => tokenStorage.getRefreshToken(),
        storeTokens: (accessToken, refreshToken) => {
            tokenStorage.storeTokens(accessToken, refreshToken);
        },
        refreshTokenFn: async () => {
            // Refresh token logic here
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: tokenStorage.getRefreshToken(),
                }),
            });

            const tokens = await response.json();
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            };
        },
    }),
);

// Add CoSec response interceptor
fetcher.interceptors.response.use(
    new CoSecResponseInterceptor({
        appId: 'your-app-id',
        getAccessToken: () => tokenStorage.getAccessToken(),
        getRefreshToken: () => tokenStorage.getRefreshToken(),
        storeTokens: (accessToken, refreshToken) => {
            tokenStorage.storeTokens(accessToken, refreshToken);
        },
        refreshTokenFn: async () => {
            // Refresh token logic here
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: tokenStorage.getRefreshToken(),
                }),
            });

            const tokens = await response.json();
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            };
        },
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
     * Device ID to be sent in the CoSec-Device-Id header
     * If not provided, a new Nano ID will be generated and stored in localStorage
     */
    deviceId?: string;

    /**
     * Storage key for device ID in localStorage
     * Defaults to 'cosec-device-id'
     */
    deviceIdStorageKey?: string;

    /**
     * Function to get the current access token
     */
    getAccessToken: () => string | null;

    /**
     * Function to get the current refresh token
     */
    getRefreshToken: () => string | null;

    /**
     * Function to store tokens
     */
    storeTokens: (accessToken: string, refreshToken: string) => void;

    /**
     * Function to refresh the access token
     * Should return a promise that resolves to the new tokens
     */
    refreshTokenFn: () => Promise<CompositeToken>;
}
```

### Headers Added

The interceptor automatically adds the following headers to requests:

1. `CoSec-Device-Id`: Device identifier (stored in localStorage or generated)
2. `CoSec-App-Id`: Application identifier
3. `Authorization`: Bearer token
4. `CoSec-Request-Id`: Unique request identifier for each request

### Token Refresh

The response interceptor automatically handles token refresh when the server returns status codes 401 or 403. When this
happens, the `refreshTokenFn` function is called to obtain new access and refresh tokens.

### Token Storage

The package includes a `TokenStorage` class for managing tokens in localStorage:

```typescript
import {TokenStorage} from '@ahoo-wang/fetcher-cosec';

const tokenStorage = new TokenStorage();

// Store tokens
tokenStorage.storeTokens('access-token', 'refresh-token');

// Get tokens
const accessToken = tokenStorage.getAccessToken();
const refreshToken = tokenStorage.getRefreshToken();

// Clear tokens
tokenStorage.clearTokens();
```

### Device ID Storage

The package includes a `DeviceIdStorage` class for managing device identifiers in localStorage:

```typescript
import {DeviceIdStorage} from '@ahoo-wang/fetcher-cosec';

const deviceIdStorage = new DeviceIdStorage('my-device-id-key');

// Get or create a device ID
const deviceId = deviceIdStorage.getOrCreateDeviceId();

// Store a specific device ID
deviceIdStorage.storeDeviceId('specific-device-id');

// Get the current device ID
const currentDeviceId = deviceIdStorage.getDeviceId();

// Clear the stored device ID
deviceIdStorage.clearDeviceId();

// Check if a device ID exists
const hasDeviceId = deviceIdStorage.hasDeviceId();

// Generate a new device ID (without storing it)
const newDeviceId = deviceIdStorage.generateDeviceId();
```

## API

### Interfaces

- `AccessToken`: Contains an access token
- `RefreshToken`: Contains a refresh token
- `CompositeToken`: Contains both access and refresh tokens

### Classes

- `TokenStorage`: Manages token storage in localStorage
- `DeviceIdStorage`: Manages device ID storage in localStorage
- `CoSecRequestInterceptor`: Adds CoSec headers to requests
- `CoSecResponseInterceptor`: Handles token refresh on 401/403 responses

### Authorization Results

The package includes authorization result constants:

```typescript
import {AuthorizeResults} from '@ahoo-wang/fetcher-cosec';

// Predefined results
AuthorizeResults.ALLOW; // Authorized
AuthorizeResults.EXPLICIT_DENY; // Explicitly denied
AuthorizeResults.IMPLICIT_DENY; // Implicitly denied
AuthorizeResults.TOKEN_EXPIRED; // Token expired
AuthorizeResults.TOO_MANY_REQUESTS; // Rate limited

// Custom results
AuthorizeResults.allow('Custom reason');
AuthorizeResults.deny('Custom reason');
```

## CoSec Framework

This package is designed to work with the [CoSec authentication framework](https://github.com/Ahoo-Wang/CoSec). For more
information about CoSec features and capabilities, please visit
the [CoSec GitHub repository](https://github.com/Ahoo-Wang/CoSec).

## License

Apache-2.0
