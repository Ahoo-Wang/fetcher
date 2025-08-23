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
import { toServerSentEventStream } from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

// Mock the EventStreamConverter
vi.mock('../src/eventStreamConverter', async () => {
  const actual = await vi.importActual('../src/eventStreamConverter');
  return {
    ...actual,
    toServerSentEventStream: vi.fn().mockReturnValue(new ReadableStream()),
  };
});

describe('EventStreamInterceptor Integration', () => {
  const mockFetcher = new Fetcher();
  const interceptor = new EventStreamInterceptor();

  it('should properly integrate with FetchExchange', () => {
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {
        method: 'GET',
      },
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should return the same exchange object
    expect(result).toBe(exchange);

    // Response should have eventStream method
    expect(result.response?.eventStream).toBeDefined();
    expect(typeof result.response?.eventStream).toBe('function');
  });

  it('should not modify exchange when response is undefined', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {
        method: 'GET',
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should return the same exchange object
    expect(result).toBe(exchange);

    // Response should remain undefined
    expect(result.response).toBeUndefined();
  });

  it('should not modify exchange when content-type is not event-stream', () => {
    const response = new Response('{"data": "json"}', {
      headers: { 'content-type': 'application/json' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/api',
      request: {
        method: 'GET',
      },
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Should return the same exchange object
    expect(result).toBe(exchange);

    // Response should not have eventStream method
    expect(result.response?.eventStream).toBeUndefined();
  });

  it('should work with actual event stream conversion', () => {
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com/events',
      request: {
        method: 'GET',
      },
      response: response,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);

    // Call the eventStream method
    if (result.response?.eventStream) {
      const stream = result.response.eventStream();

      // Verify it returns a ReadableStream
      expect(stream).toBeInstanceOf(ReadableStream);

      // Verify toServerSentEventStream was called with the response
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    } else {
      throw new Error('eventStream method should be defined');
    }
  });
});
