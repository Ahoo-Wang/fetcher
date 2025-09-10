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
  COSEC_REQUEST_INTERCEPTOR_NAME,
  COSEC_REQUEST_INTERCEPTOR_ORDER,
  CoSecHeaders,
  CoSecOptions,
  CoSecRequestInterceptor,
  DeviceIdStorage,
  InMemoryListenableStorage,
  TokenStorage,
} from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

describe('cosecRequestInterceptor.ts', () => {
  describe('CoSecRequestInterceptor', () => {
    it('should have correct name and order', () => {
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(
          'test-device-key',
          new InMemoryListenableStorage(),
        ),
        tokenStorage: new TokenStorage('test-token-key', new InMemoryListenableStorage()),
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };

      const interceptor = new CoSecRequestInterceptor(options);

      expect(interceptor.name).toBe(COSEC_REQUEST_INTERCEPTOR_NAME);
      expect(interceptor.order).toBe(COSEC_REQUEST_INTERCEPTOR_ORDER);
    });

    it('should add CoSec headers to request without token', () => {
      const deviceIdStorage = new DeviceIdStorage(
        'test-device-key',
        new InMemoryListenableStorage(),
      );
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryListenableStorage(),
      );

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage,
        tokenStorage,
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };

      const interceptor = new CoSecRequestInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = {
        url: '/test',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const exchange = new FetchExchange({ fetcher: mockFetcher, request });

      // Mock deviceIdStorage.getOrCreate to return a specific value
      vi.spyOn(deviceIdStorage, 'getOrCreate').mockReturnValue(
        'test-device-id',
      );

      interceptor.intercept(exchange);

      expect(exchange.request.headers).toEqual({
        'Content-Type': 'application/json',
        [CoSecHeaders.APP_ID]: 'test-app-id',
        [CoSecHeaders.DEVICE_ID]: 'test-device-id',
        [CoSecHeaders.REQUEST_ID]: expect.any(String),
      });

      // Verify that requestId is a non-empty string
      const requestId = exchange.request.headers?.[CoSecHeaders.REQUEST_ID];
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId!.length).toBeGreaterThan(0);
    });

    it('should add CoSec headers to request with token', () => {
      const deviceIdStorage = new DeviceIdStorage(
        'test-device-key',
        new InMemoryListenableStorage(),
      );
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryListenableStorage(),
      );

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage,
        tokenStorage,
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };

      const interceptor = new CoSecRequestInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = {
        url: '/test',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const exchange = new FetchExchange({ fetcher: mockFetcher, request });

      // Mock deviceIdStorage.getOrCreate to return a specific value
      vi.spyOn(deviceIdStorage, 'getOrCreate').mockReturnValue(
        'test-device-id',
      );

      // Set a token in storage
      const token: CompositeToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      tokenStorage.set(token);

      interceptor.intercept(exchange);

      expect(exchange.request.headers).toEqual({
        'Content-Type': 'application/json',
        [CoSecHeaders.APP_ID]: 'test-app-id',
        [CoSecHeaders.DEVICE_ID]: 'test-device-id',
        [CoSecHeaders.REQUEST_ID]: expect.any(String),
        [CoSecHeaders.AUTHORIZATION]: 'Bearer test-access-token',
      });
    });

    it('should preserve existing headers', () => {
      const deviceIdStorage = new DeviceIdStorage(
        'test-device-key',
        new InMemoryListenableStorage(),
      );
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryListenableStorage(),
      );

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage,
        tokenStorage,
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };

      const interceptor = new CoSecRequestInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = {
        url: '/test',
        headers: {
          'Custom-Header': 'custom-value',
          'Another-Header': 'another-value',
        },
      };

      const exchange = new FetchExchange({ fetcher: mockFetcher, request });

      // Mock deviceIdStorage.getOrCreate to return a specific value
      vi.spyOn(deviceIdStorage, 'getOrCreate').mockReturnValue(
        'test-device-id',
      );

      interceptor.intercept(exchange);

      expect(exchange.request.headers).toEqual({
        'Custom-Header': 'custom-value',
        'Another-Header': 'another-value',
        [CoSecHeaders.APP_ID]: 'test-app-id',
        [CoSecHeaders.DEVICE_ID]: 'test-device-id',
        [CoSecHeaders.REQUEST_ID]: expect.any(String),
      });
    });

    it('should handle request without existing headers', () => {
      const deviceIdStorage = new DeviceIdStorage(
        'test-device-key',
        new InMemoryListenableStorage(),
      );
      const tokenStorage = new TokenStorage(
        'test-token-key',
        new InMemoryListenableStorage(),
      );

      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage,
        tokenStorage,
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };

      const interceptor = new CoSecRequestInterceptor(options);

      const mockFetcher = {} as Fetcher;
      const request = {
        url: '/test',
        // No headers property
      };

      const exchange = new FetchExchange({ fetcher: mockFetcher, request });

      // Mock deviceIdStorage.getOrCreate to return a specific value
      vi.spyOn(deviceIdStorage, 'getOrCreate').mockReturnValue(
        'test-device-id',
      );

      interceptor.intercept(exchange);

      expect(exchange.request.headers).toEqual({
        [CoSecHeaders.APP_ID]: 'test-app-id',
        [CoSecHeaders.DEVICE_ID]: 'test-device-id',
        [CoSecHeaders.REQUEST_ID]: expect.any(String),
      });
    });
  });
});
