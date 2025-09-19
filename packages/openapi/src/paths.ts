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
 * Path and operation type definitions for OpenAPI Specification
 */

import { Reference } from './reference';
import { Server } from './server';
import { Parameter } from './parameters';
import { RequestBody } from './parameters';
import { Responses } from './responses';
import { Callback } from './responses';
import { SecurityRequirement } from './security';
import { ExternalDocumentation } from './base-types';

/**
 * Describes a single API operation on a path
 *
 * @property tags - A list of tags for API documentation control
 * @property summary - A short summary of what the operation does
 * @property description - A verbose explanation of the operation behavior
 * @property externalDocs - Additional external documentation for this operation
 * @property operationId - Unique string used to identify the operation
 * @property parameters - List of parameters that are applicable for this operation
 * @property requestBody - The request body applicable for this operation
 * @property responses - The list of possible responses as they are returned from executing this operation
 * @property callbacks - A map of possible out-of band callbacks related to the parent operation
 * @property deprecated - Declares this operation to be deprecated
 * @property security - Declaration of which security mechanisms can be used for this operation
 * @property servers - Alternative server array to service this operation
 */
export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: Record<string, Callback | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}

/**
 * Describes the operations available on a single path
 *
 * @property $ref - A reference to another path item
 * @property summary - An optional summary of the path item
 * @property description - An optional description of the path item
 * @property get - Definition of a GET operation on this path
 * @property put - Definition of a PUT operation on this path
 * @property post - Definition of a POST operation on this path
 * @property delete - Definition of a DELETE operation on this path
 * @property options - Definition of an OPTIONS operation on this path
 * @property head - Definition of a HEAD operation on this path
 * @property patch - Definition of a PATCH operation on this path
 * @property trace - Definition of a TRACE operation on this path
 * @property servers - Alternative server array to service all operations in this path
 * @property parameters - List of parameters that are applicable for all operations in this path
 */
export interface PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
}

/**
 * Holds the relative paths to the individual endpoints and their operations
 */
export interface Paths {
  [path: string]: PathItem;
}
