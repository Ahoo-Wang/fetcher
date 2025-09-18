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

/**
 * Utility types for working with OpenAPI Specification
 */

import { HTTPMethod } from './base-types';
import { OpenAPI } from './openAPI';
import { Operation } from './paths';
import { MediaType, RequestBody } from './parameters';
import { Response } from './responses';
import { Parameter } from './parameters';

/**
 * Utility type to extract parameter names from path templates
 */
export type ExtractPathParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractPathParams<Rest>
    : never;

/**
 * Type for operation handlers in API clients
 */
export type OperationHandler<T extends OpenAPI, Path extends keyof T['paths'], Method extends HTTPMethod> =
  Method extends keyof T['paths'][Path]
    ? T['paths'][Path][Method] extends Operation
      ? (params: OperationParams<T['paths'][Path][Method]>) => Promise<OperationResponse<T['paths'][Path][Method]>>
      : never
    : never;

/**
 * Type for operation parameters extracted from OpenAPI specification
 */
export  type OperationParams<Op extends Operation> =
  (Op['parameters'] extends Array<infer P>
    ? ParametersToObject<P>
    : Record<string, never>) &
  (Op['requestBody'] extends RequestBody
    ? { body: RequestBodyContent<Op['requestBody']> }
    : Record<string, never>);

/**
 * Utility type to convert parameter arrays to parameter objects
 */
export type ParametersToObject<P> =
  P extends Parameter
    ? P extends { in: 'path'; name: infer N extends string; required: true }
      ? { [K in N]: any }
      : P extends { in: 'path'; name: infer N extends string }
        ? { [K in N]?: any }
        : P extends { in: 'query'; name: infer N extends string; required: true }
          ? { [K in N]: any }
          : P extends { in: 'query'; name: infer N extends string }
            ? { [K in N]?: any }
            : P extends { in: 'header'; name: infer N extends string; required: true }
              ? { [K in N]: any }
              : P extends { in: 'header'; name: infer N extends string }
                ? { [K in N]?: any }
                : P extends { in: 'cookie'; name: infer N extends string; required: true }
                  ? { [K in N]: any }
                  : P extends { in: 'cookie'; name: infer N extends string }
                    ? { [K in N]?: any }
                    : Record<string, never>
    : Record<string, never>;

/**
 * Type for request body content with proper content type specification
 */
export type RequestBodyContent<RB extends RequestBody> =
  RB['content'] extends Record<string, MediaType>
    ? keyof RB['content'] extends infer ContentType
      ? ContentType extends string
        ? { contentType: ContentType; data: any }
        : never
      : never
    : never;

/**
 * Type for operation responses extracted from OpenAPI specification
 */
export type OperationResponse<Op extends Operation> =
  Op['responses'] extends Record<string, infer R>
    ? R extends Response
      ? { status: number; data: ResponseContent<R> }
      : never
    : never;

/**
 * Type for response content with proper content type specification
 */
export type ResponseContent<R extends Response> =
  R['content'] extends Record<string, MediaType>
    ? keyof R['content'] extends infer ContentType
      ? ContentType extends string
        ? { contentType: ContentType; data: any }
        : never
      : never
    : never;