import { describe, it, expect, vi } from 'vitest';
import { CoSecResponseInterceptor } from '../src';
import { DeviceIdStorage } from '../src';
import { TokenStorage } from '../src';
import { InMemoryStorage } from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

describe('CoSecResponseInterceptor Final Tests', () => {
  it('should handle exchange without response', async () => {
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
});
