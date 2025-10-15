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
 * @packageDocumentation
 * @module @ahoo-wang/fetcher-eventstream
 *
 * # EventStream Package
 *
 * A comprehensive TypeScript library for handling Server-Sent Events (SSE) and stream processing.
 * This package provides utilities for converting, transforming, and consuming event streams with
 * full TypeScript support and async iteration capabilities.
 *
 * ## Key Features
 *
 * - **Server-Sent Event Processing**: Parse and transform SSE streams into typed objects
 * - **JSON Event Streams**: Convert raw SSE to typed JSON event streams with optional termination detection
 * - **Stream Utilities**: Async iteration support for ReadableStreams
 * - **HTTP Response Handling**: Specialized extractors for event stream responses
 * - **Type Safety**: Full TypeScript support with generic types and strict typing
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   toJsonServerSentEventStream,
 *   type TerminateDetector
 * } from '@ahoo-wang/fetcher-eventstream';
 *
 * // Convert a Server-Sent Event stream to typed JSON events
 * const terminateOnDone: TerminateDetector = (event) => event.data === '[DONE]';
 * const jsonStream = toJsonServerSentEventStream<MyData>(sseStream, terminateOnDone);
 *
 * // Consume the stream
 * for await (const event of jsonStream) {
 *   console.log('Received:', event.data);
 * }
 * ```
 *
 * ## Main Components
 *
 * - `toJsonServerSentEventStream()` - Convert SSE streams to typed JSON streams
 * - `JsonServerSentEventTransformStream` - Transform stream class with termination support
 * - `ServerSentEventStream` - Raw server-sent event stream type
 * - `ReadableStreamAsyncIterable` - Async iteration utilities for streams
 * - `EventStreamResultExtractor` - HTTP response extractor for event streams
 *
 * @see {@link toJsonServerSentEventStream} for the main conversion function
 * @see {@link JsonServerSentEventTransformStream} for stream transformation
 * @see {@link TerminateDetector} for termination detection
 */

export * from './eventStreamConverter';
export * from './jsonServerSentEventTransformStream';
export * from './eventStreamResultExtractor';
export * from './responses';
export * from './serverSentEventTransformStream';
export * from './textLineTransformStream';
export * from './readableStreamAsyncIterable';
export * from './readableStreams';
