/**
 * Multi-Space Authentication Implementation
 * Demonstrates configuring SpaceIdProvider and CompositeToken for scenarios
 * where different API endpoints require different space IDs.
 */

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  Fetcher,
  CoSecConfigurer,
  TokenStorage,
  DeviceIdStorage,
  SpaceIdProvider,
  DefaultSpaceIdProvider,
  SpaceIdStorage,
  JwtTokenManager,
  CompositeToken,
  TokenRefresher,
} from '@ahoo-wang/fetcher-cosec';

// Space-specific token storage factory
class SpaceTokenStorageFactory {
  private storages = new Map<string, TokenStorage>();

  getStorage(spaceId: string): TokenStorage {
    if (!this.storages.has(spaceId)) {
      this.storages.set(spaceId, new TokenStorage(`space-${spaceId}`));
    }
    return this.storages.get(spaceId)!;
  }

  getAllSpaceIds(): string[] {
    return Array.from(this.storages.keys());
  }
}

// Space-specific token refresher factory
class SpaceTokenRefresherFactory {
  createRefresher(spaceId: string): TokenRefresher {
    return {
      refresh: async (token: CompositeToken): Promise<CompositeToken> => {
        const response = await fetch(`/spaces/${spaceId}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Space-Id': spaceId,
          },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        });

        if (!response.ok) {
          throw new Error(`Token refresh failed for space ${spaceId}`);
        }

        const tokens = await response.json();
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      },
    };
  }
}

// Multi-space fetcher registry
class MultiSpaceFetcherRegistry {
  private fetchers = new Map<string, Fetcher>();
  private tokenStorageFactory = new SpaceTokenStorageFactory();
  private tokenRefresherFactory = new SpaceTokenRefresherFactory();

  getFetcher(spaceId: string, baseURL: string = 'https://api.example.com'): Fetcher {
    if (this.fetchers.has(spaceId)) {
      return this.fetchers.get(spaceId)!;
    }

    const fetcher = new Fetcher({ baseURL });
    const tokenStorage = this.tokenStorageFactory.getStorage(spaceId);
    const tokenRefresher = this.tokenRefresherFactory.createRefresher(spaceId);

    // Configure SpaceIdProvider
    const spaceIdProvider: SpaceIdProvider = {
      resolveSpaceId: (exchange) => {
        // Extract from header
        return exchange.request.headers['X-Current-Space'] || spaceId;
      },
    };

    // Apply CoSec configuration for this space
    new CoSecConfigurer({
      appId: 'multi-space-app',
      tokenStorage: tokenStorage,
      deviceIdStorage: new DeviceIdStorage(`device-${spaceId}`),
      tokenRefresher: tokenRefresher,
      spaceIdProvider: spaceIdProvider,
      onUnauthorized: () => this.handleUnauthorized(spaceId),
    }).applyTo(fetcher);

    this.fetchers.set(spaceId, fetcher);
    return fetcher;
  }

  private handleUnauthorized(spaceId: string): void {
    const tokenStorage = this.tokenStorageFactory.getStorage(spaceId);
    tokenStorage.signOut();
    console.log(`Space ${spaceId} session expired`);
  }

  signOut(spaceId: string): void {
    const tokenStorage = this.tokenStorageFactory.getStorage(spaceId);
    tokenStorage.signOut();
    this.fetchers.delete(spaceId);
  }

  signIn(spaceId: string, tokens: CompositeToken): void {
    const tokenStorage = this.tokenStorageFactory.getStorage(spaceId);
    tokenStorage.signIn(tokens);
  }
}

// Usage example
async function demo() {
  const registry = new MultiSpaceFetcherRegistry();

  // Space A operations
  const spaceA = registry.getFetcher('space-a');
  registry.signIn('space-a', {
    accessToken: 'eyJ...',
    refreshToken: 'eyJ...',
  });
  const dataA = await spaceA.get('/api/users');

  // Space B operations (separate authentication)
  const spaceB = registry.getFetcher('space-b');
  registry.signIn('space-b', {
    accessToken: 'eyJ...',
    refreshToken: 'eyJ...',
  });
  const dataB = await spaceB.get('/api/users');

  // Sign out from space A when done
  registry.signOut('space-a');
}
