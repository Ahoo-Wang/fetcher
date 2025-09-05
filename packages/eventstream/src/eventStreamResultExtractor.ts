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
 * ServerSentEventStream result extractor, used to extract server-sent event stream from FetchExchange
 *
 * @param exchange - FetchExchange object containing request and response information
 * @returns Readable stream object of server-sent event stream
 * @throws ExchangeError exception when server does not support ServerSentEventStream
 */
export const EventStreamResultExtractor: ResultExtractor<
  ServerSentEventStream
> = (exchange: FetchExchange) => {
  return exchange.requiredResponse.requiredEventStream();
};

/**
 * JsonServerSentEventStream result extractor, used to extract JSON server-sent event stream from FetchExchange
 *
 * @param exchange - FetchExchange object containing request and response information
 * @returns Readable stream object of JSON server-sent event stream
 * @throws ExchangeError exception when server does not support JsonServerSentEventStream
 */
export const JsonEventStreamResultExtractor: ResultExtractor<
  JsonServerSentEventStream<any>
> = (exchange: FetchExchange) => {
  return exchange.requiredResponse.requiredJsonEventStream();
};
