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
 * Component type definitions for OpenAPI Specification
 */

import { Reference } from './reference';
import { Schema } from './schema';
import { Response } from './responses';
import { Parameter } from './parameters';
import { RequestBody } from './parameters';
import { SecurityScheme } from './security';
import { Link } from './responses';
import { Callback } from './responses';
import { Example, Header } from './base-types';
import { Extensible } from './extensions';

/**
 * Holds a set of reusable objects for different aspects of the OAS
 *
 * @property schemas - An object to hold reusable Schema Objects
 * @property responses - An object to hold reusable Response Objects
 * @property parameters - An object to hold reusable Parameter Objects
 * @property examples - An object to hold reusable Example Objects
 * @property requestBodies - An object to hold reusable Request Body Objects
 * @property headers - An object to hold reusable Header Objects
 * @property securitySchemes - An object to hold reusable Security Scheme Objects
 * @property links - An object to hold reusable Link Objects
 * @property callbacks - An object to hold reusable Callback Objects
 */
export interface Components extends Extensible {
  schemas?: Record<string, Schema | Reference>;
  responses?: Record<string, Response | Reference>;
  parameters?: Record<string, Parameter | Reference>;
  examples?: Record<string, Example | Reference>;
  requestBodies?: Record<string, RequestBody | Reference>;
  headers?: Record<string, Header | Reference>;
  securitySchemes?: Record<string, SecurityScheme | Reference>;
  links?: Record<string, Link | Reference>;
  callbacks?: Record<string, Callback | Reference>;
}

/**
 * Mapping of component types to their respective interfaces
 */
export type ComponentTypeMap = {
  schemas: Schema;
  responses: Response;
  parameters: Parameter;
  examples: Example;
  requestBodies: RequestBody;
  headers: Header;
  securitySchemes: SecurityScheme;
  links: Link;
  callbacks: Callback;
};
