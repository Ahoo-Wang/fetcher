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
 * Basic type definitions for OpenAPI Specification
 */

import { Schema } from './schema';
import { Reference } from './reference';
import { MediaType } from './parameters';

/**
 * HTTP methods as defined in the OpenAPI specification
 */
export type HTTPMethod =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace';

/**
 * Supported parameter locations in HTTP requests
 */
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

/**
 * Primitive data types supported by JSON Schema
 */
export type SchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

/**
 * Additional external documentation
 *
 * @property description - A description of the target documentation
 * @property url - The URL for the target documentation
 */
export interface ExternalDocumentation {
  description?: string;
  url: string;
}

/**
 * Example object
 *
 * @property summary - Short description for the example
 * @property description - Long description for the example
 * @property value - Embedded literal example
 * @property externalValue - A URL that points to the literal example
 */
export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

/**
 * The Header Object follows the structure of the Parameter Object
 */
export interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}
