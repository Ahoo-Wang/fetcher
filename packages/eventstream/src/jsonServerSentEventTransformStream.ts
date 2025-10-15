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

import { type ServerSentEvent } from './serverSentEventTransformStream';
import { ServerSentEventStream } from './eventStreamConverter';

/**
 * A function type that determines whether a Server-Sent Event should terminate the stream.
 *
 * This detector function is called for each incoming ServerSentEvent. If it returns true,
 * the stream transformation will be terminated, preventing further events from being processed.
 *
 * @param event - The ServerSentEvent to evaluate for termination
 * @returns true if the stream should be terminated, false otherwise
 *
 * @example
 * ```typescript
 * const terminateOnDone: TerminateDetector = (event) => {
 *   return event.event === 'done' || event.data === '[DONE]';
 * };
 * ```
 */
export type TerminateDetector = (event: ServerSentEvent) => boolean;

/**
 * Represents a Server-Sent Event with parsed JSON data.
 *
 * This interface extends the base ServerSentEvent but replaces the string 'data' field
 * with a parsed JSON object of the specified generic type. This allows for type-safe
 * access to the event payload.
 *
 * @template DATA - The expected type of the parsed JSON data
 */
export interface JsonServerSentEvent<DATA>
  extends Omit<ServerSentEvent, 'data'> {
  /** The parsed JSON data from the event */
  data: DATA;
}

/**
 * A TransformStream transformer that converts ServerSentEvent to JsonServerSentEvent with optional termination detection.
 *
 * This transformer parses the JSON data from ServerSentEvent chunks and optionally terminates
 * the stream when a termination condition is met. It's designed to work within a TransformStream
 * to convert raw server-sent events into typed JSON events.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export class JsonServerSentEventTransform<DATA>
  implements Transformer<ServerSentEvent, JsonServerSentEvent<DATA>>
{
  /**
   * Creates a new JsonServerSentEventTransform instance.
   *
   * @param terminateDetector - Optional function to detect when the stream should be terminated.
   *                           If provided, this function is called for each event and can terminate
   *                           the stream by returning true.
   */
  constructor(private readonly terminateDetector?: TerminateDetector) {}

  /**
   * Transforms a ServerSentEvent chunk into a JsonServerSentEvent.
   *
   * This method first checks if the event should terminate the stream using the terminateDetector.
   * If termination is required, the controller is terminated. Otherwise, the event data is parsed
   * as JSON and enqueued as a JsonServerSentEvent.
   *
   * @param chunk - The ServerSentEvent to transform
   * @param controller - The TransformStream controller for managing the stream
   * @throws {SyntaxError} If the event data is not valid JSON
   *
   * @example
   * ```typescript
   * const transformer = new JsonServerSentEventTransform<MyData>();
   * // This will be called automatically by the TransformStream
   * ```
   */
  transform(
    chunk: ServerSentEvent,
    controller: TransformStreamDefaultController<JsonServerSentEvent<DATA>>,
  ) {
    // Check if this is a terminate event
    if (this.terminateDetector?.(chunk)) {
      controller.terminate();
      return;
    }

    const json = JSON.parse(chunk.data) as DATA;
    controller.enqueue({
      data: json,
      event: chunk.event,
      id: chunk.id,
      retry: chunk.retry,
    });
  }
}

/**
 * A TransformStream that converts ServerSentEvent streams to JsonServerSentEvent streams with optional termination detection.
 *
 * This class extends TransformStream to provide a convenient way to transform streams of ServerSentEvent
 * objects into streams of JsonServerSentEvent objects. It supports optional termination detection to
 * automatically end the stream when certain conditions are met.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export class JsonServerSentEventTransformStream<DATA> extends TransformStream<
  ServerSentEvent,
  JsonServerSentEvent<DATA>
> {
  /**
   * Creates a new JsonServerSentEventTransformStream instance.
   *
   * @param terminateDetector - Optional function to detect when the stream should be terminated.
   *                           When provided, the stream will automatically terminate when this
   *                           function returns true for any event.
   *
   * @example
   * ```typescript
   * // Create a stream that terminates on 'done' events
   * const terminateOnDone: TerminateDetector = (event) => event.event === 'done';
   * const transformStream = new JsonServerSentEventTransformStream<MyData>(terminateOnDone);
   *
   * // Create a stream without termination detection
   * const basicStream = new JsonServerSentEventTransformStream<MyData>();
   * ```
   */
  constructor(terminateDetector?: TerminateDetector) {
    super(new JsonServerSentEventTransform(terminateDetector));
  }
}

/**
 * A ReadableStream of JsonServerSentEvent objects.
 *
 * This type represents a stream that yields parsed JSON server-sent events.
 * Each chunk in the stream contains the event metadata along with parsed JSON data.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export type JsonServerSentEventStream<DATA> = ReadableStream<
  JsonServerSentEvent<DATA>
>;

/**
 * Converts a ServerSentEventStream to a JsonServerSentEventStream with optional termination detection.
 *
 * This function takes a stream of raw server-sent events and transforms it into a stream of
 * parsed JSON events. It optionally accepts a termination detector to automatically end the
 * stream when certain conditions are met.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 * @param serverSentEventStream - The input stream of ServerSentEvent objects to transform
 * @param terminateDetector - Optional function to detect when the stream should be terminated
 * @returns A ReadableStream that yields JsonServerSentEvent objects with parsed JSON data
 * @throws {SyntaxError} If any event data is not valid JSON (thrown during stream consumption)
 *
 * @example
 * ```typescript
 * // Basic usage without termination detection
 * const jsonStream = toJsonServerSentEventStream<MyData>(serverSentEventStream);
 *
 * // With termination detection
 * const terminateOnDone: TerminateDetector = (event) => event.data === '[DONE]';
 * const terminatingStream = toJsonServerSentEventStream<MyData>(
 *   serverSentEventStream,
 *   terminateOnDone
 * );
 *
 * // Consume the stream
 * for await (const event of jsonStream) {
 *   console.log('Received:', event.data);
 *   console.log('Event type:', event.event);
 * }
 * ```
 */
export function toJsonServerSentEventStream<DATA>(
  serverSentEventStream: ServerSentEventStream,
  terminateDetector?: TerminateDetector,
): JsonServerSentEventStream<DATA> {
  return serverSentEventStream.pipeThrough(
    new JsonServerSentEventTransformStream<DATA>(terminateDetector),
  );
}
