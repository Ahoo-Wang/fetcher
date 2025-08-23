import { describe, it, expect } from 'vitest';
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream', () => {
  it('should parse simple event', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write a simple event
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should parse event with custom event type', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with custom event type
    writer.write('event: custom\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'custom',
      data: 'hello',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should parse event with id', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with id
    writer.write('id: 123\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '123',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should parse event with retry', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with retry
    writer.write('retry: 5000\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: 5000,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should parse multi-line data', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with multi-line data
    writer.write('data: hello\n');
    writer.write('data: world\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello\nworld',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should ignore comment lines', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with comment lines
    writer.write(': this is a comment\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle empty data field', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with empty data field
    writer.write('data:\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: '',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle multiple events', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write multiple events
    writer.write('data: first\n');
    writer.write('\n');
    writer.write('data: second\n');
    writer.write('\n');
    writer.close();

    // Read first event
    const firstResult = await reader.read();
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toEqual({
      event: 'message',
      data: 'first',
      id: '',
      retry: undefined,
    });

    // Read second event
    const secondResult = await reader.read();
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toEqual({
      event: 'message',
      data: 'second',
      id: '',
      retry: undefined,
    });

    // Check that stream is done
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle event with colon in data', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with colon in data
    writer.write('data: hello: world\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello: world',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle event with space after colon', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with space after colon
    writer.write('data: hello world\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello world',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should preserve last event ID for subsequent events', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write first event with ID
    writer.write('id: 123\n');
    writer.write('data: first\n');
    writer.write('\n');

    // Write second event without ID
    writer.write('data: second\n');
    writer.write('\n');
    writer.close();

    // Read first event
    const firstResult = await reader.read();
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toEqual({
      event: 'message',
      data: 'first',
      id: '123',
      retry: undefined,
    });

    // Read second event
    const secondResult = await reader.read();
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toEqual({
      event: 'message',
      data: 'second',
      id: '123', // Should preserve the last event ID
      retry: undefined,
    });

    // Check that stream is done
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should preserve retry value for subsequent events', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write first event with retry
    writer.write('retry: 5000\n');
    writer.write('data: first\n');
    writer.write('\n');

    // Write second event without retry
    writer.write('data: second\n');
    writer.write('\n');
    writer.close();

    // Read first event
    const firstResult = await reader.read();
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toEqual({
      event: 'message',
      data: 'first',
      id: '',
      retry: 5000,
    });

    // Read second event
    const secondResult = await reader.read();
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toEqual({
      event: 'message',
      data: 'second',
      id: '',
      retry: 5000, // Should preserve the last retry value
    });

    // Check that stream is done
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should reset data and event fields but preserve id and retry', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write first event with all fields
    writer.write('id: 123\n');
    writer.write('retry: 5000\n');
    writer.write('event: custom\n');
    writer.write('data: first\n');
    writer.write('\n');

    // Write second event with only data
    writer.write('data: second\n');
    writer.write('\n');
    writer.close();

    // Read first event
    const firstResult = await reader.read();
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toEqual({
      event: 'custom',
      data: 'first',
      id: '123',
      retry: 5000,
    });

    // Read second event
    const secondResult = await reader.read();
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toEqual({
      event: 'message', // Should reset to default
      data: 'second',
      id: '123', // Should preserve
      retry: 5000, // Should preserve
    });

    // Check that stream is done
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle malformed retry value gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with invalid retry value
    writer.write('retry: invalid\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined, // Should not set retry for invalid value
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
