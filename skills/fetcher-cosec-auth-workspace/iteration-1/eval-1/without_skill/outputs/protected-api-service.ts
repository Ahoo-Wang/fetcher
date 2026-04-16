/**
 * Protected API Service - Baseline Implementation
 * Without CoSec skill guidance - manual interceptor approach
 */

import { Fetcher } from '@ahoo-wang/fetcher';

// Manual token storage
interface TokenData {
  accessToken: string;
  refreshToken: string;
}

let currentToken: TokenData | null = null;

// Simple request interceptor for auth
const authInterceptor = {
  async handleRequest(request: RequestInit): Promise<RequestInit> {
    if (currentToken?.accessToken) {
      return {
        ...request,
        headers: {
          ...request.headers,
          'Authorization': `Bearer ${currentToken.accessToken}`,
        },
      };
    }
    return request;
  },
};

// Simple response interceptor for 401 handling
const responseInterceptor = {
  async handleResponse(response: Response): Promise<Response> {
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry would happen here in a real implementation
        console.log('Token refreshed, but retry not implemented');
      }
    }
    return response;
  },
};

async function tryRefreshToken(): Promise<boolean> {
  if (!currentToken?.refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: currentToken!.refreshToken }),
    });

    if (res.ok) {
      const tokens = await res.json();
      currentToken = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      return true;
    }
  } catch (e) {
    console.error('Token refresh failed:', e);
  }
  return false;
}

// Basic fetcher setup
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

// API service with manual auth
class ProtectedApiService {
  async getUserProfile(userId: string) {
    return fetcher.get(`/api/users/${userId}/profile`);
  }

  async getOrders(page: number = 1) {
    return fetcher.get(`/api/orders?page=${page}`);
  }
}

// Usage
const api = new ProtectedApiService();
const profile = await api.getUserProfile('123');
console.log('User profile:', profile);
