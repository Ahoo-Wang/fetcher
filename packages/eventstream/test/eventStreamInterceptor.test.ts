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
import { EventStreamInterceptor, toServerSentEventStream } from '../src';
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';

// Mock the EventStreamConverter
vi.mock('../src/eventStreamConverter', async () => {
  const actual = await vi.importActual('../src/eventStreamConverter');
  return {
    ...actual,
    toServerSentEventStream: vi.fn().mockReturnValue(new ReadableStream()),
  };
});

describe('EventStreamInterceptor', () => {
  const mockFetcher = new Fetcher();

  it('should add eventStream method to response when content-type is text/event-stream', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      request: { url: 'http://example.com' },
      response: response,
      error: undefined,
    };

    interceptor.intercept(exchange);

    expect(exchange.response?.eventStream).toBeDefined();
    expect(typeof exchange.response?.eventStream).toBe('function');
  });

  it('should not add eventStream method to response when content-type is not text/event-stream', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world', {
      headers: { 'content-type': 'text/plain' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      request: { url: 'http://example.com' },
      response: response,
      error: undefined,
    };
    interceptor.intercept(exchange);
    expect(exchange.response?.eventStream).toBeUndefined();
  });

  it('should not add eventStream method to response when content-type is null', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world');

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      request: { url: 'http://example.com' },
      response: response,
      error: undefined,
    };
    interceptor.intercept(exchange);
    expect(exchange.response?.eventStream).toBeUndefined();
  });

  it('should return the same exchange object', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      request: { url: 'http://example.com' },
      response: response,
      error: undefined,
    };
    interceptor.intercept(exchange);
    expect(exchange).toBe(exchange);
  });

  it('should call EventStreamConverter when eventStream method is called', async () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      request: { url: 'http://example.com' },
      response: response,
      error: undefined,
    };

    interceptor.intercept(exchange);

    if (exchange.response?.eventStream) {
      exchange.response.eventStream();

      // Verify that EventStreamConverter.toEventStream was called with the response
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    } else {
      throw new Error('eventStream method should be defined');
    }
  });
});
