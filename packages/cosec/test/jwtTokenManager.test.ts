import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JwtTokenManager } from '../src';
import { TokenStorage } from '../src';
import { TokenRefresher, CompositeToken } from '../src';
import { JwtCompositeToken } from '../src';

describe('JwtTokenManager', () => {
  let tokenStorage: TokenStorage;
  let tokenRefresher: TokenRefresher;
  let jwtTokenManager: JwtTokenManager;

  beforeEach(() => {
    tokenStorage = new TokenStorage();
    tokenRefresher = { refresh: vi.fn() } as unknown as TokenRefresher;
    jwtTokenManager = new JwtTokenManager(tokenStorage, tokenRefresher);
  });

  it('should return null when no token is stored', () => {
    expect(jwtTokenManager.currentToken).toBeNull();
    expect(jwtTokenManager.isRefreshNeeded).toBe(false);
    expect(jwtTokenManager.isRefreshable).toBe(false);
  });

  it('should refresh token and update storage', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const newCompositeToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    vi.mocked(tokenRefresher.refresh).mockResolvedValueOnce(newCompositeToken);

    // Act
    await jwtTokenManager.refresh(compositeToken);

    // Assert
    expect(tokenRefresher.refresh).toHaveBeenCalledWith(compositeToken);
    expect(tokenStorage.get()).not.toBeNull();
  });

  it('should throw error when no token found', async () => {
    await expect(jwtTokenManager.refresh()).rejects.toThrow('No token found');
  });

  it('should prevent concurrent refresh requests', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const newCompositeToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    let resolvePromise: (value: CompositeToken) => void = () => {
    };
    const refreshPromise = new Promise<CompositeToken>(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(tokenRefresher.refresh).mockReturnValueOnce(
      refreshPromise as any,
    );

    // Act
    const firstRefreshPromise = jwtTokenManager.refresh(compositeToken);
    const secondRefreshPromise = jwtTokenManager.refresh(compositeToken);

    resolvePromise(newCompositeToken);

    await firstRefreshPromise;
    await secondRefreshPromise;

    // Assert
    expect(tokenRefresher.refresh).toHaveBeenCalledTimes(1);
  });

  it('should use stored token when no token provided', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const jwtCompositeToken = new JwtCompositeToken(compositeToken);
    tokenStorage.set(jwtCompositeToken);

    const newCompositeToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    vi.mocked(tokenRefresher.refresh).mockResolvedValueOnce(newCompositeToken);

    // Act
    await jwtTokenManager.refresh();

    // Assert
    expect(tokenRefresher.refresh).toHaveBeenCalledWith(compositeToken);
  });

  it('should remove token from storage when refresh fails', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const jwtCompositeToken = new JwtCompositeToken(compositeToken);
    tokenStorage.set(jwtCompositeToken);

    const error = new Error('Refresh failed');
    vi.mocked(tokenRefresher.refresh).mockRejectedValueOnce(error);

    // Act & Assert
    await expect(jwtTokenManager.refresh()).rejects.toThrow('Refresh failed');

    expect(tokenStorage.get()).toBeNull();
  });

  it('should clear refreshInProgress after successful refresh', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const newCompositeToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    vi.mocked(tokenRefresher.refresh).mockResolvedValueOnce(newCompositeToken);

    // Act
    await jwtTokenManager.refresh(compositeToken);

    // After await, refreshInProgress should be undefined
    expect((jwtTokenManager as any).refreshInProgress).toBeUndefined();
  });

  it('should clear refreshInProgress after failed refresh', async () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const error = new Error('Refresh failed');
    vi.mocked(tokenRefresher.refresh).mockRejectedValueOnce(error);

    // Act & Assert
    await expect(jwtTokenManager.refresh(compositeToken)).rejects.toThrow(
      'Refresh failed',
    );

    expect((jwtTokenManager as any).refreshInProgress).toBeUndefined();
  });

  it('should return false for isRefreshNeeded when token has isRefreshNeeded false', () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    // Create a mock JwtCompositeToken with isRefreshNeeded = false
    const jwtCompositeToken = {
      token: compositeToken,
      isRefreshNeeded: false,
      isRefreshable: true,
    } as unknown as JwtCompositeToken;

    vi.spyOn(tokenStorage, 'get').mockReturnValue(jwtCompositeToken);

    // Act & Assert
    expect(jwtTokenManager.isRefreshNeeded).toBe(false);
  });

  it('should return false for isRefreshable when token has isRefreshable false', () => {
    // Setup
    const compositeToken = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    // Create a mock JwtCompositeToken with isRefreshable = false
    const jwtCompositeToken = {
      token: compositeToken,
      isRefreshNeeded: true,
      isRefreshable: false,
    } as unknown as JwtCompositeToken;

    vi.spyOn(tokenStorage, 'get').mockReturnValue(jwtCompositeToken);

    // Act & Assert
    expect(jwtTokenManager.isRefreshable).toBe(false);
  });
});
