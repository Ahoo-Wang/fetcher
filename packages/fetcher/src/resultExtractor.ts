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

import { FetchExchange } from './fetchExchange';

/**
 * Function interface for extracting results from a FetchExchange.
 * Defines how to transform a FetchExchange object into a specific result type.
 * @template R - The type of result to extract
 * @param exchange - The FetchExchange object containing request and response information
 * @returns The extracted result of type R
 */
export interface ResultExtractor<R> {
  (exchange: FetchExchange): R | Promise<R>;
}

/**
 * Returns the original FetchExchange object.
 * @param exchange - The FetchExchange object to return
 * @returns The same FetchExchange object that was passed in
 */
export const ExchangeResultExtractor: ResultExtractor<FetchExchange> = (
  exchange: FetchExchange,
) => {
  return exchange;
};

/**
 * Extracts the Response object from the exchange.
 * @param exchange - The FetchExchange containing the response
 * @returns The Response object from the exchange
 */
export const ResponseResultExtractor: ResultExtractor<Response> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse;
};

/**
 * Extracts and parses the response body as JSON.
 * @param exchange - The FetchExchange containing the response with JSON data
 * @returns A Promise that resolves to the parsed JSON data
 */
export const JsonResultExtractor: ResultExtractor<Promise<any>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.json();
};

/**
 * Extracts the response body as text.
 * @param exchange - The FetchExchange containing the response with text data
 * @returns A Promise that resolves to the response body as a string
 */
export const TextResultExtractor: ResultExtractor<Promise<string>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.text();
};

export const ResultExtractors = {
  Exchange: ExchangeResultExtractor,
  Response: ResponseResultExtractor,
  Json: JsonResultExtractor,
  Text: TextResultExtractor,
};
