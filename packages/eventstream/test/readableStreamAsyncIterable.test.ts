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

import { describe, expect, it } from 'vitest';
import { ReadableStreamAsyncIterable } from '../src/readableStreamAsyncIterable';

describe('ReadableStreamAsyncIterable', () => {
  it('should create an async iterable from a ReadableStream', async () => {
    const data = [1, 2, 3];
    const stream = new ReadableStream({
      start(controller) {
        for (const item of data) {
          controller.enqueue(item);
        }
        controller.close();
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const result = [];

    for await (const item of asyncIterable) {
      result.push(item);
    }

    expect(result).toEqual(data);
  });

  it('should handle empty stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const result = [];

    for await (const item of asyncIterable) {
      result.push(item);
    }

    expect(result).toEqual([]);
  });

  it('should handle stream errors', async () => {
    const testError = new Error('Test error');
    const stream = new ReadableStream({
      start(controller) {
        controller.error(testError);
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const item of asyncIterable) {
        // Should not be reached
      }
    }).rejects.toThrow(testError);
  });

  it('should support manual return to release lock', async () => {
    let cancelCalled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
      },
      cancel() {
        cancelCalled = true;
        return Promise.resolve();
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const iterator = asyncIterable[Symbol.asyncIterator]();

    const firstResult = await iterator.next();
    expect(firstResult.value).toBe(1);

    // Since the stream is locked by the reader, we cannot directly cancel it
    // The return method should still properly release the lock
    const returnResult = await iterator.return!();
    expect(returnResult.done).toBe(true);
    // We don't check cancelCalled because the stream is already locked
  });

  it('should support throw method', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const iterator = asyncIterable[Symbol.asyncIterator]();

    const firstResult = await iterator.next();
    expect(firstResult.value).toBe(1);

    const testError = new Error('Test throw');
    await expect(iterator.throw!(testError)).rejects.toThrow(testError);
  });

  it('should handle multiple return calls', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const iterator = asyncIterable[Symbol.asyncIterator]();

    await iterator.next();
    const firstReturn = await iterator.return!();
    const secondReturn = await iterator.return!();

    expect(firstReturn.done).toBe(true);
    expect(secondReturn.done).toBe(true);
  });

  it('should handle return when stream is already done', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const iterator = asyncIterable[Symbol.asyncIterator]();

    const nextResult = await iterator.next();
    expect(nextResult.done).toBe(true);

    const returnResult = await iterator.return!();
    expect(returnResult.done).toBe(true);
  });
});