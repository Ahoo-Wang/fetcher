import { describe, it, expect, vi } from 'vitest';
import { EventStreamInterceptor, toServerSentEventStream } from '../src';

// Mock the EventStreamConverter
vi.mock('../src/eventStreamConverter', async () => {
  const actual = await vi.importActual('../src/eventStreamConverter');
  return {
    ...actual,
    toServerSentEventStream: vi.fn().mockReturnValue(new ReadableStream()),
  };
});

describe('EventStreamInterceptor', () => {
  it('should add eventStream method to response when content-type is text/event-stream', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const interceptedResponse = interceptor.intercept(response);

    expect(interceptedResponse.eventStream).toBeDefined();
    expect(typeof interceptedResponse.eventStream).toBe('function');
  });

  it('should not add eventStream method to response when content-type is not text/event-stream', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world', {
      headers: { 'content-type': 'text/plain' },
    });

    const interceptedResponse = interceptor.intercept(response);

    expect(interceptedResponse.eventStream).toBeUndefined();
  });

  it('should not add eventStream method to response when content-type is null', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('hello world');

    const interceptedResponse = interceptor.intercept(response);

    expect(interceptedResponse.eventStream).toBeUndefined();
  });

  it('should return the same response object', () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const interceptedResponse = interceptor.intercept(response);

    expect(interceptedResponse).toBe(response);
  });

  it('should call EventStreamConverter when eventStream method is called', async () => {
    const interceptor = new EventStreamInterceptor();
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const interceptedResponse = interceptor.intercept(response);

    if (interceptedResponse.eventStream) {
      const stream = interceptedResponse.eventStream();

      // Verify that EventStreamConverter.toEventStream was called with the response
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    } else {
      throw new Error('eventStream method should be defined');
    }
  });
});
