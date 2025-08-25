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

export interface BaseURLCapable {
  /**
   * 请求的 baseURL
   * 当值为空时，表示不设置 baseURL，默认值为 undefined
   */
  baseURL: string;
}

export interface HeadersCapable {
  /**
   * 请求头
   */
  headers?: Record<string, string>;
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

export enum RequestField {
  METHOD = 'method',
  BODY = 'body',
}

export const ContentTypeHeader = 'Content-Type';

export enum ContentTypeValues {
  APPLICATION_JSON = 'application/json',
  TEXT_EVENT_STREAM = 'text/event-stream',
}

/**
 * 具备名称能力的接口
 * 实现该接口的类型需要提供一个名称属性
 */
export interface NamedCapable {
  /**
   * 名称
   */
  name: string;
}

/**
 * Global extension of Response interface
 * Adds type-safe json() method support to Response objects
 */
declare global {
  interface Response {
    /**
     * Parse response body as JSON in a type-safe manner
     * @template T The type of returned data, defaults to any
     * @returns Promise<T> The parsed JSON data
     */
    json<T = any>(): Promise<T>;
  }
}
