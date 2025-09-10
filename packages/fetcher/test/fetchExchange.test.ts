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
import { ExchangeError, Fetcher, FetchExchange, FetchRequest, ResultExtractors } from '../src';

describe('FetchExchange', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test' } as FetchRequest;

  it('should create instance with required parameters', () => {
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

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

    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      response: mockResponse,
      error: mockError,
    });
    exchange.attributes = attributes;

    expect(exchange.fetcher).toBe(mockFetcher);
    expect(exchange.request).toBe(mockRequest);
    expect(exchange.response).toBe(mockResponse);
    expect(exchange.error).toBe(mockError);
    expect(exchange.attributes).toBe(attributes);
  });

  it('should return false for hasError when no error is present', () => {
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    expect(exchange.hasError()).toBe(false);
  });

  it('should return true for hasError when error is present', () => {
    const mockError = new Error('test error');
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      error: mockError,
    });

    expect(exchange.hasError()).toBe(true);
  });

  it('should return false for hasResponse when no response is present', () => {
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    expect(exchange.hasResponse()).toBe(false);
  });

  it('should return true for hasResponse when response is present', () => {
    const mockResponse = new Response('test');
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      response: mockResponse,
    });

    expect(exchange.hasResponse()).toBe(true);
    expect(exchange.requiredResponse).toBe(mockResponse);
  });

  it('should throw an error when trying to access requiredResponse without a response', () => {
    expect(() => {
      const exchange = new FetchExchange({
        fetcher: mockFetcher,
        request: mockRequest,
      });
      exchange.requiredResponse;
    }).toThrowError(ExchangeError);
  });

  it('should create headers object when ensureRequestHeaders is called and headers is undefined', () => {
    const request = { url: '/test' } as FetchRequest;
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

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
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

    // Verify headers already exists
    expect(exchange.request.headers).toBe(existingHeaders);

    // Call ensureRequestHeaders
    const headers = exchange.ensureRequestHeaders();

    // Verify the same object is returned
    expect(headers).toBe(existingHeaders);
    expect(exchange.request.headers).toBe(existingHeaders);
  });

  it('should create urlParams object with path and query when ensureRequestUrlParams is called and urlParams is undefined', () => {
    const request = { url: '/test' } as FetchRequest;
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

    // Verify urlParams is initially undefined
    expect(exchange.request.urlParams).toBeUndefined();

    // Call ensureRequestUrlParams
    const urlParams = exchange.ensureRequestUrlParams();

    // Verify urlParams is now an object with empty path and query objects
    expect(urlParams).toEqual({
      path: {},
      query: {},
    });
    expect(exchange.request.urlParams).toBe(urlParams);
  });

  it('should create path and query objects when ensureRequestUrlParams is called and urlParams exists but path/query are missing', () => {
    const request = { url: '/test', urlParams: {} } as FetchRequest;
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

    // Verify urlParams exists but path and query are missing
    expect(exchange.request.urlParams).toEqual({});
    expect(exchange.request.urlParams?.path).toBeUndefined();
    expect(exchange.request.urlParams?.query).toBeUndefined();

    // Call ensureRequestUrlParams
    const urlParams = exchange.ensureRequestUrlParams();

    // Verify path and query objects were created
    expect(urlParams.path).toEqual({});
    expect(urlParams.query).toEqual({});
    expect(exchange.request.urlParams).toBe(urlParams);
  });

  it('should return existing urlParams object when ensureRequestUrlParams is called and urlParams with path/query exists', () => {
    const existingUrlParams = {
      path: { id: 123 },
      query: { filter: 'active' },
    };
    const request = {
      url: '/test',
      urlParams: existingUrlParams,
    } as FetchRequest;
    const exchange = new FetchExchange({ fetcher: mockFetcher, request });

    // Verify urlParams already exists
    expect(exchange.request.urlParams).toBe(existingUrlParams);

    // Call ensureRequestUrlParams
    const urlParams = exchange.ensureRequestUrlParams();

    // Verify the same object is returned
    expect(urlParams).toBe(existingUrlParams);
    expect(exchange.request.urlParams).toBe(existingUrlParams);
  });

  it('should use default result extractor when none is provided', () => {
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    expect(exchange.resultExtractor).toBe(ResultExtractors.Exchange);
  });

  it('should use provided result extractor', () => {
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      resultExtractor: ResultExtractors.Response,
    });

    expect(exchange.resultExtractor).toBe(ResultExtractors.Response);
  });

  it('should cache extracted result', () => {
    const mockResponse = new Response('test data');
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      response: mockResponse,
    });

    // First call
    const result1 = exchange.typedExtractedResult();
    expect(result1).toBe(exchange);

    // Second call should return cached result
    const result2 = exchange.typedExtractedResult();
    expect(result2).toBe(result1);
    expect(result2).toBe(exchange);
  });

  it('should extract result with custom extractor', () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
      response: mockResponse,
      resultExtractor: ResultExtractors.Json,
    });

    // This would normally be a Promise, but for testing purposes we're checking the function was called
    const result = exchange.typedExtractedResult();
    expect(result).toBeInstanceOf(Promise);
  });
});