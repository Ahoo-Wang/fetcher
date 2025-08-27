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
import { ContentTypeHeader, ContentTypeValues, FetchExchange, Interceptor } from '@ahoo-wang/fetcher';

/**
 * The name of the EventStreamInterceptor.
 */
export const EVENT_STREAM_INTERCEPTOR_NAME = 'EventStreamInterceptor';

/**
 * The order of the EventStreamInterceptor.
 * Set to Number.MAX_SAFE_INTEGER - 1000 to ensure it runs late among response interceptors.
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
 * This interceptor runs after the HTTP response is received but before the response
 * is returned to the caller. The order is set to EVENT_STREAM_INTERCEPTOR_ORDER to
 * ensure it runs after all standard response processing is complete, as it adds
 * specialized functionality to the response object. This order allows other
 * response interceptors to run after it if needed.
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
export class EventStreamInterceptor implements Interceptor {
  readonly name = EVENT_STREAM_INTERCEPTOR_NAME;
  readonly order = EVENT_STREAM_INTERCEPTOR_ORDER;

  intercept(exchange: FetchExchange) {
    // Check if the response is an event stream
    const response = exchange.response;
    if (!response) {
      return;
    }
    const contentType = response.headers.get(ContentTypeHeader);
    if (contentType?.includes(ContentTypeValues.TEXT_EVENT_STREAM)) {
      response.eventStream = () => toServerSentEventStream(response);
    }
  }
}
