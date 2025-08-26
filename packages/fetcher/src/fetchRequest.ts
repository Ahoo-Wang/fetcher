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

import { TimeoutCapable } from './timeout';
import { UrlParams } from './urlBuilder';

export interface BaseURLCapable {
  /**
   * 请求的 baseURL
   * 当值为空时，表示不设置 baseURL，默认值为 undefined
   */
  baseURL: string;
}

/**
 * HTTP方法枚举常量
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

export const ContentTypeHeader = 'Content-Type';

export enum ContentTypeValues {
  APPLICATION_JSON = 'application/json',
  TEXT_EVENT_STREAM = 'text/event-stream',
}

export interface RequestHeaders {
  'Content-Type'?: string;
  'Accept'?: string;
  'Authorization'?: string;

  [key: string]: string | undefined;
}

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
}

export interface FetchRequest extends FetchRequestInit {
  /**
   * The URL for this request
   */
  url: string;
}
