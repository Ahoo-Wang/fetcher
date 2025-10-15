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
  type ServerSentEvent,
  ServerSentEventTransformStream,
} from './serverSentEventTransformStream';
import { FetcherError } from '@ahoo-wang/fetcher';

/**
 * A ReadableStream of ServerSentEvent objects.
 *
 * This type represents a stream that yields Server-Sent Event objects as they are parsed
 * from a raw event stream. Each chunk in the stream contains a complete SSE event with
 * its metadata (event type, ID, retry interval) and data.
 *
 * @see {@link ServerSentEvent} for the structure of individual events
 * @see {@link toServerSentEventStream} for converting HTTP responses to this type
 */
export type ServerSentEventStream = ReadableStream<ServerSentEvent>;

/**
 * Custom error class for event stream conversion errors.
 *
 * This error is thrown when there are issues converting an HTTP Response to a ServerSentEventStream.
 * It extends FetcherError to provide additional context about the failed conversion, including
 * the original Response object and any underlying cause.
 *
 * @extends {FetcherError}
 *
 * @example
 * ```typescript
 * try {
 *   const eventStream = toServerSentEventStream(response);
 * } catch (error) {
 *   if (error instanceof EventStreamConvertError) {
 *     console.error('Failed to convert response to event stream:', error.message);
 *     console.log('Response status:', error.response.status);
 *   }
 * }
 * ```
 */
export class EventStreamConvertError extends FetcherError {
  /**
   * Creates a new EventStreamConvertError instance.
   *
   * @param response - The Response object associated with the error, providing context
   *                   about the failed conversion (status, headers, etc.)
   * @param errorMsg - Optional error message describing what went wrong during conversion
   * @param cause - Optional underlying error that caused this conversion error
   */
  constructor(
    public readonly response: Response,
    errorMsg?: string,
    cause?: Error | any,
  ) {
    super(errorMsg, cause);
    this.name = 'EventStreamConvertError';
    // Restore prototype chain for proper inheritance
    Object.setPrototypeOf(this, EventStreamConvertError.prototype);
  }
}

/**
 * Converts a Response object to a ServerSentEventStream.
 *
 * This function takes an HTTP Response object and converts its body into a stream of
 * Server-Sent Event objects. The conversion process involves several transformation steps:
 *
 * 1. **TextDecoderStream**: Decodes the raw Uint8Array response body to UTF-8 strings
 * 2. **TextLineTransformStream**: Splits the text stream into individual lines
 * 3. **ServerSentEventTransformStream**: Parses the line-based SSE format into structured events
 *
 * The resulting stream can be consumed using async iteration or other stream methods.
 *
 * @param response - The HTTP Response object to convert. Must have a readable body stream.
 * @returns A ReadableStream that yields ServerSentEvent objects as they are parsed from the response
 * @throws {EventStreamConvertError} If the response body is null or cannot be processed
 *
 * @example
 * ```typescript
 * // Convert an SSE response to an event stream
 * const response = await fetch('/api/events');
 * const eventStream = toServerSentEventStream(response);
 *
 * // Consume events asynchronously
 * for await (const event of eventStream) {
 *   console.log(`Event: ${event.event}, Data: ${event.data}`);
 *
 *   // Handle different event types
 *   switch (event.event) {
 *     case 'message':
 *       handleMessage(event.data);
 *       break;
 *     case 'error':
 *       handleError(event.data);
 *       break;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handle conversion errors
 * try {
 *   const eventStream = toServerSentEventStream(response);
 *   // Use the stream...
 * } catch (error) {
 *   if (error instanceof EventStreamConvertError) {
 *     console.error('Event stream conversion failed:', error.message);
 *     console.log('Response status:', error.response.status);
 *   }
 * }
 * ```
 */
export function toServerSentEventStream(
  response: Response,
): ServerSentEventStream {
  if (!response.body) {
    throw new EventStreamConvertError(response, 'Response body is null');
  }

  return response.body
    .pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(new TextLineTransformStream())
    .pipeThrough(new ServerSentEventTransformStream());
}
