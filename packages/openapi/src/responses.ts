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
 * Response and callback type definitions for OpenAPI Specification
 */

import type { Reference } from './reference';
import type { MediaType } from './parameters';
import type { Server } from './server';
import type { PathItem } from './paths';
import type { Header } from './base-types';
import type { Extensible } from './extensions';

/**
 * The Link object represents a possible design-time link for a response
 *
 * @property operationRef - A relative or absolute reference to an OAS operation
 * @property operationId - The name of an existing, resolvable OAS operation
 * @property parameters - A map representing parameters to pass to an operation
 * @property requestBody - A literal value or expression to use as a request body
 * @property description - A description of the link
 * @property server - A server object to be used by the target operation
 */
export interface Link extends Extensible {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}

/**
 * Describes a single response from an API Operation
 *
 * @property description - A description of the response
 * @property headers - Maps a header name to its definition
 * @property content - A map containing descriptions of potential response payloads
 * @property links - A map of operations links that can be followed from the response
 */
export interface Response extends Extensible {
  description: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}

/**
 * An HTTP status code (`200`) or range (`2XX`) that keys a {@link Responses}
 * map.
 */
export type HttpStatusCodeKey = `${1 | 2 | 3 | 4 | 5}${string}`;

/**
 * A container for the expected responses of an operation.
 *
 * Its keys are `default` and the status codes, which keeps them apart from
 * the `x-*` extensions the map may also carry: a `string` index signature
 * would require every extension value to be a {@link Response}. Index it with
 * a {@link HttpStatusCodeKey}, or iterate it with `Object.entries`.
 */
export interface Responses extends Extensible {
  default?: Response | Reference;

  [httpCode: HttpStatusCodeKey]: Response | Reference | undefined;
}

/**
 * The runtime expression that keys a {@link Callback} map: an expression such
 * as `$request.body#/url`, or a string embedding one in braces, such as
 * `{$request.query.callbackUrl}` or `https://example.com?id={$request.body#/id}`.
 */
export type CallbackExpression = `$${string}` | `${string}{$${string}`;

/**
 * A map of possible out-of-band callbacks related to the parent operation.
 *
 * Its keys are runtime expressions, which keeps them apart from the `x-*`
 * extensions the map may also carry: a `string` index signature would
 * require every extension value to be a {@link PathItem}.
 */
export interface Callback extends Extensible {
  [expression: CallbackExpression]: PathItem;
}
