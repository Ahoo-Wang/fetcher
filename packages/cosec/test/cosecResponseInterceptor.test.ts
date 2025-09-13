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
  AuthorizationResponseInterceptor,
  AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME,
  AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER,
} from '../src';
import { ResponseCodes, type CoSecOptions } from '../src';
import { FetchExchange, type Fetcher } from '@ahoo-wang/fetcher';
import { JwtTokenManager } from '../src';
import { TokenStorage } from '../src';
import { TokenRefresher } from '../src';

describe('CoSecResponseInterceptor', () => {
  let mockFetcher: Fetcher;
  let mockTokenStorage: TokenStorage;
  let mockTokenRefresher: TokenRefresher;
  let mockJwtTokenManager: JwtTokenManager;
  let coSecOptions: CoSecOptions;
  let interceptor: AuthorizationResponseInterceptor;

  beforeEach(() => {
    mockFetcher = {
      interceptors: {
        exchange: vi.fn(),
      },
    } as unknown as Fetcher;

    mockTokenStorage = {
      get: vi.fn(),
      setCompositeToken: vi.fn(),
      remove: vi.fn(),
    } as unknown as TokenStorage;

    mockTokenRefresher = {
      refresh: vi.fn(),
    } as unknown as TokenRefresher;

    mockJwtTokenManager = new JwtTokenManager(mockTokenStorage, mockTokenRefresher);
    // 使用 vi.spyOn 替代直接定义属性
    const isRefreshableSpy = vi.spyOn(mockJwtTokenManager, 'isRefreshable', 'get').mockReturnValue(true);

    coSecOptions = {
      appId: 'test-app-id',
      deviceIdStorage: {} as any,
      tokenManager: mockJwtTokenManager,
    } as CoSecOptions;

    interceptor = new AuthorizationResponseInterceptor(coSecOptions);
  });

  it('should have correct name and order', () => {
    expect(interceptor.name).toBe(AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER);
  });

  it('should not intercept when there is no response', async () => {
    const exchange = {
      response: undefined,
    } as unknown as FetchExchange;

    await interceptor.intercept(exchange);

    expect(mockTokenRefresher.refresh).not.toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });

  it('should not intercept when response status is not 401', async () => {
    const exchange = {
      response: {
        status: 200,
      } as Response,
    } as unknown as FetchExchange;

    await interceptor.intercept(exchange);

    expect(mockTokenRefresher.refresh).not.toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });

  it('should not intercept when token is not refreshable', async () => {
    // Mock isRefreshable to return false using spyOn
    const isRefreshableSpy = vi.spyOn(mockJwtTokenManager, 'isRefreshable', 'get').mockReturnValue(false);

    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
    } as unknown as FetchExchange;

    await interceptor.intercept(exchange);

    expect(mockTokenRefresher.refresh).not.toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });

  it('should attempt to refresh token and retry request on 401 response', async () => {
    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
    } as unknown as FetchExchange;

    mockTokenStorage.get = vi.fn().mockReturnValue({
      token: 'current-token',
    });

    mockTokenRefresher.refresh = vi.fn().mockResolvedValue('new-token');

    await interceptor.intercept(exchange);

    expect(mockTokenStorage.get).toHaveBeenCalled();
    expect(mockTokenRefresher.refresh).toHaveBeenCalledWith('current-token');
    expect(mockFetcher.interceptors.exchange).toHaveBeenCalledWith(exchange);
  });

  it('should clear tokens and throw error when token refresh fails', async () => {
    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
    } as unknown as FetchExchange;

    const refreshError = new Error('Refresh failed');

    mockTokenStorage.get = vi.fn().mockReturnValue({
      token: 'current-token',
    });

    mockTokenRefresher.refresh = vi.fn().mockRejectedValue(refreshError);

    await expect(interceptor.intercept(exchange)).rejects.toThrow('Refresh failed');

    expect(mockTokenStorage.get).toHaveBeenCalled();
    expect(mockTokenRefresher.refresh).toHaveBeenCalledWith('current-token');
    expect(mockTokenStorage.remove).toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });

  it('should not attempt to refresh when no current token exists', async () => {
    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
    } as unknown as FetchExchange;

    mockTokenStorage.get = vi.fn().mockReturnValue(null);

    const refreshError = new Error('No token found');

    await expect(interceptor.intercept(exchange)).rejects.toThrow('No token found');

    expect(mockTokenStorage.get).toHaveBeenCalled();
    expect(mockTokenRefresher.refresh).not.toHaveBeenCalled();
    expect(mockTokenStorage.remove).toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });
});