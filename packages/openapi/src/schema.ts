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
 * Schema type definitions for OpenAPI Specification
 */

import { ExternalDocumentation, SchemaType } from './base-types';
import { Reference } from './reference';

/**
 * Adds support for polymorphism using discriminator
 *
 * @property propertyName - The name of the property in the payload that will hold the discriminator value
 * @property mapping - An object to hold mappings between payload values and schema names or references
 */
export interface Discriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

/**
 * A metadata object that allows for more fine-tuned XML model definitions
 *
 * @property name - Replaces the name of the element/attribute used for the described schema property
 * @property namespace - The URI of the namespace definition
 * @property prefix - The prefix to be used for the name
 * @property attribute - Declares whether the property definition translates to an attribute instead of an element
 * @property wrapped - MAY be used only for an array definition and signifies whether the array is wrapped
 */
export interface XML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

/**
 * The Schema Object allows the definition of input and output data types
 *
 * @property title - The title of the schema
 * @property description - A description of the schema
 * @property type - The data type of the schema
 * @property format - The extending format for the previously mentioned type
 * @property nullable - Allows sending a null value for the defined schema
 * @property readOnly - Relevant only for Schema "properties" definitions
 * @property writeOnly - Relevant only for Schema "properties" definitions
 * @property deprecated - Specifies that a schema is deprecated
 * @property example - A free-form property to include an example of an instance for this schema
 * @property minimum - The minimum value of the range (for numeric types)
 * @property maximum - The maximum value of the range (for numeric types)
 * @property exclusiveMinimum - Whether the minimum value is excluded from the range
 * @property exclusiveMaximum - Whether the maximum value is excluded from the range
 * @property multipleOf - A number that must be a multiple of this value
 * @property minLength - The minimum length of a string value
 * @property maxLength - The maximum length of a string value
 * @property pattern - The regular expression pattern that a string value must match
 * @property items - The type definition for array items
 * @property minItems - The minimum number of items in an array
 * @property maxItems - The maximum number of items in an array
 * @property uniqueItems - Whether all items in an array must be unique
 * @property properties - The property definitions for an object type
 * @property required - The list of required properties for an object type
 * @property minProperties - The minimum number of properties for an object type
 * @property maxProperties - The maximum number of properties for an object type
 * @property additionalProperties - Defines whether additional properties are allowed
 * @property allOf - Must be valid against all of the subschemas
 * @property anyOf - Must be valid against any of the subschemas
 * @property oneOf - Must be valid against exactly one of the subschemas
 * @property not - Must not be valid against the supplied schema
 * @property enum - The enumeration of possible values
 * @property discriminator - Adds support for polymorphism
 * @property xml - Additional metadata for XML formatting
 * @property externalDocs - Additional external documentation for this schema
 */
export interface Schema {
  // General properties
  title?: string;
  description?: string;
  type?: SchemaType;
  format?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  example?: any;

  // Numeric constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  multipleOf?: number;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Array constraints
  items?: Schema | Reference;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object constraints
  properties?: Record<string, Schema | Reference>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | Schema | Reference;

  // Composition
  allOf?: Array<Schema | Reference>;
  anyOf?: Array<Schema | Reference>;
  oneOf?: Array<Schema | Reference>;
  not?: Schema | Reference;

  // Enumeration
  enum?: any[];

  // Polymorphism support
  discriminator?: Discriminator;

  // XML serialization
  xml?: XML;

  // External documentation
  externalDocs?: ExternalDocumentation;
}