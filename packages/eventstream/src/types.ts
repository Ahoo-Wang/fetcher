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

import { ServerSentEventStream } from './eventStreamConverter';
import { JsonServerSentEventStream } from './jsonServerSentEventTransformStream';

declare global {
  interface Response {
    /**
     * Returns a ServerSentEventStream for consuming server-sent events.
     *
     * This method is added to Response objects by the EventStreamInterceptor
     * when the response content type indicates a server-sent event stream.
     *
     * @returns A ReadableStream of ServerSentEvent objects
     */
    eventStream?(): ServerSentEventStream;

    /**
     * Returns a JsonServerSentEventStream for consuming server-sent events with JSON data.
     *
     * This method is added to Response objects by the EventStreamInterceptor
     * when the response content type indicates a server-sent event stream.
     *
     * @template DATA - The type of the JSON data in the server-sent events
     * @returns A ReadableStream of ServerSentEvent objects with JSON data
     */
    jsonEventStream?<DATA>(): JsonServerSentEventStream<DATA>;
  }

  interface ReadableStream<R = any> {
    /**
     * Makes ReadableStream async iterable for use with for-await loops.
     */
    [Symbol.asyncIterator](): AsyncIterator<R>;
  }
}
