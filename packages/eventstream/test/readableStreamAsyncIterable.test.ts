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
import { ReadableStreamAsyncIterable } from '../src';

describe('ReadableStreamAsyncIterable', () => {
  it('should create an instance with a ReadableStream', () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
        controller.close();
      },
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    expect(iterable).toBeInstanceOf(ReadableStreamAsyncIterable);
  });

  it('should be able to iterate over stream values', async () => {
    const testData = ['value1', 'value2', 'value3'];
    const stream = new ReadableStream({
      start(controller) {
        testData.forEach(data => controller.enqueue(data));
        controller.close();
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    const results: string[] = [];

    for await (const value of iterable) {
      results.push(value);
    }

    expect(results).toEqual(testData);
  });

  it('should handle empty stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    const results: any[] = [];

    for await (const value of iterable) {
      results.push(value);
    }

    expect(results).toEqual([]);
  });

  it('should release lock after iteration', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
        controller.close();
      },
    });

    const iterable = new ReadableStreamAsyncIterable(stream);

    // Consume the stream
    const results: string[] = [];
    for await (const value of iterable) {
      results.push(value);
    }

    // Try to get another reader (should work if lock was released)
    expect(() => stream.getReader()).not.toThrow();
    expect(results).toEqual(['test']);
  });

  it('should handle stream errors', async () => {
    const testError = new Error('Test error');
    const stream = new ReadableStream({
      start(controller) {
        controller.error(testError);
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const value of iterable) {
        // This should not be reached
      }
    }).rejects.toThrow(testError);
  });

  it('should handle manual return call', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    const iterator = iterable[Symbol.asyncIterator]();

    const result = await iterator.return!();
    expect(result).toEqual({ done: true, value: undefined });
  });

  it('should handle throw method', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    const iterator = iterable[Symbol.asyncIterator]();

    const result = await iterator.throw!(new Error('Test error'));
    expect(result).toEqual({ done: true, value: undefined });
  });

  it('should release lock when calling releaseLock method', () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);

    // Should not throw when releasing lock
    expect(() => iterable.releaseLock()).not.toThrow();

    // Calling again should not throw either
    expect(() => iterable.releaseLock()).not.toThrow();
  });

  it('should handle exceptions when releasing lock', () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
      }
    });

    const iterable = new ReadableStreamAsyncIterable(stream);

    // Mock the releaseLock method to throw an error
    vi.spyOn(iterable['reader'], 'releaseLock').mockImplementation(() => {
      throw new Error('Release lock error');
    });

    // Should not throw when releasing lock even if an error occurs
    expect(() => iterable.releaseLock()).not.toThrow();

    // The locked state should still be updated
    expect(iterable['locked']).toBe(false);
  });

  it('should handle exceptions when canceling stream reader in return method', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
      },
    });

    const iterable = new ReadableStreamAsyncIterable(stream);
    const iterator = iterable[Symbol.asyncIterator]();

    // Mock the cancel method to throw an error
    vi.spyOn(iterable['reader'], 'cancel').mockImplementation(() => {
      throw new Error('Cancel error');
    });

    // Should not throw when calling return even if cancel fails
    const result = await iterator.return!();

    // Should still return done result
    expect(result).toEqual({ done: true, value: undefined });

    // Lock should still be released
    expect(iterable['locked']).toBe(false);
  });

  it('should handle calling return method when already unlocked', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
        controller.close();
      },
    });

    const iterable = new ReadableStreamAsyncIterable(stream);

    // Consume the stream to unlock it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const value of iterable) {
      // Just consume the value
    }

    // Verify it's unlocked
    expect(iterable['locked']).toBe(false);

    // Calling return should still work
    const iterator = iterable[Symbol.asyncIterator]();
    const result = await iterator.return!();
    expect(result).toEqual({ done: true, value: undefined });
  });

  it('should handle calling throw method when already unlocked', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
        controller.close();
      },
    });

    const iterable = new ReadableStreamAsyncIterable(stream);

    // Consume the stream to unlock it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const value of iterable) {
      // Just consume the value
    }

    // Verify it's unlocked
    expect(iterable['locked']).toBe(false);

    // Calling throw should still work
    const iterator = iterable[Symbol.asyncIterator]();
    const result = await iterator.throw!(new Error('Test error'));
    expect(result).toEqual({ done: true, value: undefined });
  });
});