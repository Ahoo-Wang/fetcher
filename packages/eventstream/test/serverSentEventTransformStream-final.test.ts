import { describe, it, expect } from 'vitest';
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream Final Coverage', () => {
  it('should handle all field types for branch coverage', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test all field types to ensure branch coverage
    writer.write('event: customType\n');
    writer.write('data: test data\n');
    writer.write('id: testId\n');
    writer.write('retry: 1500\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'customType',
      data: 'test data',
      id: 'testId',
      retry: 1500,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle unknown field types gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test unknown field type (should be ignored)
    writer.write('unknownfield: some value\n');
    writer.write('data: test data\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'test data',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle empty field names', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test empty field name (edge case)
    writer.write(': empty field\n');
    writer.write('data: test data\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'test data',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle field with only spaces', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Test field with only spaces (should be trimmed)
    writer.write('   :   spaced field\n');
    writer.write('data: test data\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'test data',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
