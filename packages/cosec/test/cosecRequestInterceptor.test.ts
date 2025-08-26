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
import { CoSecHeaders, CoSecRequestInterceptor, DeviceIdStorage, InMemoryStorage, TokenStorage } from '../src';
import { Fetcher, FetchExchange, RequestHeaders } from '@ahoo-wang/fetcher';

describe('CoSecRequestInterceptor', () => {
  it('should add CoSec headers to request', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    // Set up test data
    deviceIdStorage.set('test-device-id-123');
    tokenStorage.set({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    const interceptor = new CoSecRequestInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher: {
        refresh: vi.fn(),
      },
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = new FetchExchange(fetcher, {
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    interceptor.intercept(exchange);

    expect(exchange.request.headers).toBeDefined();
    const headers = exchange.request.headers as Record<string, string>;
    expect(headers[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(headers[CoSecHeaders.DEVICE_ID]).toBe('test-device-id-123');
    expect(headers[CoSecHeaders.AUTHORIZATION]).toBe(
      'Bearer test-access-token',
    );
    expect(headers[CoSecHeaders.REQUEST_ID]).toBeDefined();
  });

  it('should generate new device ID if none exists', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    const interceptor = new CoSecRequestInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher: {
        refresh: vi.fn(),
      },
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = new FetchExchange(fetcher, {
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    interceptor.intercept(exchange);

    expect(exchange.request.headers).toBeDefined();
    const headers = exchange.request.headers as RequestHeaders;
    expect(headers[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(headers[CoSecHeaders.DEVICE_ID]).toBeDefined();
    expect(headers[CoSecHeaders.DEVICE_ID]).toBeTruthy();
    expect(headers[CoSecHeaders.REQUEST_ID]).toBeDefined();
  });

  it('should not add authorization header if no token exists', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    deviceIdStorage.set('test-device-id-123');
    // Don't set any token

    const interceptor = new CoSecRequestInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher: {
        refresh: vi.fn(),
      },
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = new FetchExchange(fetcher, {
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    interceptor.intercept(exchange);

    expect(exchange.request.headers).toBeDefined();
    const headers = exchange.request.headers as RequestHeaders;
    expect(headers[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(headers[CoSecHeaders.DEVICE_ID]).toBe('test-device-id-123');
    expect(headers[CoSecHeaders.AUTHORIZATION]).toBeUndefined();
    expect(headers[CoSecHeaders.REQUEST_ID]).toBeDefined();
  });

  it('should preserve existing headers', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);
    const tokenStorage = new TokenStorage('test-token', storage);

    deviceIdStorage.set('test-device-id-123');
    tokenStorage.set({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    const interceptor = new CoSecRequestInterceptor({
      appId: 'test-app-id',
      deviceIdStorage,
      tokenStorage,
      tokenRefresher: {
        refresh: vi.fn(),
      },
    });

    const fetcher = new Fetcher();
    const exchange: FetchExchange = new FetchExchange(fetcher, {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
    });

    interceptor.intercept(exchange);

    expect(exchange.request.headers).toBeDefined();
    const headers = exchange.request.headers as RequestHeaders;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom-Header']).toBe('custom-value');
    expect(headers[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(headers[CoSecHeaders.DEVICE_ID]).toBe('test-device-id-123');
    expect(headers[CoSecHeaders.AUTHORIZATION]).toBe(
      'Bearer test-access-token',
    );
    expect(headers[CoSecHeaders.REQUEST_ID]).toBeDefined();
  });
});
