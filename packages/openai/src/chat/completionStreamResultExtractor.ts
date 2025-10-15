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
import '@ahoo-wang/fetcher-eventstream';
import {
  JsonServerSentEventStream,
  ServerSentEvent,
  TerminateDetector,
} from '@ahoo-wang/fetcher-eventstream';
import { ChatResponse } from './types';

/**
 * A termination detector for OpenAI chat completion streams.
 *
 * This detector identifies when a chat completion stream has finished by checking
 * if the server-sent event data equals '[DONE]'. This is the standard completion
 * signal used by OpenAI's API for streaming chat completions.
 *
 * @param event - The server-sent event to evaluate for termination
 * @returns true if the event indicates stream completion, false otherwise
 *
 * @example
 * ```typescript
 * const event: ServerSentEvent = { data: '[DONE]', event: 'done' };
 * const isDone = DoneDetector(event); // returns true
 * ```
 */
export const DoneDetector: TerminateDetector = (event: ServerSentEvent) => {
  return event.data === '[DONE]';
};

/**
 * Result extractor for OpenAI chat completion streaming responses.
 *
 * This extractor processes HTTP responses from OpenAI's chat completion API endpoints
 * that return streaming responses. It converts the response into a JSON server-sent
 * event stream that automatically terminates when the completion is finished.
 *
 * The extractor uses the DoneDetector to identify completion signals and ensures
 * the response is properly formatted as a server-sent event stream with JSON data.
 *
 * @param exchange - The fetch exchange containing the HTTP response from OpenAI's API
 * @returns A JSON server-sent event stream of ChatResponse objects that terminates on completion
 * @throws {EventStreamConvertError} If the response is not a valid event stream or has incorrect content type
 *
 * @example
 * ```typescript
 * import { fetcher } from '@ahoo-wang/fetcher';
 * import { CompletionStreamResultExtractor } from '@ahoo-wang/fetcher-openai';
 *
 * const response = await fetcher.post('/chat/completions', {
 *   model: 'gpt-3.5-turbo',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   stream: true
 * });
 *
 * const stream = CompletionStreamResultExtractor(response);
 *
 * for await (const event of stream) {
 *   console.log('Received:', event.data);
 *   // Stream automatically terminates when '[DONE]' is received
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Using with fetcher configuration
 * const fetcherWithExtractor = fetcher.extend({
 *   resultExtractor: CompletionStreamResultExtractor
 * });
 *
 * const stream = await fetcherWithExtractor.post('/chat/completions', {
 *   // ... request options
 * });
 * ```
 */
export const CompletionStreamResultExtractor: ResultExtractor<
  JsonServerSentEventStream<ChatResponse>
> = (exchange: FetchExchange) => {
  return exchange.requiredResponse.requiredJsonEventStream(DoneDetector);
};
