/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  CompositeToken,
  COSEC_RESPONSE_INTERCEPTOR_NAME,
  COSEC_RESPONSE_INTERCEPTOR_ORDER,
  CoSecOptions,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  InMemoryStorage,
  ResponseCodes,
  TokenRefresher,
  TokenStorage,
} from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

describe('cosecResponseInterceptor.ts', () => {
  describe('CoSecResponseInterceptor', () => {
    it('should have correct name and order', () => {
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage: new TokenStorage('test-token-key', new InMemoryStorage()),
        tokenRefresher: {
          refresh: async (_token: CompositeToken) => ({
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
          }),
        },
      };

      const interceptor = new CoSecResponseInterceptor(options);

      expect(interceptor.name).toBe(COSEC_RESPONSE_INTERCEPTOR_NAME);
      expect(interceptor.order).toBe(COSEC_RESPONSE_INTERCEPTOR_ORDER);
    });

    it('should not intercept when there is no response', async () => {
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage: new TokenStorage('test-token-key', new InMemoryStorage()),
        tokenRefresher: {
          refresh: async (_token: CompositeToken) => ({
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
          }),
        },
      };

      const interceptor = new CoSecResponseInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = { url: '/test' };
      const exchange = new FetchExchange(mockFetcher, request);

      // No response in exchange
      await interceptor.intercept(exchange);

      // Should not throw and should not modify exchange
      expect(exchange.response).toBeUndefined();
    });

    it('should not intercept when response status is not 401', async () => {
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage: new TokenStorage('test-token-key', new InMemoryStorage()),
        tokenRefresher: {
          refresh: async (_token: CompositeToken) => ({
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
          }),
        },
      };

      const interceptor = new CoSecResponseInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = { url: '/test' };
      const response = new Response('test', { status: 200 });
      const exchange = new FetchExchange(mockFetcher, request, response);

      await interceptor.intercept(exchange);

      // Should not modify exchange
      expect(exchange.response).toBe(response);
    });

    it('should not intercept when there is no current token', async () => {
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage: new TokenStorage('test-token-key', new InMemoryStorage()),
        tokenRefresher: {
          refresh: async (_token: CompositeToken) => ({
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
          }),
        },
      };

      const interceptor = new CoSecResponseInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = { url: '/test' };
      const response = new Response('test', {
        status: ResponseCodes.UNAUTHORIZED,
      });
      const exchange = new FetchExchange(mockFetcher, request, response);

      await interceptor.intercept(exchange);

      // Should not modify exchange
      expect(exchange.response).toBe(response);
    });

    it('should refresh token and retry request on 401 response', async () => {
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryStorage(),
      );
      const tokenRefresher: TokenRefresher = {
        refresh: vi.fn().mockImplementation(async (_token: CompositeToken) => ({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        })),
      };

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage,
        tokenRefresher,
      };

      const interceptor = new CoSecResponseInterceptor(options);

      const mockFetcher = {
        request: vi.fn().mockResolvedValue({}),
      } as unknown as Fetcher;

      const request = { url: '/test' };
      const response = new Response('test', {
        status: ResponseCodes.UNAUTHORIZED,
      });
      const exchange = new FetchExchange(mockFetcher, request, response);

      // Set a current token
      const currentToken: CompositeToken = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      };
      tokenStorage.set(currentToken);

      await interceptor.intercept(exchange);

      // Verify token was refreshed
      expect(tokenRefresher.refresh).toHaveBeenCalledWith(currentToken);

      // Verify new token was stored
      const newToken = tokenStorage.get();
      expect(newToken).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Verify request was retried
      expect(mockFetcher.request).toHaveBeenCalledWith(request);
    });

    it('should clear token storage and re-throw error when token refresh fails', async () => {
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryStorage(),
      );
      const tokenRefresher: TokenRefresher = {
        refresh: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      };

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryStorage(),
        ),
        tokenStorage,
        tokenRefresher,
      };

      const interceptor = new CoSecResponseInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = { url: '/test' };
      const response = new Response('test', {
        status: ResponseCodes.UNAUTHORIZED,
      });
      const exchange = new FetchExchange(mockFetcher, request, response);

      // Set a current token
      const currentToken: CompositeToken = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      };
      tokenStorage.set(currentToken);

      await expect(interceptor.intercept(exchange)).rejects.toThrow(
        'Refresh failed',
      );

      // Verify token was cleared
      const storedToken = tokenStorage.get();
      expect(storedToken).toBeNull();
    });
  });
});
