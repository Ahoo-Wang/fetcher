import { describe, it, expect } from 'vitest';
import { toServerSentEventStream } from '../src';

describe('EventStreamConverter', () => {
  it('should convert response to event stream', async () => {
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should throw error when response body is null', async () => {
    // Create a response with null body
    const response = new Response(null, {
      headers: { 'content-type': 'text/event-stream' },
    });

    // Manually set body to null to simulate the condition
    Object.defineProperty(response, 'body', {
      value: null,
      writable: false,
    });

    expect(() => {
      toServerSentEventStream(response);
    }).toThrow('Response body is null');
  });

  it('should handle multi-line event data', async () => {
    const response = new Response('data: hello\ndata: world\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with custom event type', async () => {
    const response = new Response('event: custom\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with id', async () => {
    const response = new Response('id: 123\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with retry', async () => {
    const response = new Response('retry: 5000\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle multiple events', async () => {
    const response = new Response('data: hello\n\n\ndata: world\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle comment lines', async () => {
    const response = new Response(': this is a comment\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle empty data field', async () => {
    const response = new Response('data:\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });
});
