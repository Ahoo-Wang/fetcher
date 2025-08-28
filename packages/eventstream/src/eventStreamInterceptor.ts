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

import { toServerSentEventStream } from './eventStreamConverter';
import {
  ContentTypeHeader,
  ContentTypeValues,
  FetchExchange,
  ResponseInterceptor,
} from '@ahoo-wang/fetcher';
import { toJsonServerSentEventStream } from './jsonServerSentEventTransformStream';

/**
 * The name of the EventStreamInterceptor.
 */
export const EVENT_STREAM_INTERCEPTOR_NAME = 'EventStreamInterceptor';

/**
 * The order of the EventStreamInterceptor.
 * Set to Number.MAX_SAFE_INTEGER - 1000 to ensure it runs latest among response interceptors.
 */
export const EVENT_STREAM_INTERCEPTOR_ORDER = Number.MAX_SAFE_INTEGER - 1000;

/**
 * Interceptor that enhances Response objects with event stream capabilities.
 *
 * This interceptor detects responses with `text/event-stream` content type and adds
 * an `eventStream()` method to the Response object, which returns a readable stream
 * of Server-Sent Events that can be consumed using `for await` syntax.
 *
 * @remarks
 * This interceptor runs at the very end of the response interceptor chain to ensure
 * it runs after all standard response processing is complete, as it adds
 * specialized functionality to the response object. The order is set to
 * EVENT_STREAM_INTERCEPTOR_ORDER to ensure it executes latest among response interceptors,
 * allowing for other response interceptors to run before it if needed. This positioning
 * ensures that all response processing is completed before specialized event stream
 * functionality is added to the response object.
 *
 * @example
 * ```typescript
 * // Using the eventStream method
 * const response = await fetcher.get('/events');
 * if (response.headers.get('content-type')?.includes('text/event-stream')) {
 *   const eventStream = response.eventStream();
 *   for await (const event of eventStream) {
 *     console.log('Received event:', event);
 *   }
 * }
 * ```
 */
export class EventStreamInterceptor implements ResponseInterceptor {
  readonly name = EVENT_STREAM_INTERCEPTOR_NAME;
  readonly order = EVENT_STREAM_INTERCEPTOR_ORDER;

  /**
   * Intercepts responses to add event stream capabilities.
   *
   * This method runs at the very end of the response interceptor chain to ensure
   * it runs after all standard response processing is complete. It detects responses
   * with `text/event-stream` content type and adds an `eventStream()` method to
   * the Response object, which returns a readable stream of Server-Sent Events.
   *
   * @param exchange - The exchange containing the response to enhance
   *
   * @remarks
   * This method executes latest among response interceptors to ensure all response
   * processing is completed before specialized event stream functionality is added.
   * It only enhances responses with `text/event-stream` content type, leaving other
   * responses unchanged. The positioning at the end of the response chain ensures
   * that all response transformations and validations are completed before event
   * stream capabilities are added to the response object.
   */
  intercept(exchange: FetchExchange) {
    // Check if the response is an event stream
    const response = exchange.response;
    if (!response) {
      return;
    }
    const contentType = response.headers.get(ContentTypeHeader);
    if (contentType?.includes(ContentTypeValues.TEXT_EVENT_STREAM)) {
      response.eventStream = () => toServerSentEventStream(response);
      response.jsonEventStream = () =>
        toJsonServerSentEventStream(toServerSentEventStream(response));
    }
  }
}
