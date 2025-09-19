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

// Check if ReadableStream already has [Symbol.asyncIterator] implemented
export const isReadableStreamAsyncIterableSupported =
  typeof ReadableStream.prototype[Symbol.asyncIterator] === 'function';

// Add [Symbol.asyncIterator] to ReadableStream if not already implemented
if (!isReadableStreamAsyncIterableSupported) {
  ReadableStream.prototype[Symbol.asyncIterator] = function <R = any>() {
    return new ReadableStreamAsyncIterable<R>(this as ReadableStream<R>);
  };
}
