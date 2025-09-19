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

import { Reference } from './reference';
import { MediaType } from './parameters';
import { Server } from './server';
import { PathItem } from './paths';
import { Header } from './base-types';

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
export interface Link {
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
export interface Response {
  description?: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}

/**
 * A container for the expected responses of an operation
 */
export interface Responses {
  default?: Response | Reference;

  [httpCode: string]: Response | Reference | undefined;
}

/**
 * A map of possible out-of-band callbacks related to the parent operation
 */
export interface Callback {
  [expression: string]: PathItem;
}
