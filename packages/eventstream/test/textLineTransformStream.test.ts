import { describe, it, expect } from 'vitest';
import { TextLineTransformStream } from '../src';

describe('TextLineTransformStream', () => {
  it('should split chunks by newlines', async () => {
    const stream = new TextLineTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write('hello\nworld\n');
    writer.close();

    const chunks: string[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value !== undefined) {
        chunks.push(value);
      }
    }

    expect(chunks).toEqual(['hello', 'world']);
  }, 10000);

  it('should handle chunks without newlines', async () => {
    const stream = new TextLineTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write('hello');
    writer.write('world');
    writer.close();

    const chunks: string[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value !== undefined) {
        chunks.push(value);
      }
    }

    expect(chunks).toEqual(['helloworld']);
  }, 10000);

  it('should handle mixed chunks with and without newlines', async () => {
    const stream = new TextLineTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write('hello\nwo');
    writer.write('rld\nfoo');
    writer.write('\nbar');
    writer.close();

    const chunks: string[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value !== undefined) {
        chunks.push(value);
      }
    }

    expect(chunks).toEqual(['hello', 'world', 'foo', 'bar']);
  }, 10000);

  it('should handle empty chunks', async () => {
    const stream = new TextLineTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write('');
    writer.write('\n');
    writer.write('');
    writer.close();

    const chunks: string[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value !== undefined) {
        chunks.push(value);
      }
    }

    // The TextLineStream should only emit one empty string for the newline
    // The trailing empty string should not be emitted
    expect(chunks).toEqual(['']);
  }, 10000);

  it('should handle trailing content without newline', async () => {
    const stream = new TextLineTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write('hello\nworld');
    writer.close();

    const chunks: string[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value !== undefined) {
        chunks.push(value);
      }
    }

    expect(chunks).toEqual(['hello', 'world']);
  }, 10000);
});
