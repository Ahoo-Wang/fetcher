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

import { type TimeoutCapable } from './timeout';
import { type UrlParams } from './urlBuilder';

/**
 * Interface for objects that can have a base URL
 *
 * This interface defines a baseURL property that can be used to set a base URL
 * for HTTP requests. When the baseURL is empty, it means no base URL is set.
 */
export interface BaseURLCapable {
  /**
   * The base URL for requests
   * When empty, indicates no base URL is set. Default is undefined.
   */
  baseURL: string;
}

/**
 * HTTP method enumeration constants
 *
 * Defines the standard HTTP methods that can be used for requests.
 * Each method is represented as a string literal type.
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export const CONTENT_TYPE_HEADER = 'Content-Type';

export class ContentTypeValues {
  static readonly APPLICATION_JSON = 'application/json';
  static readonly TEXT_EVENT_STREAM = 'text/event-stream';
}

/**
 * Request headers interface
 *
 * Defines common HTTP headers that can be sent with requests.
 * Allows for additional custom headers through index signature.
 */
export interface RequestHeaders {
  [CONTENT_TYPE_HEADER]?: string;
  Accept?: string;
  Authorization?: string;

  [key: string]: string | undefined;
}

/**
 * Interface for objects that can have request headers
 *
 * This interface defines an optional headers property for HTTP requests.
 */
export interface RequestHeadersCapable {
  /**
   * Request headers
   */
  headers?: RequestHeaders;
}

/**
 * Fetcher request configuration interface
 *
 * This interface defines all the configuration options available for making HTTP requests
 * with the Fetcher client. It extends the standard RequestInit interface while adding
 * Fetcher-specific features like path parameters, query parameters, and timeout control.
 *
 * @example
 * ```typescript
 * const request: FetchRequestInit = {
 *   method: 'GET',
 *   urlParams: {
 *     path: { id: 123 },
 *     query: { include: 'profile' }
 *   },
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000
 * };
 *
 * const response = await fetcher.fetch('/users/{id}', request);
 * ```
 */
export interface FetchRequestInit
  extends TimeoutCapable,
    RequestHeadersCapable,
    Omit<RequestInit, 'body' | 'headers'> {
  urlParams?: UrlParams;

  /**
   * Request body
   *
   * The body of the request. Can be a string, Blob, ArrayBuffer, FormData,
   * URLSearchParams, or a plain object. Plain objects are automatically
   * converted to JSON and the appropriate Content-Type header is set.
   *
   * @example
   * ```typescript
   * // Plain object (automatically converted to JSON)
   * const request = {
   *   method: 'POST',
   *   body: { name: 'John', email: 'john@example.com' }
   * };
   *
   * // FormData
   * const formData = new FormData();
   * formData.append('name', 'John');
   * const request = {
   *   method: 'POST',
   *   body: formData
   * };
   * ```
   */
  body?: BodyInit | Record<string, any> | string | null;

  /**
   * AbortController for this request.
   * Used to cancel the request if needed.
   *
   * In timeout scenarios, if this property is provided, it will be used instead of creating a new AbortController.
   * This allows the caller to provide a custom AbortController for more advanced cancellation scenarios.
   *
   * @example
   * ```typescript
   * // Provide a custom AbortController
   * const controller = new AbortController();
   * const request: FetchRequest = {
   *   url: 'https://api.example.com/data',
   *   method: 'GET',
   *   abortController: controller
   * };
   *
   * // Later, cancel the request
   * controller.abort();
   * ```
   */
  abortController?: AbortController;
}

/**
 * Fetcher request interface
 *
 * Extends FetchRequestInit with a required URL property.
 * Represents a complete request configuration ready to be executed.
 */
export interface FetchRequest extends FetchRequestInit {
  /**
   * The URL for this request
   */
  url: string;
}
