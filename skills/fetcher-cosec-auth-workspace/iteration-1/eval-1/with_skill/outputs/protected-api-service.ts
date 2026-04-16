/**
 * Protected API Service with CoSecInterceptor
 * Demonstrates how CoSecInterceptor adds authentication to all requests
 * and handles 401 responses with automatic token refresh.
 */

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  Fetcher,
  CoSecConfigurer,
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  CoSecRequestInterceptor,
  JwtTokenManager,
  TokenStorage,
  TokenRefresher,
} from '@ahoo-wang/fetcher-cosec';

// Define the token refresher
const tokenRefresher: TokenRefresher = {
  refresh: async (token) => {
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

// Create token storage and manager
const tokenStorage = new TokenStorage();
const tokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);

// Create Fetcher instance
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// Apply CoSecConfigurer which adds all necessary interceptors
new CoSecConfigurer({
  appId: 'protected-api-app',
  tokenStorage: tokenStorage,
  tokenRefresher: tokenRefresher,
  onUnauthorized: (exchange) => {
    console.log('Session expired, redirecting to login');
    tokenStorage.signOut();
    window.location.href = '/login';
  },
}).applyTo(fetcher);

// Alternatively, add interceptors individually:
fetcher.interceptors.request.use(
  new AuthorizationRequestInterceptor({ tokenManager })
);

fetcher.interceptors.response.use(
  new AuthorizationResponseInterceptor({ tokenManager })
);

// All requests now include:
// - CoSec-App-Id header
// - CoSec-Device-Id header
// - CoSec-Request-Id header
// - Authorization: Bearer <access-token>

// Protected API service class
class ProtectedApiService {
  constructor(private fetcher: Fetcher) {}

  async getUserProfile(userId: string) {
    return this.fetcher.get(`/api/users/${userId}/profile`);
  }

  async getOrders(page: number = 1) {
    return this.fetcher.get(`/api/orders?page=${page}`);
  }

  async createOrder(orderData: any) {
    return this.fetcher.post('/api/orders', orderData);
  }
}

// Usage
const api = new ProtectedApiService(fetcher);
const profile = await api.getUserProfile('123');
console.log('User profile:', profile);
