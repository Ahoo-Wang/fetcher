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
import type { ServerSentEventStream } from './eventStreamConverter';
import { SafeTransformer } from './safeTransformer';

/**
 * A function type that determines whether a Server-Sent Event should terminate the stream.
 *
 * @param event - The ServerSentEvent to evaluate for termination
 * @returns true if the stream should be terminated, false otherwise
 */
export type TerminateDetector = (event: ServerSentEvent) => boolean;

/**
 * Represents a Server-Sent Event with parsed JSON data.
 *
 * @template DATA - The expected type of the parsed JSON data
 */
export interface JsonServerSentEvent<DATA> extends Omit<
  ServerSentEvent,
  'data'
> {
  /** The parsed JSON data from the event */
  data: DATA;
}

/**
 * A TransformStream transformer that converts ServerSentEvent to
 * JsonServerSentEvent with optional termination detection.
 *
 * Inherits termination guard and safe controller operations from SafeTransformer.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export class JsonServerSentEventTransform<DATA> extends SafeTransformer<
  ServerSentEvent,
  JsonServerSentEvent<DATA>
> {
  constructor(private readonly terminateDetector?: TerminateDetector) {
    super();
  }

  protected onTransform(
    chunk: ServerSentEvent,
    controller: TransformStreamDefaultController<JsonServerSentEvent<DATA>>,
  ): void {
    // Check if this is a terminate event
    if (this.terminateDetector?.(chunk)) {
      this.terminate(controller);
      return;
    }

    const json = JSON.parse(chunk.data) as DATA;
    this.enqueue(controller, {
      data: json,
      event: chunk.event,
      id: chunk.id,
      retry: chunk.retry,
    });
  }
}

/**
 * A TransformStream that converts ServerSentEvent streams to
 * JsonServerSentEvent streams with optional termination detection.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export class JsonServerSentEventTransformStream<DATA> extends TransformStream<
  ServerSentEvent,
  JsonServerSentEvent<DATA>
> {
  constructor(terminateDetector?: TerminateDetector) {
    super(new JsonServerSentEventTransform<DATA>(terminateDetector));
  }
}

/**
 * A ReadableStream of JsonServerSentEvent objects.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 */
export type JsonServerSentEventStream<DATA> = ReadableStream<
  JsonServerSentEvent<DATA>
>;

/**
 * Converts a ServerSentEventStream to a JsonServerSentEventStream with optional termination detection.
 *
 * @template DATA - The expected type of the parsed JSON data in each event
 * @param serverSentEventStream - The input stream of ServerSentEvent objects to transform
 * @param terminateDetector - Optional function to detect when the stream should be terminated
 * @returns A ReadableStream that yields JsonServerSentEvent objects with parsed JSON data
 */
export function toJsonServerSentEventStream<DATA>(
  serverSentEventStream: ServerSentEventStream,
  terminateDetector?: TerminateDetector,
): JsonServerSentEventStream<DATA> {
  return serverSentEventStream.pipeThrough(
    new JsonServerSentEventTransformStream<DATA>(terminateDetector),
  );
}
