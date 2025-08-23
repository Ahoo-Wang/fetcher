import { describe, it, expect, vi } from 'vitest';
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
      url: 'http://example.com',
      request: {},
      response: response,
      error: undefined,
    };

    const interceptedExchange = interceptor.intercept(exchange);

    expect(interceptedExchange.response?.eventStream).toBeDefined();
    expect(typeof interceptedExchange.response?.eventStream).toBe('function');
  });

  it('should not add eventStream method to response when content-type is not text/event-stream', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world', {
      headers: { 'content-type': 'text/plain' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {},
      response: response,
      error: undefined,
    };

    const interceptedExchange = interceptor.intercept(exchange);

    expect(interceptedExchange.response?.eventStream).toBeUndefined();
  });

  it('should not add eventStream method to response when content-type is null', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world');

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {},
      response: response,
      error: undefined,
    };

    const interceptedExchange = interceptor.intercept(exchange);

    expect(interceptedExchange.response?.eventStream).toBeUndefined();
  });

  it('should return the same exchange object', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {},
      response: response,
      error: undefined,
    };

    const interceptedExchange = interceptor.intercept(exchange);

    expect(interceptedExchange).toBe(exchange);
  });

  it('should call EventStreamConverter when eventStream method is called', async () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {},
      response: response,
      error: undefined,
    };

    const interceptedExchange = interceptor.intercept(exchange);

    if (interceptedExchange.response?.eventStream) {
      interceptedExchange.response.eventStream();

      // Verify that EventStreamConverter.toEventStream was called with the response
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    } else {
      throw new Error('eventStream method should be defined');
    }
  });
});
