import { describe, it, expect, vi } from 'vitest';
import { CoSecResponseInterceptor } from '../src';
import { DeviceIdStorage } from '../src';
import { TokenStorage } from '../src';
import { InMemoryStorage } from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

describe('CoSecResponseInterceptor Enhanced Tests', () => {
  it('should return exchange if no response exists', async () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    const tokenRefresher = {
      refresh: vi.fn(),
    };

    const interceptor = new CoSecResponseInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher,
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = {
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: undefined,
      error: undefined,
    };

    const result = await interceptor.intercept(exchange);

    expect(result).toBe(exchange);
    expect(tokenRefresher.refresh).not.toHaveBeenCalled();
  });

  it('should return exchange for non-401 responses', async () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    const tokenRefresher = {
      refresh: vi.fn(),
    };

    const interceptor = new CoSecResponseInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher,
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = {
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: new Response('Forbidden', { status: 403 }),
      error: undefined,
    };

    const result = await interceptor.intercept(exchange);

    expect(result).toBe(exchange);
    expect(tokenRefresher.refresh).not.toHaveBeenCalled();
  });

  it('should return exchange if no current token exists', async () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    // Don't set any token

    const tokenRefresher = {
      refresh: vi.fn(),
    };

    const interceptor = new CoSecResponseInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher,
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = {
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: new Response('Unauthorized', { status: 401 }),
      error: undefined,
    };

    const result = await interceptor.intercept(exchange);

    expect(result).toBe(exchange);
    expect(tokenRefresher.refresh).not.toHaveBeenCalled();
  });

  it('should refresh token for 401 responses', async () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    // Set up initial token
    tokenStorage.set({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    });

    const newToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    const tokenRefresher = {
      refresh: vi.fn().mockResolvedValue(newToken),
    };

    const interceptor = new CoSecResponseInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher,
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = {
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: new Response('Unauthorized', { status: 401 }),
      error: undefined,
    };

    // Mock the fetcher's request method to avoid actual network calls
    const requestMock = vi.fn().mockResolvedValue({
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: new Response('OK', { status: 200 }),
      error: undefined,
    });
    fetcher.request = requestMock;

    const result = await interceptor.intercept(exchange);

    expect(tokenRefresher.refresh).toHaveBeenCalledWith({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    });
    expect(tokenStorage.get()).toEqual(newToken);
    expect(requestMock).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'GET',
    });
  });

  it('should clear tokens and re-throw error if token refresh fails', async () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    // Set up initial token
    tokenStorage.set({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    });

    const tokenRefresher = {
      refresh: vi.fn().mockRejectedValue(new Error('Token refresh failed')),
    };

    const interceptor = new CoSecResponseInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher,
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = {
      fetcher,
      url: 'https://api.example.com/test',
      request: {
        method: 'GET',
      },
      response: new Response('Unauthorized', { status: 401 }),
      error: undefined,
    };

    await expect(interceptor.intercept(exchange)).rejects.toThrow(
      'Token refresh failed',
    );

    expect(tokenRefresher.refresh).toHaveBeenCalled();
    expect(tokenStorage.get()).toBeNull();
  });
});
