/**
 * CoSec Authentication Setup with Automatic Token Refresh
 * This implementation demonstrates setting up CoSec authentication for a Fetcher instance
 * with automatic token refresh, SpaceIdProvider, and JWT storage.
 */

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  TokenStorage,
  DeviceIdStorage,
  SpaceIdProvider,
  DefaultSpaceIdProvider,
  SpaceIdStorage,
  JwtTokenManager,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Define a token refresher that exchanges refresh token for new tokens
const tokenRefresher = {
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

// Configure SpaceIdProvider for multi-tenant support
const spaceStorage = new SpaceIdStorage();
const spaceIdProvider: SpaceIdProvider = new DefaultSpaceIdProvider({
  spacedResourcePredicate: {
    test: (exchange) => exchange.request.url.includes('/spaces/'),
  },
  spaceIdStorage: spaceStorage,
});

// Create the Fetcher instance
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Configure CoSec with all authentication features
const configurer = new CoSecConfigurer({
  appId: 'my-enterprise-app',

  // Storage for tokens and device ID
  tokenStorage: new TokenStorage(),
  deviceIdStorage: new DeviceIdStorage(),

  // Token refresh configuration
  tokenRefresher: tokenRefresher,

  // Multi-tenant support
  spaceIdProvider: spaceIdProvider,

  // Error handlers
  onUnauthorized: (exchange) => {
    console.log('Authentication failed for:', exchange.request.url);
    window.location.href = '/login?reason=session_expired';
  },
  onForbidden: (exchange) => {
    console.log('Access forbidden for:', exchange.request.url);
    alert('You do not have permission to access this resource');
  },
});

// Apply the configuration to the fetcher
configurer.applyTo(fetcher);

// Token refresh flow demonstration:
// 1. Request sent with Bearer token from JwtTokenManager
// 2. If server returns 401, AuthorizationResponseInterceptor intercepts
// 3. TokenRefresher.refresh() exchanges refresh token for new tokens
// 4. New tokens stored in TokenStorage
// 5. Original request retried with new Bearer token
// 6. On refresh failure: tokens cleared, error propagated

// Example: Protected API call
const data = await fetcher.get('/api/protected-resource');
console.log('Protected data:', data);
