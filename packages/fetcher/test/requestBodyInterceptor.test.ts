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
  ContentTypeValues,
  Fetcher,
  FetchExchange,
  REQUEST_BODY_INTERCEPTOR_NAME,
  REQUEST_BODY_INTERCEPTOR_ORDER,
  RequestBodyInterceptor,
} from '../src';

describe('RequestBodyInterceptor', () => {
  const mockFetcher = {} as Fetcher;

  it('should have correct name and order', () => {
    const interceptor = new RequestBodyInterceptor();
    expect(interceptor.name).toBe(REQUEST_BODY_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(REQUEST_BODY_INTERCEPTOR_ORDER);
  });

  it('should not modify request when body is undefined', () => {
    const interceptor = new RequestBodyInterceptor();
    const request = { url: '/test' };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBeUndefined();
  });

  it('should not modify request when body is null', () => {
    const interceptor = new RequestBodyInterceptor();
    const request = { url: '/test', body: null };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBeNull();
  });

  it('should not modify request when body is string', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = 'test body';
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe(requestBody);
  });

  it('should not modify request when body is ArrayBuffer', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = new ArrayBuffer(8);
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe(requestBody);
  });

  it('should not modify request when body is Blob', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = new Blob(['test']);
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe(requestBody);
  });

  it('should not modify request when body is URLSearchParams', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = new URLSearchParams('key=value');
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe(requestBody);
  });

  it('should not modify request when body is FormData', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = new FormData();
    requestBody.append('key', 'value');
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe(requestBody);
  });

  it('should convert plain object to JSON string and set Content-Type header', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = { name: 'test', value: 123 };
    const request = { url: '/test', body: requestBody };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe('{"name":"test","value":123}');
    expect(exchange.request.headers).toEqual({
      'Content-Type': ContentTypeValues.APPLICATION_JSON,
    });
  });

  it('should convert plain object to JSON string and preserve existing headers', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = { name: 'test', value: 123 };
    const request = {
      url: '/test',
      body: requestBody,
      headers: { Authorization: 'Bearer token' },
    };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe('{"name":"test","value":123}');
    expect(exchange.request.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': ContentTypeValues.APPLICATION_JSON,
    });
  });

  it('should convert plain object to JSON string and not override existing Content-Type', () => {
    const interceptor = new RequestBodyInterceptor();
    const requestBody = { name: 'test', value: 123 };
    const request = {
      url: '/test',
      body: requestBody,
      headers: { 'Content-Type': 'text/plain' },
    };
    const exchange = new FetchExchange(mockFetcher, request);

    interceptor.intercept(exchange);

    expect(exchange.request.body).toBe('{"name":"test","value":123}');
    expect(exchange.request.headers).toEqual({
      'Content-Type': 'text/plain',
    });
  });
});
