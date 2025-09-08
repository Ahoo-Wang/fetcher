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
  ExchangeError,
  Fetcher,
  FetchExchange,
  Interceptor,
  InterceptorManager,
} from '../src';

describe('InterceptorManager', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test' };

  it('should create InterceptorManager with default registries', () => {
    const manager = new InterceptorManager();

    expect(manager.request).toBeDefined();
    expect(manager.response).toBeDefined();
    expect(manager.error).toBeDefined();
    expect(manager.request.interceptors).toHaveLength(3);
    expect(manager.response.interceptors).toHaveLength(1);
    expect(manager.error.interceptors).toHaveLength(0);
    // Check that request registry has default interceptors
    expect(manager.request).toBeDefined();
  });

  it('should process exchange through request interceptors', async () => {
    const manager = new InterceptorManager();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    // Mock intercept method of request registry
    const requestInterceptSpy = vi
      .spyOn(manager.request, 'intercept')
      .mockResolvedValue();

    await manager.exchange(exchange);

    expect(requestInterceptSpy).toHaveBeenCalledWith(exchange);

    // Clean up spy
    requestInterceptSpy.mockRestore();
  });

  it('should process exchange through response interceptors when request succeeds', async () => {
    const manager = new InterceptorManager();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    // Mock intercept methods
    const requestInterceptSpy = vi
      .spyOn(manager.request, 'intercept')
      .mockResolvedValue();
    const responseInterceptSpy = vi
      .spyOn(manager.response, 'intercept')
      .mockResolvedValue();

    await manager.exchange(exchange);

    expect(requestInterceptSpy).toHaveBeenCalledWith(exchange);
    expect(responseInterceptSpy).toHaveBeenCalledWith(exchange);

    // Clean up spies
    requestInterceptSpy.mockRestore();
    responseInterceptSpy.mockRestore();
  });

  it('should process exchange through error interceptors when request fails', async () => {
    const manager = new InterceptorManager();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const error = new Error('Test error');

    // Mock intercept methods
    const requestInterceptSpy = vi
      .spyOn(manager.request, 'intercept')
      .mockRejectedValue(error);
    const errorInterceptSpy = vi
      .spyOn(manager.error, 'intercept')
      .mockResolvedValue();

    await expect(manager.exchange(exchange)).rejects.toThrow(ExchangeError);
    expect(exchange.error).toBe(error);

    expect(requestInterceptSpy).toHaveBeenCalledWith(exchange);
    expect(errorInterceptSpy).toHaveBeenCalledWith(exchange);

    // Clean up spies
    requestInterceptSpy.mockRestore();
    errorInterceptSpy.mockRestore();
  });

  it('should return exchange when error interceptors clear the error', async () => {
    const manager = new InterceptorManager();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const error = new Error('Test error');

    // Mock intercept methods
    vi.spyOn(manager.request, 'intercept').mockRejectedValue(error);

    // Mock error interceptor that clears the error
    const errorInterceptor: Interceptor = {
      name: 'test-error-interceptor',
      order: 100,
      intercept: (exchange: FetchExchange) => {
        exchange.error = undefined;
      },
    };
    manager.error.use(errorInterceptor);

    const result = await manager.exchange(exchange);

    expect(result).toBe(exchange);
    expect(result.error).toBeUndefined();
  });

  it('should throw ExchangeError when error is not handled by error interceptors', async () => {
    const manager = new InterceptorManager();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const error = new Error('Test error');

    // Mock intercept methods
    vi.spyOn(manager.request, 'intercept').mockRejectedValue(error);

    await expect(manager.exchange(exchange)).rejects.toThrow(ExchangeError);
    expect(exchange.error).toBe(error);
  });
});

describe('ExchangeError', () => {
  it('should create ExchangeError with error message from exchange', () => {
    const mockFetcher = {} as Fetcher;
    const mockRequest = { url: '/test' };
    const error = new Error('Original error');
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      error,
    });

    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError).toBeInstanceOf(ExchangeError);
    expect(exchangeError.name).toBe('ExchangeError');
    expect(exchangeError.message).toBe('Original error');
    expect(exchangeError.exchange).toBe(exchange);
    expect(exchangeError.cause).toBe(error);
  });

  it('should create ExchangeError with response status text when no error message', () => {
    const mockFetcher = {} as Fetcher;
    const mockRequest = { url: '/test' };
    const response = new Response('error response', {
      status: 404,
      statusText: 'Not Found',
    });
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      response,
    });

    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError.message).toBe('Not Found');
  });

  it('should create ExchangeError with default message when no error or response', () => {
    const mockFetcher = {} as Fetcher;
    const mockRequest = { url: 'https://api.example.com/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError.message).toBe(
      'Request to https://api.example.com/test failed during exchange',
    );
  });
});
