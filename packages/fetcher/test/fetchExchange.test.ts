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
import { ExchangeError, Fetcher, FetchExchange, FetchRequest } from '../src';

describe('FetchExchange', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test' } as FetchRequest;

  it('should create instance with required parameters', () => {
    const exchange = new FetchExchange(mockFetcher, mockRequest);

    expect(exchange.fetcher).toBe(mockFetcher);
    expect(exchange.request).toBe(mockRequest);
    expect(exchange.response).toBeUndefined();
    expect(exchange.error).toBeUndefined();
    expect(exchange.attributes).toEqual({});
  });

  it('should create instance with optional parameters', () => {
    const mockResponse = new Response('test');
    const mockError = new Error('test error');
    const attributes = { test: 'value' };

    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      mockResponse,
      mockError,
    );
    exchange.attributes = attributes;

    expect(exchange.fetcher).toBe(mockFetcher);
    expect(exchange.request).toBe(mockRequest);
    expect(exchange.response).toBe(mockResponse);
    expect(exchange.error).toBe(mockError);
    expect(exchange.attributes).toBe(attributes);
  });

  it('should return false for hasError when no error is present', () => {
    const exchange = new FetchExchange(mockFetcher, mockRequest);

    expect(exchange.hasError()).toBe(false);
  });

  it('should return true for hasError when error is present', () => {
    const mockError = new Error('test error');
    const exchange = new FetchExchange(
      mockFetcher,
      mockRequest,
      undefined,
      mockError,
    );

    expect(exchange.hasError()).toBe(true);
  });

  it('should return false for hasResponse when no response is present', () => {
    const exchange = new FetchExchange(mockFetcher, mockRequest);

    expect(exchange.hasResponse()).toBe(false);
  });

  it('should return true for hasResponse when response is present', () => {
    const mockResponse = new Response('test');
    const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

    expect(exchange.hasResponse()).toBe(true);
    expect(exchange.requiredResponse).toBe(mockResponse);
  });

  it('should throw an error when trying to access requiredResponse without a response', () => {
    expect(() => {
      const exchange = new FetchExchange(mockFetcher, mockRequest);
      exchange.requiredResponse;
    }).toThrowError(ExchangeError);
  });

  it('should create headers object when ensureRequestHeaders is called and headers is undefined', () => {
    const request = { url: '/test' } as FetchRequest;
    const exchange = new FetchExchange(mockFetcher, request);

    // Verify headers is initially undefined
    expect(exchange.request.headers).toBeUndefined();

    // Call ensureRequestHeaders
    const headers = exchange.ensureRequestHeaders();

    // Verify headers is now an empty object
    expect(headers).toEqual({});
    expect(exchange.request.headers).toBe(headers);
  });

  it('should return existing headers object when ensureRequestHeaders is called and headers exists', () => {
    const existingHeaders = { 'Content-Type': 'application/json' };
    const request = { url: '/test', headers: existingHeaders } as FetchRequest;
    const exchange = new FetchExchange(mockFetcher, request);

    // Verify headers already exists
    expect(exchange.request.headers).toBe(existingHeaders);

    // Call ensureRequestHeaders
    const headers = exchange.ensureRequestHeaders();

    // Verify the same object is returned
    expect(headers).toBe(existingHeaders);
    expect(exchange.request.headers).toBe(existingHeaders);
  });
});