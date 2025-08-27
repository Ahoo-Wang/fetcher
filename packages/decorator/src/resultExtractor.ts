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

import { ExchangeError, FetchExchange } from '@ahoo-wang/fetcher';
import { ServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';
import {
  CommandResultEventStream,
  toCommandResultEventStream,
} from '@ahoo-wang/fetcher-wow';

/**
 * Result extractor interface
 * Defines a function type for extracting results from a FetchExchange
 * @param exchange - FetchExchange object containing request and response information
 * @returns Returns a value of type FetchExchange, Response, or Promise<any>
 */
export interface ResultExtractor {
  (
    exchange: FetchExchange,
  ):
    | FetchExchange
    | Response
    | Promise<any>
    | ServerSentEventStream
    | CommandResultEventStream;
}

/**
 * Interface with result extractor capability
 * Defines an optional resultExtractor property
 */
export interface ResultExtractorCapable {
  resultExtractor?: ResultExtractor;
}

/**
 * Returns the original FetchExchange object
 * @param exchange - FetchExchange object
 * @returns The original FetchExchange object
 */
export const ExchangeResultExtractor: ResultExtractor = (
  exchange: FetchExchange,
) => {
  return exchange;
};

/**
 * Returns the response object from FetchExchange
 * @param exchange - FetchExchange object
 * @returns The response object from FetchExchange
 */
export const ResponseResultExtractor: ResultExtractor = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse;
};

/**
 * Parses the response content as JSON format
 * @param exchange - FetchExchange object
 * @returns Promise of parsed JSON data
 */
export const JsonResultExtractor: ResultExtractor = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.json();
};

/**
 * Parses the response content as text format
 * @param exchange - FetchExchange object
 * @returns Promise of parsed text data
 */
export const TextResultExtractor: ResultExtractor = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.text();
};

/**
 * ServerSentEventStream result extractor, used to extract server-sent event stream from FetchExchange
 *
 * @param exchange - FetchExchange object containing request and response information
 * @returns Readable stream object of server-sent event stream
 * @throws ExchangeError exception when server does not support ServerSentEventStream
 */
export const ServerSentEventStreamResultExtractor: ResultExtractor = (
  exchange: FetchExchange,
) => {
  // Check if response supports event stream, throw exception if not supported
  if (!exchange.requiredResponse.eventStream) {
    throw new ExchangeError(exchange, 'ServerSentEventStream is not supported');
  }
  // Return the event stream
  return exchange.requiredResponse.eventStream()!;
};

/**
 * CommandResultEventStream result extractor, used to extract command result event stream from FetchExchange.
 * This function transforms a server-sent event stream into a command result event stream.
 *
 * 提取命令结果事件流，用于从FetchExchange中提取命令结果事件流。
 * 该函数将服务器发送事件流转换为命令结果事件流。
 *
 * @param exchange - The exchange object containing the server-sent event stream data
 *                  包含服务器发送事件流数据的交换对象
 * @returns A command result event stream derived from the server-sent event stream
 *          从服务器发送事件流派生的命令结果事件流
 * @throws ExchangeError exception when server does not support ServerSentEventStream
 *                       当服务器不支持ServerSentEventStream时抛出ExchangeError异常
 */
export const CommandResultEventStreamResultExtractor: ResultExtractor =
  exchange => {
    // Extract the server-sent event stream from the exchange
    const serverSentEventStream = ServerSentEventStreamResultExtractor(
      exchange,
    ) as ServerSentEventStream;

    // Transform the server-sent event stream into a command result event stream
    return toCommandResultEventStream(serverSentEventStream);
  };

/**
 * ResultExtractors is an object that maps result extractor names to their corresponding
 * extractor functions. These extractors are used to process and extract data from different
 * types of responses or results in the application.
 *
 * Each property represents a specific type of result extractor:
 * - Exchange: Handles exchange-related result extraction
 * - Response: Handles general response result extraction
 * - Json: Handles JSON format result extraction
 * - Text: Handles plain text result extraction
 * - ServerSentEventStream: Handles server-sent event stream result extraction
 * - CommandResultEventStream: Handles command result event stream result extraction
 */
export const ResultExtractors = {
  Exchange: ExchangeResultExtractor,
  Response: ResponseResultExtractor,
  Json: JsonResultExtractor,
  Text: TextResultExtractor,
  ServerSentEventStream: ServerSentEventStreamResultExtractor,
  CommandResultEventStream: CommandResultEventStreamResultExtractor,
  DEFAULT: ResponseResultExtractor,
};
