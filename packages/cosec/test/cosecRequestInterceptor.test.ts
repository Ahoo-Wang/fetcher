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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CoSecRequestInterceptor,
  COSEC_REQUEST_INTERCEPTOR_NAME,
  COSEC_REQUEST_INTERCEPTOR_ORDER,
} from '../src';
import { CoSecHeaders, type CoSecOptions } from '../src';
import { FetchExchange } from '@ahoo-wang/fetcher';
import { DeviceIdStorage } from '../src';
import { JwtTokenManager } from '../src';
import { TokenStorage } from '../src';
import { TokenRefresher } from '../src';
import { idGenerator } from '../src';

describe('CoSecRequestInterceptor', () => {
  let mockDeviceIdStorage: DeviceIdStorage;
  let mockTokenStorage: TokenStorage;
  let mockTokenRefresher: TokenRefresher;
  let mockTokenManager: JwtTokenManager;
  let coSecOptions: CoSecOptions;
  let interceptor: CoSecRequestInterceptor;
  let mockExchange: FetchExchange;

  beforeEach(() => {
    // Mock idGenerator
    vi.spyOn(idGenerator, 'generateId').mockReturnValue('mock-request-id');

    // Create mock DeviceIdStorage
    mockDeviceIdStorage = {
      getOrCreate: vi.fn().mockReturnValue('mock-device-id'),
    } as unknown as DeviceIdStorage;

    // Create mock TokenStorage
    mockTokenStorage = {
      get: vi.fn(),
    } as unknown as TokenStorage;

    // Create mock TokenRefresher
    mockTokenRefresher = {
      refresh: vi.fn(),
    } as unknown as TokenRefresher;

    // Create mock JwtTokenManager
    mockTokenManager = new JwtTokenManager(mockTokenStorage, mockTokenRefresher);

    // Create CoSecOptions
    coSecOptions = {
      appId: 'test-app-id',
      deviceIdStorage: mockDeviceIdStorage,
      tokenManager: mockTokenManager,
    } as CoSecOptions;

    // Create interceptor
    interceptor = new CoSecRequestInterceptor(coSecOptions);

    // Create mock exchange
    mockExchange = {
      request: {},
      attributes: new Map(),
      ensureRequestHeaders: vi.fn().mockReturnValue({}),
    } as unknown as FetchExchange;
  });

  it('should have correct name and order', () => {
    expect(interceptor.name).toBe(COSEC_REQUEST_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(COSEC_REQUEST_INTERCEPTOR_ORDER);
  });

  it('should add CoSec headers to request', async () => {
    const mockHeaders: Record<string, string> = {};
    mockExchange.ensureRequestHeaders = vi.fn().mockReturnValue(mockHeaders);

    mockTokenStorage.get = vi.fn().mockReturnValue(null);

    await interceptor.intercept(mockExchange);

    expect(mockDeviceIdStorage.getOrCreate).toHaveBeenCalled();
    expect(mockHeaders[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(mockHeaders[CoSecHeaders.DEVICE_ID]).toBe('mock-device-id');
    expect(mockHeaders[CoSecHeaders.REQUEST_ID]).toBe('mock-request-id');
    expect(mockHeaders[CoSecHeaders.AUTHORIZATION]).toBeUndefined();
  });

  it('should add Authorization header when token exists', async () => {
    const mockHeaders: Record<string, string> = {};
    mockExchange.ensureRequestHeaders = vi.fn().mockReturnValue(mockHeaders);

    const mockToken = {
      access: {
        token: 'mock-access-token',
      },
      get isRefreshNeeded() {
        return false;
      },
      get isRefreshable() {
        return true;
      },
    };

    // Mock tokenManager.currentToken getter
    Object.defineProperty(mockTokenManager, 'currentToken', {
      get: vi.fn().mockReturnValue(mockToken),
      configurable: true,
    });

    await interceptor.intercept(mockExchange);

    expect(mockDeviceIdStorage.getOrCreate).toHaveBeenCalled();
    expect(mockHeaders[CoSecHeaders.APP_ID]).toBe('test-app-id');
    expect(mockHeaders[CoSecHeaders.DEVICE_ID]).toBe('mock-device-id');
    expect(mockHeaders[CoSecHeaders.REQUEST_ID]).toBe('mock-request-id');
    expect(mockHeaders[CoSecHeaders.AUTHORIZATION]).toBe('Bearer mock-access-token');
  });

  it('should not add Authorization header when it already exists', async () => {
    const mockHeaders = {
      [CoSecHeaders.AUTHORIZATION]: 'Existing Auth Header',
    };
    mockExchange.ensureRequestHeaders = vi.fn().mockReturnValue(mockHeaders);

    const mockToken = {
      access: {
        token: 'mock-access-token',
      },
      get isRefreshNeeded() {
        return false;
      },
      get isRefreshable() {
        return true;
      },
    };

    // Mock tokenManager.currentToken getter
    Object.defineProperty(mockTokenManager, 'currentToken', {
      get: vi.fn().mockReturnValue(mockToken),
      configurable: true,
    });

    await interceptor.intercept(mockExchange);

    expect(mockHeaders[CoSecHeaders.AUTHORIZATION]).toBe('Existing Auth Header');
  });

  it('should refresh token when needed and refreshable', async () => {
    const mockHeaders: Record<string, string> = {};
    mockExchange.ensureRequestHeaders = vi.fn().mockReturnValue(mockHeaders);

    const mockToken = {
      access: {
        token: 'new-access-token',
      },
      get isRefreshNeeded() {
        return true;
      },
      get isRefreshable() {
        return true;
      },
    };

    const refreshedToken = {
      access: {
        token: 'refreshed-access-token',
      },
      get isRefreshNeeded() {
        return false;
      },
      get isRefreshable() {
        return true;
      },
    };

    // Mock tokenManager.currentToken getter to return different values
    let callCount = 0;
    Object.defineProperty(mockTokenManager, 'currentToken', {
      get: vi.fn(() => {
        callCount++;
        return callCount === 1 ? mockToken : refreshedToken;
      }),
      configurable: true,
    });

    mockTokenManager.refresh = vi.fn().mockResolvedValue(undefined);

    await interceptor.intercept(mockExchange);

    expect(mockTokenManager.refresh).toHaveBeenCalled();
    expect(mockHeaders[CoSecHeaders.AUTHORIZATION]).toBe('Bearer refreshed-access-token');
  });

  it('should not add Authorization header when no token exists', async () => {
    const mockHeaders: Record<string, string> = {};
    mockExchange.ensureRequestHeaders = vi.fn().mockReturnValue(mockHeaders);

    // Mock tokenManager.currentToken getter to return null
    Object.defineProperty(mockTokenManager, 'currentToken', {
      get: vi.fn().mockReturnValue(null),
      configurable: true,
    });

    await interceptor.intercept(mockExchange);

    expect(mockHeaders[CoSecHeaders.AUTHORIZATION]).toBeUndefined();
  });
});