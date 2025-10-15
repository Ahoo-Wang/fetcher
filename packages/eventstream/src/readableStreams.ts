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

import { ReadableStreamAsyncIterable } from './readableStreamAsyncIterable';

declare global {
  interface ReadableStream<R = any> {
    /**
     * Makes ReadableStream async iterable for use with for-await loops.
     *
     * This allows the stream to be consumed using `for await (const chunk of stream)` syntax.
     *
     * @returns An async iterator for the stream
     */
    [Symbol.asyncIterator](): AsyncIterator<R>;
  }
}

/**
 * Checks if the current environment natively supports async iteration on ReadableStream.
 *
 * This constant determines whether the browser or runtime already provides
 * built-in support for using ReadableStream with for-await...of loops.
 * If not supported, this library will polyfill the functionality by adding
 * the [Symbol.asyncIterator] method to ReadableStream.prototype.
 *
 * @returns true if native async iteration is supported, false if polyfill is needed
 *
 * @example
 * ```typescript
 * import { isReadableStreamAsyncIterableSupported } from '@ahoo-wang/fetcher-eventstream';
 *
 * if (isReadableStreamAsyncIterableSupported) {
 *   console.log('Native support available');
 * } else {
 *   console.log('Using polyfill');
 * }
 * ```
 */
export const isReadableStreamAsyncIterableSupported =
  typeof ReadableStream.prototype[Symbol.asyncIterator] === 'function';

// Add [Symbol.asyncIterator] to ReadableStream if not already implemented
if (!isReadableStreamAsyncIterableSupported) {
  ReadableStream.prototype[Symbol.asyncIterator] = function <R = any>() {
    return new ReadableStreamAsyncIterable<R>(this as ReadableStream<R>);
  };
}
