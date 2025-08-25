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
  Interceptor,
} from '@ahoo-wang/fetcher';

export class EventStreamInterceptor implements Interceptor {
  name = 'EventStreamInterceptor';
  order = Number.MAX_SAFE_INTEGER;

  intercept(exchange: FetchExchange): FetchExchange {
    // Check if the response is an event stream
    const response = exchange.response;
    if (!response) {
      return exchange;
    }
    const contentType = response.headers.get(ContentTypeHeader);
    if (
      contentType &&
      contentType.includes(ContentTypeValues.TEXT_EVENT_STREAM)
    ) {
      // Add eventStream method to response
      response.eventStream = () => toServerSentEventStream(response);
    }
    return exchange;
  }
}
