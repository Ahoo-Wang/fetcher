import { describe, it, expect } from 'vitest';
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream Additional Coverage', () => {
  it('should handle field without colon - branch coverage', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test the branch where colonIndex === -1
    writer.write('data\n'); // No colon in this line
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: '', // Empty because value is empty when no colon
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle field with space after colon - branch coverage', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test the branch where value starts with space
    writer.write('data:  hello world\n'); // Two spaces after colon
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello world', // Should remove only one leading space
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle multiple events with preserved state', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // First event with retry and id
    writer.write('retry: 3000\n');
    writer.write('id: event1\n');
    writer.write('data: first\n');
    writer.write('\n');

    // Second event without retry and id (should preserve previous values)
    writer.write('data: second\n');
    writer.write('\n');
    writer.close();

    // Read first event
    const firstResult = await reader.read();
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toEqual({
      event: 'message',
      data: 'first',
      id: 'event1',
      retry: 3000,
    });

    // Read second event
    const secondResult = await reader.read();
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toEqual({
      event: 'message',
      data: 'second',
      id: 'event1', // Should preserve previous id
      retry: 3000, // Should preserve previous retry
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle empty lines correctly', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write multiple empty lines between events
    writer.write('data: first\n');
    writer.write('\n');
    writer.write('\n'); // Extra empty line
    writer.write('\n'); // Another extra empty line
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

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle trailing whitespace in fields and values', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write fields and values with trailing whitespace
    writer.write('data : hello world \n'); // Space before colon and trailing space in value
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello world', // Should trim trailing whitespace
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
