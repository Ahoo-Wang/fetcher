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

import {
  BUILT_IN_INTERCEPTOR_ORDER_STEP,
  type RequestInterceptor,
} from './interceptor';
import { FetchExchange } from './fetchExchange';
import { CONTENT_TYPE_HEADER, ContentTypeValues } from './fetchRequest';

/**
 * The name of the RequestBodyInterceptor.
 */
export const REQUEST_BODY_INTERCEPTOR_NAME = 'RequestBodyInterceptor';

/**
 * The order of the RequestBodyInterceptor.
 */
export const REQUEST_BODY_INTERCEPTOR_ORDER = Number.MIN_SAFE_INTEGER + BUILT_IN_INTERCEPTOR_ORDER_STEP;

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
   * Checks if the provided body is of a supported complex type that doesn't require JSON serialization.
   *
   * @param body - The request body to check
   * @returns True if the body is an ArrayBuffer, TypedArray, DataView or ReadableStream, false otherwise
   */
  private isSupportedComplexBodyType(body: any): boolean {
    return (
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      body instanceof ReadableStream
    );
  }

  /**
   * Checks if the provided body is of a type that automatically appends Content-Type header.
   *
   * @param body - The request body to check
   * @returns True if the body is a Blob, File, FormData or URLSearchParams, false otherwise
   */
  private isAutoAppendContentType(body: any): boolean {
    return (
      body instanceof Blob ||
      body instanceof File ||
      body instanceof FormData ||
      body instanceof URLSearchParams
    );
  }

  /**
   * Attempts to convert request body to a valid fetch API body type.
   *
   * This method follows a specific processing order to handle different types of request bodies:
   * 1. Check if the body is null or undefined and return early if so
   * 2. Check if the body is a non-object type and return early if so
   * 3. Check if the body is a type that automatically appends Content-Type header
   * 4. Check if the body is a supported complex type that doesn't require JSON serialization
   * 5. For plain objects, convert to JSON string and set Content-Type header to application/json
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
    const headers = exchange.ensureRequestHeaders();
    if (this.isAutoAppendContentType(request.body)) {
      if (headers[CONTENT_TYPE_HEADER]) {
        delete headers[CONTENT_TYPE_HEADER];
      }
      return;
    }
    // Check if it's a supported type
    if (this.isSupportedComplexBodyType(request.body)) {
      return;
    }

    // For plain objects, convert to JSON string
    // Also ensure Content-Type header is set to application/json
    exchange.request.body = JSON.stringify(request.body);

    if (!headers[CONTENT_TYPE_HEADER]) {
      headers[CONTENT_TYPE_HEADER] = ContentTypeValues.APPLICATION_JSON;
    }
  }
}
