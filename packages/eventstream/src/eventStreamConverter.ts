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

import { TextLineTransformStream } from './textLineTransformStream';
import {
  ServerSentEvent,
  ServerSentEventTransformStream,
} from './serverSentEventTransformStream';

/**
 * A ReadableStream of ServerSentEvent objects.
 */
export type ServerSentEventStream = ReadableStream<ServerSentEvent>;

/**
 * Converts a Response object to a ServerSentEventStream.
 *
 * Processes the response body through a series of transform streams:
 * 1. TextDecoderStream: Decode Uint8Array data to UTF-8 strings
 * 2. TextLineStream: Split text by lines
 * 3. ServerSentEventStream: Parse line data into server-sent events
 *
 * @param response - The Response object to convert
 * @returns A ReadableStream of ServerSentEvent objects
 * @throws Error if the response body is null
 */
export function toServerSentEventStream(
  response: Response,
): ServerSentEventStream {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body
    .pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(new TextLineTransformStream())
    .pipeThrough(new ServerSentEventTransformStream());
}
