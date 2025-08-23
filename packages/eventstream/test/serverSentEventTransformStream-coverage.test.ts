import { describe, it, expect } from 'vitest';
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream Coverage', () => {
  it('should handle field without colon (entire line as field name)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field without colon
    writer.write('data\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: '', // Empty data because value is empty when no colon
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle unknown fields gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with unknown field
    writer.write('unknownfield: some value\n');
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

  it('should handle field with only colon', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that is just a colon
    writer.write(':\n');
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

  it('should handle field with colon at the end', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that ends with colon
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

  it('should handle field with colon at the beginning', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that starts with colon (this should be treated as comment)
    writer.write(':data: hello\n');
    writer.write('data: world\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'world',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle NaN retry values gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with NaN retry value
    writer.write('retry: not-a-number\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined, // Should remain undefined for NaN values
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
