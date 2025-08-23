import { describe, it, expect } from 'vitest';
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream Branch Coverage', () => {
  it('should handle undefined id in event (cover line 94)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event without id to test id || '' branch
    writer.write('data: test\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeDefined();
    // When id is undefined, it should default to empty string
    expect(value!.id).toBe('');

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle undefined id in flush (cover line 161)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event without id and without final newline to test flush
    writer.write('data: test\n');
    writer.close(); // No newline, so it goes through flush

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeDefined();
    // When id is undefined in flush, it should default to empty string
    expect(value!.id).toBe('');

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
