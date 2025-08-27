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
import { Fetcher, FetchExchange, FetchRequest, HttpStatusValidationError, ValidateStatusInterceptor } from '../src';

describe('ValidateStatusInterceptor', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: 'https://api.example.com/test' } as FetchRequest;

  it('should create interceptor with default validateStatus function', () => {
    const interceptor = new ValidateStatusInterceptor();

    expect(interceptor.name).toBe('ValidateStatusInterceptor');
    expect(interceptor.order).toBe(Number.MAX_SAFE_INTEGER - 1000);
  });

  it('should create interceptor with custom validateStatus function', () => {
    const customValidate = (status: number) => status === 200;
    const interceptor = new ValidateStatusInterceptor(customValidate);

    expect(interceptor.name).toBe('ValidateStatusInterceptor');
    expect(interceptor.order).toBe(Number.MAX_SAFE_INTEGER - 1000);
  });

  it('should create interceptor with custom validateStatus function', () => {
    const customValidate = (status: number) => status === 200;
    const interceptor = new ValidateStatusInterceptor(customValidate);

    expect(interceptor.name).toBe('ValidateStatusInterceptor');
    expect(interceptor.order).toBe(Number.MAX_SAFE_INTEGER - 1000);
  });

  it('should not throw error for valid status codes (default validation)', () => {
    const interceptor = new ValidateStatusInterceptor();
    const mockResponse = new Response('success', { status: 200 });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    // Should not throw for 2xx status codes
    expect(interceptor.intercept(exchange)).toBeUndefined();
  });

  it('should throw HttpStatusValidationError for invalid status codes (default validation)', () => {
    const interceptor = new ValidateStatusInterceptor();
    const mockResponse = new Response('error', {
      status: 404,
      statusText: 'Not Found',
    });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
    expect(() => interceptor.intercept(exchange)).toThrow(
      'Request failed with status code 404 for https://api.example.com/test',
    );

    try {
      interceptor.intercept(exchange);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpStatusValidationError);
      const validationError = error as HttpStatusValidationError;
      expect(validationError.exchange).toBe(exchange);
    }
  });

  it('should not throw error when validateStatus returns true', () => {
    const interceptor = new ValidateStatusInterceptor(status => status === 404);
    const mockResponse = new Response('not found', {
      status: 404,
      statusText: 'Not Found',
    });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    // Should not throw since validateStatus returns true for 404
    expect(interceptor.intercept(exchange)).toBeUndefined();
  });

  it('should throw HttpStatusValidationError when validateStatus returns false', () => {
    const interceptor = new ValidateStatusInterceptor(status => status === 200);
    const mockResponse = new Response('forbidden', {
      status: 403,
      statusText: 'Forbidden',
    });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });

  it('should not validate when there is no response', () => {
    const interceptor = new ValidateStatusInterceptor();
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      new Error('Network error'),
    );

    // Should not throw when there's no response
    expect(interceptor.intercept(exchange)).toBeUndefined();
  });

  it('should handle response with no statusText', () => {
    const interceptor = new ValidateStatusInterceptor();
    const mockResponse = new Response('error', { status: 500 });
    // Manually remove statusText to simulate edge case
    Object.defineProperty(mockResponse, 'statusText', { value: '' });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
    expect(() => interceptor.intercept(exchange)).toThrow(
      'Request failed with status code 500 for https://api.example.com/test',
    );
  });

  it('should handle request with no url', () => {
    const interceptor = new ValidateStatusInterceptor();
    const mockResponse = new Response('error', {
      status: 400,
      statusText: 'Bad Request',
    });
    const requestWithoutUrl = {} as FetchRequest;
    const exchange = new FetchExchange(
      mockFetcher,
      requestWithoutUrl,
      mockResponse,
    );

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
    expect(() => interceptor.intercept(exchange)).toThrow(
      'Request failed with status code 400 for undefined',
    );
  });

  it('should work with validateStatus that always returns true', () => {
    const interceptor = new ValidateStatusInterceptor(_status => true);
    const mockResponse = new Response('error', {
      status: 500,
      statusText: 'Internal Server Error',
    });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    // Should not throw since validateStatus always returns true
    expect(interceptor.intercept(exchange)).toBeUndefined();
  });

  it('should work with validateStatus that always returns false', () => {
    const interceptor = new ValidateStatusInterceptor(_status => false);
    const mockResponse = new Response('success', { status: 200 });
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });
});
