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
import { describe, expect, it } from 'vitest';
import {
  ExchangeError,
  Fetcher,
  FetcherError,
  FetchError,
  FetchExchange,
  FetchRequest,
  FetchTimeoutError,
} from '../src';

describe('FetcherError', () => {
  it('should create FetcherError with custom message', () => {
    const errorMsg = 'Custom error message';
    const fetcherError = new FetcherError(errorMsg);

    expect(fetcherError).toBeInstanceOf(FetcherError);
    expect(fetcherError).toBeInstanceOf(Error);
    expect(fetcherError.name).toBe('FetcherError');
    expect(fetcherError.message).toBe(errorMsg);
    expect(fetcherError.cause).toBeUndefined();
  });

  it('should create FetcherError with cause message', () => {
    const cause = new Error('Cause error message');
    const fetcherError = new FetcherError(undefined, cause);

    expect(fetcherError).toBeInstanceOf(FetcherError);
    expect(fetcherError.message).toBe('Cause error message');
    expect(fetcherError.cause).toBe(cause);
  });

  it('should create FetcherError with custom message and cause', () => {
    const errorMsg = 'Custom error message';
    const cause = new Error('Cause error message');
    const fetcherError = new FetcherError(errorMsg, cause);

    expect(fetcherError).toBeInstanceOf(FetcherError);
    expect(fetcherError.message).toBe(errorMsg);
    expect(fetcherError.cause).toBe(cause);
  });

  it('should create FetcherError with default message when no message or cause', () => {
    const fetcherError = new FetcherError();

    expect(fetcherError).toBeInstanceOf(FetcherError);
    expect(fetcherError.message).toBe('An error occurred in the fetcher');
    expect(fetcherError.cause).toBeUndefined();
  });

  it('should copy stack trace from cause', () => {
    const cause = new Error('Cause error message');
    cause.stack = 'test stack trace';
    const fetcherError = new FetcherError(undefined, cause);

    expect(fetcherError.stack).toBe('test stack trace');
  });
});

describe('ExchangeError', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test' } as FetchRequest;

  it('should create ExchangeError with error message from exchange error', () => {
    const mockError = new Error('test error');
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );
    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError).toBeInstanceOf(ExchangeError);
    expect(exchangeError).toBeInstanceOf(FetcherError);
    expect(exchangeError).toBeInstanceOf(Error);
    expect(exchangeError.name).toBe('ExchangeError');
    expect(exchangeError.message).toBe('test error');
    expect(exchangeError.exchange).toBe(exchange);
    expect(exchangeError.cause).toBe(mockError);
  });

  it('should create ExchangeError with message from response statusText when no error', () => {
    const mockResponse = new Response('test', {
      status: 404,
      statusText: 'Not Found',
    });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);
    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError).toBeInstanceOf(ExchangeError);
    expect(exchangeError.message).toBe('Not Found');
    expect(exchangeError.exchange).toBe(exchange);
    expect(exchangeError.cause).toBeUndefined();
  });

  it('should create ExchangeError with default message when no error or response statusText', () => {
    const mockResponse = new Response('test'); // No statusText
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);
    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError).toBeInstanceOf(ExchangeError);
    expect(exchangeError.message).toBe(
      `Request to ${mockRequest.url} failed during exchange`,
    );
    expect(exchangeError.exchange).toBe(exchange);
    expect(exchangeError.cause).toBeUndefined();
  });

  it('should copy stack trace from original error', () => {
    const mockError = new Error('test error');
    mockError.stack = 'test stack trace';
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );
    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError.stack).toBe('test stack trace');
  });

  it('should handle undefined stack trace gracefully', () => {
    const mockError = new Error('test error');
    mockError.stack = undefined;
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );
    const exchangeError = new ExchangeError(exchange);

    expect(exchangeError).toBeInstanceOf(ExchangeError);
    expect(exchangeError.message).toBe('test error');
  });
});

describe('FetchError', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test/url' } as FetchRequest;

  it('should create FetchError with exchange and custom message', () => {
    const customMsg = 'Custom fetch error message';
    const exchange = new FetchExchange(mockFetcher, mockRequest);
    const fetchError = new FetchError(exchange, customMsg);

    expect(fetchError).toBeInstanceOf(FetchError);
    expect(fetchError).toBeInstanceOf(FetcherError);
    expect(fetchError).toBeInstanceOf(Error);
    expect(fetchError.name).toBe('FetchError');
    expect(fetchError.message).toBe(customMsg);
    expect(fetchError.exchange).toBe(exchange);
    expect(fetchError.cause).toBeUndefined();
  });

  it('should create FetchError with exchange error message when no custom message', () => {
    const mockError = new Error('test error');
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );
    const fetchError = new FetchError(exchange);

    expect(fetchError).toBeInstanceOf(FetchError);
    expect(fetchError.message).toBe('test error');
    expect(fetchError.exchange).toBe(exchange);
    expect(fetchError.cause).toBe(mockError);
  });

  it('should create FetchError with default message when no custom message or exchange error', () => {
    const exchange = new FetchExchange(mockFetcher, mockRequest);
    const fetchError = new FetchError(exchange);

    expect(fetchError).toBeInstanceOf(FetchError);
    expect(fetchError.message).toBe(
      `Request to ${mockRequest.url} failed with no response`,
    );
    expect(fetchError.exchange).toBe(exchange);
    expect(fetchError.cause).toBeUndefined();
  });

  it('should copy stack trace from exchange error', () => {
    const mockError = new Error('test error');
    mockError.stack = 'test stack trace';
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );
    const fetchError = new FetchError(exchange);

    expect(fetchError.stack).toBe('test stack trace');
  });
});

describe('FetchTimeoutError', () => {
  const mockRequest = {
    url: '/test/timeout',
    method: 'GET',
    timeout: 5000,
  } as FetchRequest;

  it('should create FetchTimeoutError with request', () => {
    const timeoutError = new FetchTimeoutError(mockRequest);

    expect(timeoutError).toBeInstanceOf(FetchTimeoutError);
    expect(timeoutError).toBeInstanceOf(FetcherError);
    expect(timeoutError).toBeInstanceOf(Error);
    expect(timeoutError.name).toBe('FetchTimeoutError');
    expect(timeoutError.message).toBe(
      `Request timeout of ${mockRequest.timeout}ms exceeded for ${mockRequest.method} ${mockRequest.url}`,
    );
    expect(timeoutError.request).toBe(mockRequest);
    expect(timeoutError.cause).toBeUndefined();
  });

  it('should create FetchTimeoutError with different request parameters', () => {
    const differentRequest = {
      url: 'https://api.example.com/users',
      method: 'POST',
      timeout: 1000,
    } as FetchRequest;
    const timeoutError = new FetchTimeoutError(differentRequest);

    expect(timeoutError).toBeInstanceOf(FetchTimeoutError);
    expect(timeoutError.message).toBe(
      `Request timeout of ${differentRequest.timeout}ms exceeded for ${differentRequest.method} ${differentRequest.url}`,
    );
    expect(timeoutError.request).toBe(differentRequest);
  });

  it('should use default method when not specified', () => {
    const requestWithoutMethod = {
      url: '/test/default-method',
      timeout: 3000,
    } as FetchRequest;
    const timeoutError = new FetchTimeoutError(requestWithoutMethod);

    expect(timeoutError).toBeInstanceOf(FetchTimeoutError);
    expect(timeoutError.message).toBe(
      `Request timeout of ${requestWithoutMethod.timeout}ms exceeded for GET ${requestWithoutMethod.url}`,
    );
    expect(timeoutError.request).toBe(requestWithoutMethod);
  });
});
