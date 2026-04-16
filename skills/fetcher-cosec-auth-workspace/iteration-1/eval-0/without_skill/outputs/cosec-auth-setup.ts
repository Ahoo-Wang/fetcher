/**
 * Basic HTTP Client with Authentication Headers
 * Baseline implementation without CoSec skill guidance
 */

import { Fetcher } from '@ahoo-wang/fetcher';

// Basic token storage
const tokenStorage = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
};

// Simple fetcher with manual auth headers
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  interceptors: {
    request: {
      use: (config: any) => {
        // Add auth header if token exists
        if (tokenStorage.accessToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${tokenStorage.accessToken}`,
          };
        }
        return config;
      },
    },
  },
});

// Manual token refresh function
async function refreshToken(): Promise<void> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokenStorage.refreshToken }),
  });

  if (response.ok) {
    const tokens = await response.json();
    tokenStorage.accessToken = tokens.accessToken;
    tokenStorage.refreshToken = tokens.refreshToken;
  }
}

// Manual 401 handling
async function handleUnauthorized(): Promise<void> {
  await refreshToken();
}

// Example API call
const data = await fetcher.get('/api/protected-resource');
console.log('Protected data:', data);
