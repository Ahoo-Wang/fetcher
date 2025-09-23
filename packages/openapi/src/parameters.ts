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
 * Parameter and request body type definitions for OpenAPI Specification
 */

import { Example, Header, ParameterLocation } from './base-types';
import { Reference } from './reference';
import { Schema } from './schema';
import { Extensible } from './extensions';

/**
 * Describes a single operation parameter
 *
 * @property name - The name of the parameter
 * @property in - The location of the parameter
 * @property description - A brief description of the parameter
 * @property required - Determines whether this parameter is mandatory
 * @property deprecated - Specifies that a parameter is deprecated
 * @property allowEmptyValue - Sets the ability to pass empty-valued parameters
 * @property style - Describes how the parameter value will be serialized
 * @property explode - When true, parameter values of type array or object generate separate parameters
 * @property allowReserved - Determines whether the parameter value should allow reserved characters
 * @property schema - The schema defining the type used for the parameter
 * @property example - Example of the parameter's potential value
 * @property examples - Examples of the parameter's potential value
 * @property content - A map containing the representations for the parameter
 */
export interface Parameter extends Extensible {
  name: string;
  in: ParameterLocation;
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

/**
 * Describes a single request body
 *
 * @property description - A brief description of the request body
 * @property content - The content of the request body
 * @property required - Determines if the request body is required in the request
 */
export interface RequestBody extends Extensible {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key
 *
 * @property schema - The schema defining the content of the request, response, or parameter
 * @property example - Example of the media type
 * @property examples - Examples of the media type
 * @property encoding - A map between a property name and its encoding information
 */
export interface MediaType extends Extensible {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}

/**
 * A single encoding definition applied to a single schema property
 *
 * @property contentType - The Content-Type for encoding a specific property
 * @property headers - A map allowing additional information to be provided as headers
 * @property style - Describes how a specific property value will be serialized
 * @property explode - When true, property values of type array or object generate separate parameters
 * @property allowReserved - Determines whether the parameter value should allow reserved characters
 */
export interface Encoding extends Extensible {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}
