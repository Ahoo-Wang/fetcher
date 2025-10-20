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
  Fetcher,
  FetchExchange,
  HttpStatusValidationError,
  IGNORE_VALIDATE_STATUS,
  VALIDATE_STATUS_INTERCEPTOR_NAME,
  VALIDATE_STATUS_INTERCEPTOR_ORDER,
  ValidateStatusInterceptor,
} from '../src';

describe('ValidateStatusInterceptor', () => {
  const mockFetcher = {} as Fetcher;

  it('should have correct name and order', () => {
    const interceptor = new ValidateStatusInterceptor();
    expect(interceptor.name).toBe(VALIDATE_STATUS_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(VALIDATE_STATUS_INTERCEPTOR_ORDER);
  });

  it('should not throw error for valid status (2xx by default)', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 200 });
    const request = { url: '/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
    });

    expect(() => interceptor.intercept(exchange)).not.toThrow();
  });

  it('should throw HttpStatusValidationError for invalid status (non-2xx by default)', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 404 });
    const request = { url: '/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
    });

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });

  it('should not throw error when no response is present', () => {
    const interceptor = new ValidateStatusInterceptor();
    const request = { url: '/test' };
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

    expect(() => interceptor.intercept(exchange)).not.toThrow();
  });

  it('should use custom validateStatus function', () => {
    const validateStatus = (status: number) => status === 200;
    const interceptor = new ValidateStatusInterceptor(validateStatus);
    const response = new Response('test', { status: 201 });
    const request = { url: '/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
    });

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });

  it('should not throw error with custom validateStatus function for valid status', () => {
    const validateStatus = (status: number) => status === 200 || status === 201;
    const interceptor = new ValidateStatusInterceptor(validateStatus);
    const response = new Response('test', { status: 201 });
    const request = { url: '/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
    });

    expect(() => interceptor.intercept(exchange)).not.toThrow();
  });

  it('should create HttpStatusValidationError with correct message', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 404 });
    const request = { url: 'https://api.example.com/test' };
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
    });

    try {
      interceptor.intercept(exchange);
      expect.fail('Should have thrown HttpStatusValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpStatusValidationError);
      // @ts-ignore
      expect(error.message).toBe(
        'Request failed with status code 404 for https://api.example.com/test',
      );
      // @ts-ignore
      expect(error.exchange).toBe(exchange);
    }
  });

  it('should skip validation when IGNORE_VALIDATE_STATUS is set to true', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 404 });
    const request = { url: '/test' };
    const attributes = new Map([[IGNORE_VALIDATE_STATUS, true]]);
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
      attributes,
    });

    expect(() => interceptor.intercept(exchange)).not.toThrow();
  });

  it('should still validate when IGNORE_VALIDATE_STATUS is set to false', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 404 });
    const request = { url: '/test' };
    const attributes = new Map([[IGNORE_VALIDATE_STATUS, false]]);
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
      attributes,
    });

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });

  it('should still validate when IGNORE_VALIDATE_STATUS is not set', () => {
    const interceptor = new ValidateStatusInterceptor();
    const response = new Response('test', { status: 404 });
    const request = { url: '/test' };
    const attributes = new Map();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request,
      response,
      attributes,
    });

    expect(() => interceptor.intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });
});

describe('HttpStatusValidationError', () => {
  it('should create HttpStatusValidationError with correct properties', () => {
    const mockFetcher = {} as Fetcher;
    const request = { url: '/test' };
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });
    const error = new HttpStatusValidationError(exchange);

    expect(error).toBeInstanceOf(HttpStatusValidationError);
    expect(error.name).toBe('HttpStatusValidationError');
    expect(error.exchange).toBe(exchange);
  });
});
