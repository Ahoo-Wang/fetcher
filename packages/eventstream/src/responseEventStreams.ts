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

/**
 * The protocol checks and conversions behind the `Response.prototype`
 * helpers, as plain functions of the response. They only use the standard
 * `headers` and `body` members, so they also work on a response the helpers
 * were never installed on: one from another realm (an iframe's `fetch`), or
 * from another `Response` implementation (a separately installed `undici`, a
 * polyfill) returned by a custom `fetch`. The result extractors use these
 * rather than the prototype helpers for that reason.
 *
 * Internal: not exported from the package index.
 */

import { CONTENT_TYPE_HEADER, ContentTypeValues } from '@ahoo-wang/fetcher';
import {
  EventStreamConvertError,
  type ServerSentEventStream,
  toServerSentEventStream,
} from './eventStreamConverter.js';
import {
  type JsonServerSentEventStream,
  type TerminateDetector,
  toJsonServerSentEventStream,
} from './jsonServerSentEventTransformStream.js';

/**
 * The response's Content-Type header, or null when it has none.
 */
export function responseContentType(response: Response): string | null {
  return response.headers.get(CONTENT_TYPE_HEADER);
}

/**
 * Whether the response's media type is `text/event-stream`, compared
 * case-insensitively and ignoring parameters such as `charset`.
 */
export function isEventStreamResponse(response: Response): boolean {
  const contentType = responseContentType(response);
  if (!contentType) {
    return false;
  }
  return (
    contentType.split(';', 1)[0].trim().toLowerCase() ===
    ContentTypeValues.TEXT_EVENT_STREAM
  );
}

/**
 * The response's body as a {@link ServerSentEventStream}.
 *
 * @throws {EventStreamConvertError} When the response is not an event stream,
 * or its body is null or already used
 */
export function requireResponseEventStream(
  response: Response,
): ServerSentEventStream {
  if (!isEventStreamResponse(response)) {
    throw new EventStreamConvertError(
      response,
      `Event stream is not available. Response content-type: [${responseContentType(response)}]`,
    );
  }
  return toServerSentEventStream(response);
}

/**
 * The response's body as a {@link JsonServerSentEventStream}.
 *
 * @throws {EventStreamConvertError} When the response is not an event stream,
 * or its body is null or already used
 */
export function requireResponseJsonEventStream<DATA>(
  response: Response,
  terminateDetector?: TerminateDetector,
): JsonServerSentEventStream<DATA> {
  return toJsonServerSentEventStream<DATA>(
    requireResponseEventStream(response),
    terminateDetector,
  );
}
