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
  RefreshTokenError,
} from '../src';
import { ResponseCodes, type CoSecOptions } from '../src';
import type { FetchExchange } from '@ahoo-wang/fetcher';
import { type Fetcher } from '@ahoo-wang/fetcher';
import { JwtTokenManager } from '../src';
import type { TokenStorage } from '../src';
import type { TokenRefresher } from '../src';

describe('AuthorizationResponseInterceptor', () => {
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

    mockJwtTokenManager = new JwtTokenManager(
      mockTokenStorage,
      mockTokenRefresher,
    );
    // 使用 vi.spyOn 替代直接定义属性
    const isRefreshableSpy = vi
      .spyOn(mockJwtTokenManager, 'isRefreshable', 'get')
      .mockReturnValue(true);

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
    const isRefreshableSpy = vi
      .spyOn(mockJwtTokenManager, 'isRefreshable', 'get')
      .mockReturnValue(false);

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

    await expect(interceptor.intercept(exchange)).rejects.toThrow(
      RefreshTokenError,
    );

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

    await expect(interceptor.intercept(exchange)).rejects.toThrow(
      'No token found',
    );

    expect(mockTokenStorage.get).toHaveBeenCalled();
    expect(mockTokenRefresher.refresh).not.toHaveBeenCalled();
    expect(mockTokenStorage.remove).toHaveBeenCalled();
    expect(mockFetcher.interceptors.exchange).not.toHaveBeenCalled();
  });

  it('should not infinitely refresh when the retried request still returns 401', async () => {
    // Regression: previously, a successful refresh followed by a retried request
    // that STILL returns 401 caused the response interceptor to recurse
    // (retry re-runs the whole chain, including this interceptor), looping
    // refresh until the refresh token expired or the server gave out.
    mockTokenStorage.get = vi.fn().mockReturnValue({ token: 'current-token' });

    let refreshCount = 0;
    mockTokenRefresher.refresh = vi.fn().mockImplementation(() => {
      refreshCount++;
      // Safety stop so the buggy implementation cannot hang the test runner.
      if (refreshCount > 10) {
        return Promise.reject(new Error('forced-stop'));
      }
      return Promise.resolve(`new-token-${refreshCount}`);
    });

    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
      attributes: new Map(),
    } as unknown as FetchExchange;

    // Simulate the real interceptor chain: retrying re-runs response interceptors.
    // The retried response is still 401.
    mockFetcher.interceptors.exchange = vi.fn().mockImplementation(() =>
      interceptor.intercept(exchange),
    );

    let threw = false;
    try {
      await interceptor.intercept(exchange);
    } catch {
      threw = true;
    }

    // Buggy code loops until forced-stop (refreshCount ≈ 11).
    // Fixed code refreshes at most once for a given exchange.
    expect(refreshCount).toBeLessThanOrEqual(1);
  });

  it('should remove the token exactly once when refresh fails (no duplicate signOut event)', async () => {
    // Regression: JwtTokenManager.refresh() already removes the token on failure;
    // the interceptor used to remove() again, emitting a duplicate signOut event.
    mockTokenStorage.get = vi.fn().mockReturnValue({ token: 'current-token' });
    mockTokenRefresher.refresh = vi.fn().mockRejectedValue(new Error('Refresh failed'));

    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
      attributes: new Map(),
    } as unknown as FetchExchange;

    await expect(interceptor.intercept(exchange)).rejects.toThrow(
      RefreshTokenError,
    );

    expect(mockTokenStorage.remove).toHaveBeenCalledTimes(1);
  });

  it('should preserve the token when refresh succeeds but the retried request still fails', async () => {
    // Regression: when refresh() succeeds the token is valid. A retry that
    // still fails (e.g. the endpoint stays 401 despite a fresh token) must NOT
    // sign the user out — only a refresh failure should clear the token.
    mockTokenStorage.get = vi.fn().mockReturnValue({ token: 'current-token' });
    mockTokenRefresher.refresh = vi.fn().mockResolvedValue('new-token');
    mockFetcher.interceptors.exchange = vi
      .fn()
      .mockRejectedValue(new Error('still 401'));

    const exchange = {
      response: {
        status: ResponseCodes.UNAUTHORIZED,
      } as Response,
      fetcher: mockFetcher,
      attributes: new Map(),
    } as unknown as FetchExchange;

    await expect(interceptor.intercept(exchange)).rejects.toThrow('still 401');

    // Token refreshed successfully — must not be removed.
    expect(mockTokenStorage.remove).not.toHaveBeenCalled();
  });
});
