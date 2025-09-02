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

import { type RequestInterceptor } from './interceptor';
import { FetchExchange } from './fetchExchange';
import { ContentTypeValues } from './fetchRequest';
import { URL_RESOLVE_INTERCEPTOR_ORDER } from './urlResolveInterceptor';

/**
 * The name of the RequestBodyInterceptor.
 */
export const REQUEST_BODY_INTERCEPTOR_NAME = 'RequestBodyInterceptor';

/**
 * The order of the RequestBodyInterceptor.
 * Set to URL_RESOLVE_INTERCEPTOR_ORDER + 1000 to ensure it runs early among request interceptors.
 */
export const REQUEST_BODY_INTERCEPTOR_ORDER =
  URL_RESOLVE_INTERCEPTOR_ORDER + 1000;

/**
 * Interceptor responsible for converting plain objects to JSON strings for HTTP request bodies.
 *
 * This interceptor ensures that object request bodies are properly serialized and that
 * the appropriate Content-Type header is set. It runs early in the request processing chain
 * to ensure request bodies are properly formatted before other interceptors process them.
 *
 * @remarks
 * This interceptor runs after URL resolution (UrlResolveInterceptor) but before
 * the actual HTTP request is made (FetchInterceptor). The order is set to
 * REQUEST_BODY_INTERCEPTOR_ORDER to ensure it executes in the correct position
 * in the interceptor chain, allowing for other interceptors to run between URL resolution
 * and request body processing. This positioning ensures that URL parameters are resolved
 * first, then request bodies are properly formatted, and finally the HTTP request is executed.
 */
export class RequestBodyInterceptor implements RequestInterceptor {
  /**
   * Interceptor name, used for identification and management.
   */
  readonly name = REQUEST_BODY_INTERCEPTOR_NAME;

  /**
   * Interceptor execution order, set to run after UrlResolveInterceptor but before FetchInterceptor.
   *
   * This interceptor should run after URL resolution (UrlResolveInterceptor) but before
   * the actual HTTP request is made (FetchInterceptor). The order is set to
   * REQUEST_BODY_INTERCEPTOR_ORDER to ensure it executes in the correct position
   * in the interceptor chain, allowing for other interceptors to run between URL resolution
   * and request body processing. This positioning ensures that URL parameters are resolved
   * first, then request bodies are properly formatted, and finally the HTTP request is executed.
   */
  readonly order = REQUEST_BODY_INTERCEPTOR_ORDER;

  /**
   * Attempts to convert request body to a valid fetch API body type.
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
   *
   * @example
   * // Plain object body will be converted to JSON
   * const fetcher = new Fetcher();
   * const exchange = new FetchExchange(
   *   fetcher,
   *   {
   *     body: { name: 'John', age: 30 }
   *   }
   * );
   * interceptor.intercept(exchange);
   * // exchange.request.body will be '{"name":"John","age":30}'
   * // exchange.request.headers will include 'Content-Type: application/json'
   */
  intercept(exchange: FetchExchange) {
    const request = exchange.request;
    // If there's no request body, return unchanged
    if (request.body === undefined || request.body === null) {
      return;
    }

    // If request body is not an object, return unchanged
    if (typeof request.body !== 'object') {
      return;
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
      return;
    }

    // For plain objects, convert to JSON string
    // Also ensure Content-Type header is set to application/json
    exchange.request.body = JSON.stringify(request.body);
    // Only set default Content-Type if not explicitly set
    const headers = exchange.ensureRequestHeaders();
    if (!headers['Content-Type']) {
      headers['Content-Type'] = ContentTypeValues.APPLICATION_JSON;
    }
  }
}
