/**
 * Multi-Space Authentication - Baseline Implementation
 * Without CoSec skill guidance
 */

import { Fetcher } from '@ahoo-wang/fetcher';

// Simple token storage per space
interface TokenData {
  accessToken: string;
  refreshToken: string;
}

const tokenStorages = new Map<string, TokenData>();

function getToken(spaceId: string): TokenData | undefined {
  return tokenStorages.get(spaceId);
}

function setToken(spaceId: string, tokens: TokenData): void {
  tokenStorages.set(spaceId, tokens);
}

function clearToken(spaceId: string): void {
  tokenStorages.delete(spaceId);
}

// Space-specific fetcher factory
class SpaceAwareFetcherFactory {
  private fetchers = new Map<string, Fetcher>();

  getFetcher(spaceId: string, baseURL: string = 'https://api.example.com'): Fetcher {
    if (this.fetchers.has(spaceId)) {
      return this.fetchers.get(spaceId)!;
    }

    const fetcher = new Fetcher({
      baseURL,
      interceptors: {
        request: {
          use: (config: any) => {
            const token = getToken(spaceId);
            if (token?.accessToken) {
              config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token.accessToken}`,
                'X-Space-Id': spaceId,
              };
            }
            return config;
          },
        },
      },
    });

    this.fetchers.set(spaceId, fetcher);
    return fetcher;
  }
}

// Usage
const factory = new SpaceAwareFetcherFactory();

// Space A
const spaceA = factory.getFetcher('space-a');
setToken('space-a', {
  accessToken: 'eyJ...',
  refreshToken: 'eyJ...',
});

// Space B
const spaceB = factory.getFetcher('space-b');
setToken('space-b', {
  accessToken: 'eyJ...',
  refreshToken: 'eyJ...',
});

// API calls
const usersA = await spaceA.get('/api/users');
const usersB = await spaceB.get('/api/users');

// Cleanup
clearToken('space-a');
