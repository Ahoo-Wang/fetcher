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

import { describe, it, expect, vi } from 'vitest';
import { EventStreamInterceptor } from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

// Mock the EventStreamConverter
vi.mock('../src/eventStreamConverter', async () => {
  const actual = await vi.importActual('../src/eventStreamConverter');
  return {
    ...actual,
    toServerSentEventStream: vi.fn().mockReturnValue(new ReadableStream()),
  };
});

describe('EventStreamInterceptor Comprehensive', () => {
  const mockFetcher = new Fetcher();
  const interceptor = new EventStreamInterceptor();

  it('should handle response with different event-stream content types', () => {
    const testCases = ['text/event-stream', 'text/event-stream; charset=utf-8'];

    for (const contentType of testCases) {
      const response = new Response('data: test\n\n', {
        headers: { 'content-type': contentType },
      });

      const exchange: FetchExchange = {
        fetcher: mockFetcher,
        url: 'http://example.com/events',
        request: {},
        response: response,
        error: undefined,
      };

      const result = interceptor.intercept(exchange);

      expect(result.response?.eventStream).toBeDefined();
      expect(typeof result.response?.eventStream).toBe('function');
    }
  });

  it('should not modify response with non-event-stream content types', () => {
    const testCases = [
      'application/json',
      'text/plain',
      'text/html',
      'application/octet-stream',
      '', // empty content type
      null, // null content type
    ];

    for (const contentType of testCases) {
      const headers: Record<string, string> = {};
      if (contentType) {
        headers['content-type'] = contentType;
      }

      const response = new Response('test data', {
        headers: contentType ? headers : undefined,
      });

      const exchange: FetchExchange = {
        fetcher: mockFetcher,
        url: 'http://example.com/api',
        request: {},
        response: response,
        error: undefined,
      };

      const result = interceptor.intercept(exchange);

      expect(result.response?.eventStream).toBeUndefined();
    }
  });

  it('should handle response with multiple content-type headers', () => {
    // Create a response with multiple content-type headers (invalid but possible)
    const response = new Response('data: test\n\n');
    response.headers.append('content-type', 'text/event-stream');
    response.headers.append('content-type', 'application/json');

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should still add eventStream method if any header matches
    expect(result.response?.eventStream).toBeDefined();
  });

  it('should preserve existing response properties', () => {
    const response = new Response('data: hello\n\n', {
      status: 201,
      statusText: 'Created',
      headers: {
        'content-type': 'text/event-stream',
        'custom-header': 'custom-value',
      },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should preserve all original response properties
    expect(result.response?.status).toBe(201);
    expect(result.response?.statusText).toBe('Created');
    expect(result.response?.headers.get('custom-header')).toBe('custom-value');

    // Should add eventStream method
    expect(result.response?.eventStream).toBeDefined();
  });

  it('should handle response with no body', () => {
    const response = new Response(null, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should still add eventStream method even with null body
    expect(result.response?.eventStream).toBeDefined();
  });

  it('should handle response with empty body', () => {
    const response = new Response('', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should still add eventStream method even with empty body
    expect(result.response?.eventStream).toBeDefined();
  });

  it('should not modify exchange when response is undefined', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: undefined,
      error: new Error('Test error'),
    };

    const result = interceptor.intercept(exchange);

    // Should return the same exchange object
    expect(result).toBe(exchange);
    expect(result.response).toBeUndefined();
  });

  it('should not modify exchange when response is null', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: null,
      error: undefined,
    } as unknown as FetchExchange;

    const result = interceptor.intercept(exchange);

    // Should return the same exchange object
    expect(result).toBe(exchange);
    expect(result.response).toBeNull();
  });

  it('should be idempotent when called multiple times', () => {
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {},
      response: response,
      error: undefined,
    };

    // Call interceptor multiple times
    const result1 = interceptor.intercept(exchange);
    const result2 = interceptor.intercept(result1);
    const result3 = interceptor.intercept(result2);

    // All results should be the same object
    expect(result1).toBe(exchange);
    expect(result2).toBe(exchange);
    expect(result3).toBe(exchange);

    // Response should have eventStream method
    expect(result1.response?.eventStream).toBeDefined();
    expect(result2.response?.eventStream).toBeDefined();
    expect(result3.response?.eventStream).toBeDefined();
  });
});
