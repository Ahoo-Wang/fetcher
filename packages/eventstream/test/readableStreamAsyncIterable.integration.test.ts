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

describe('ReadableStreamAsyncIterable Integration', () => {
  it('should work with native async iterator if available', async () => {
    const data = [1, 2, 3];
    const stream = new ReadableStream({
      start(controller) {
        for (const item of data) {
          controller.enqueue(item);
        }
        controller.close();
      },
    });

    // Check if native async iterator is available
    const hasNativeAsyncIterator = typeof stream[Symbol.asyncIterator] === 'function';

    if (hasNativeAsyncIterator) {
      // Use native implementation
      const result = [];
      for await (const item of stream) {
        result.push(item);
      }
      expect(result).toEqual(data);
    } else {
      // Use our polyfill
      const asyncIterable = new ReadableStreamAsyncIterable(stream);
      const result = [];
      for await (const item of asyncIterable) {
        result.push(item);
      }
      expect(result).toEqual(data);
    }
  });

  it('should work with our implementation when native is not available', async () => {
    const data = [1, 2, 3];
    const stream = new ReadableStream({
      start(controller) {
        for (const item of data) {
          controller.enqueue(item);
        }
        controller.close();
      },
    });

    // Force use our implementation by directly creating it
    const asyncIterable = new ReadableStreamAsyncIterable(stream);
    const result = [];
    for await (const item of asyncIterable) {
      result.push(item);
    }
    expect(result).toEqual(data);
  });
});