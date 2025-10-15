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

import { FetchExchange, ResultExtractor } from '@ahoo-wang/fetcher';
import { ServerSentEventStream } from './eventStreamConverter';
import { JsonServerSentEventStream } from './jsonServerSentEventTransformStream';

/**
 * ServerSentEventStream result extractor for Fetcher HTTP client.
 *
 * This result extractor is designed to work with the Fetcher HTTP client library.
 * It extracts a ServerSentEventStream from an HTTP response that contains Server-Sent Events.
 * The extractor validates that the response supports event streaming and converts the
 * response body into a properly typed event stream.
 *
 * This extractor should be used when you want to consume raw Server-Sent Events
 * without JSON parsing, maintaining the original string data format.
 *
 * @param exchange - The FetchExchange object containing request and response information
 * @returns A ReadableStream that yields ServerSentEvent objects as they are parsed from the response
 * @throws {ExchangeError} When the server response does not support ServerSentEventStream
 *                         (e.g., wrong content type, no response body)
 *
 *
 * @see {@link ServerSentEventStream} for the stream type
 * @see {@link JsonEventStreamResultExtractor} for JSON-parsed event streams
 */
export const EventStreamResultExtractor: ResultExtractor<
  ServerSentEventStream
> = (exchange: FetchExchange) => {
  return exchange.requiredResponse.requiredEventStream();
};

/**
 * JsonServerSentEventStream result extractor for Fetcher HTTP client.
 *
 * This result extractor is designed to work with the Fetcher HTTP client library.
 * It extracts a JsonServerSentEventStream from an HTTP response that contains Server-Sent Events
 * with JSON data. The extractor validates that the response supports event streaming and converts
 * the response body into a properly typed event stream with automatic JSON parsing.
 *
 * This extractor should be used when you want to consume Server-Sent Events where the event
 * data is JSON-formatted, providing type-safe access to parsed JSON objects instead of raw strings.
 *
 * @template DATA - The expected type of the JSON data in the server-sent events
 * @param exchange - The FetchExchange object containing request and response information
 * @returns A ReadableStream that yields ServerSentEvent objects with parsed JSON data as they are received
 * @throws {ExchangeError} When the server response does not support JsonServerSentEventStream
 *                         (e.g., wrong content type, no response body, invalid JSON)
 *
 *
 * @see {@link JsonServerSentEventStream} for the stream type with JSON data
 * @see {@link EventStreamResultExtractor} for raw string event streams
 */
export const JsonEventStreamResultExtractor: ResultExtractor<
  JsonServerSentEventStream<any>
> = (exchange: FetchExchange) => {
  return exchange.requiredResponse.requiredJsonEventStream();
};
