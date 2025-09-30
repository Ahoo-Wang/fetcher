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
 * Interface with result extractor capability
 * Defines an optional resultExtractor property
 */
export interface ResultExtractorCapable {
  resultExtractor?: ResultExtractor<any>;
}

/**
 * Returns the original FetchExchange object.
 * This extractor is useful when you need access to the entire exchange object,
 * including request, response, and any additional metadata.
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
 * This extractor is useful when you need direct access to the raw Response object
 * to perform custom processing or access response metadata.
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
 * This is the most common extractor for API responses that return JSON data.
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
 * This extractor is useful for responses that return plain text content.
 * @param exchange - The FetchExchange containing the response with text data
 * @returns A Promise that resolves to the response body as a string
 */
export const TextResultExtractor: ResultExtractor<Promise<string>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.text();
};

/**
 * Extracts the response body as a Blob.
 * This extractor is useful for binary data such as images, files, or other
 * non-text content that needs to be handled as a Blob.
 * @param exchange - The FetchExchange containing the response with Blob data
 * @returns A Promise that resolves to the response body as a Blob
 */
export const BlobResultExtractor: ResultExtractor<Promise<Blob>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.blob();
};

/**
 * Extracts the response body as an ArrayBuffer.
 * This extractor is useful for binary data that needs to be processed
 * as an ArrayBuffer, such as when working with raw binary data or
 * performing low-level data operations.
 * @param exchange - The FetchExchange containing the response with ArrayBuffer data
 * @returns A Promise that resolves to the response body as an ArrayBuffer
 */
export const ArrayBufferResultExtractor: ResultExtractor<Promise<ArrayBuffer>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.arrayBuffer();
};

/**
 * Extracts the response body as a Uint8Array.
 * This extractor is useful for binary data that needs to be processed
 * as a byte array, such as when working with protocol buffers or other
 * binary serialization formats.
 * @param exchange - The FetchExchange containing the response with byte data
 * @returns A Promise that resolves to the response body as a Uint8Array
 */
export const BytesResultExtractor: ResultExtractor<Promise<Uint8Array<ArrayBuffer>>> = (
  exchange: FetchExchange,
) => {
  return exchange.requiredResponse.bytes();
};

/**
 * Collection of commonly used result extractors.
 * Provides convenient access to various result extraction strategies
 * for processing HTTP responses.
 */
export const ResultExtractors = {
  /**
   * Returns the original FetchExchange object
   */
  Exchange: ExchangeResultExtractor,
  /**
   * Extracts the raw Response object
   */
  Response: ResponseResultExtractor,
  /**
   * Parses and returns response body as JSON
   */
  Json: JsonResultExtractor,
  /**
   * Returns response body as text
   */
  Text: TextResultExtractor,
  /**
   * Returns response body as a Blob
   */
  Blob: BlobResultExtractor,
  /**
   * Returns response body as an ArrayBuffer
   */
  ArrayBuffer: ArrayBufferResultExtractor,
  /**
   * Returns response body as a Uint8Array
   */
  Bytes: BytesResultExtractor,
};