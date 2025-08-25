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

import { FetchExchange, Interceptor } from './interceptor';
import { ContentTypeHeader, ContentTypeValues } from './types';

/**
 * RequestBodyInterceptor Class
 *
 * Interceptor responsible for converting plain objects to JSON strings for HTTP request bodies.
 * This interceptor ensures that object request bodies are properly serialized and that
 * the appropriate Content-Type header is set.
 *
 * @remarks
 * This interceptor runs early in the request processing chain with the lowest possible
 * order value (Number.MIN_SAFE_INTEGER) to ensure request bodies are properly formatted
 * before other interceptors process them.
 */
export class RequestBodyInterceptor implements Interceptor {
  /**
   * Interceptor name, used for identification and management
   */
  name = 'RequestBodyInterceptor';

  /**
   * Interceptor execution order, set to minimum safe integer to ensure early execution
   *
   * @remarks
   * This interceptor should run before other request interceptors to ensure
   * request bodies are properly formatted early in the processing chain.
   */
  order = Number.MIN_SAFE_INTEGER;

  /**
   * Attempts to convert request body to a valid fetch API body type
   *
   * According to the Fetch API specification, body can be multiple types, but for
   * plain objects, they need to be converted to JSON strings.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#setting_a_body}
   *
   * Supported types:
   *   - a string
   *   - ArrayBuffer
   *   - TypedArray
   *   - DataView
   *   - Blob
   *   - File
   *   - URLSearchParams
   *   - FormData
   *   - ReadableStream
   *
   * For unsupported object types (like plain objects), they will be automatically
   * converted to JSON strings.
   *
   * @param exchange - The exchange object containing the request to process
   * @returns The processed exchange object with potentially modified request body
   *
   * @example
   * // Plain object body will be converted to JSON
   * const exchange = {
   *   request: {
   *     body: { name: 'John', age: 30 }
   *   }
   * };
   * const result = interceptor.intercept(exchange);
   * // result.request.body will be '{"name":"John","age":30}'
   * // result.request.headers will include 'Content-Type: application/json'
   */
  intercept(exchange: FetchExchange): FetchExchange {
    const request = exchange.request;
    // If there's no request body, return unchanged
    if (request.body === undefined || request.body === null) {
      return exchange;
    }

    // If request body is not an object, return unchanged
    if (typeof request.body !== 'object') {
      return exchange;
    }

    // Check if it's a supported type
    if (
      request.body instanceof ArrayBuffer ||
      ArrayBuffer.isView(request.body) || // Includes TypedArray and DataView
      request.body instanceof Blob ||
      request.body instanceof File ||
      request.body instanceof URLSearchParams ||
      request.body instanceof FormData ||
      request.body instanceof ReadableStream
    ) {
      return exchange;
    }

    // For plain objects, convert to JSON string
    // Also ensure Content-Type header is set to application/json
    const modifiedRequest = { ...request };
    modifiedRequest.body = JSON.stringify(request.body);

    // Set Content-Type header
    if (!modifiedRequest.headers) {
      modifiedRequest.headers = {};
    }

    // Only set default Content-Type if not explicitly set
    const headers = modifiedRequest.headers as Record<string, string>;
    if (!headers[ContentTypeHeader]) {
      headers[ContentTypeHeader] = ContentTypeValues.APPLICATION_JSON;
    }

    return { ...exchange, request: modifiedRequest };
  }
}
