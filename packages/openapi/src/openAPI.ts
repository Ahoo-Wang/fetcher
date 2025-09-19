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
 * Root document type definitions for OpenAPI Specification
 */

import { Info } from './info';
import { Server } from './server';
import { Paths } from './paths';
import { Components } from './components';
import { SecurityRequirement } from './security';
import { Tag } from './tags';
import { ExternalDocumentation } from './base-types';

/**
 * Root document object for the OpenAPI specification
 *
 * @property openapi - This string must be the version number of the OpenAPI Specification
 * @property info - Provides metadata about the API
 * @property servers - An array of Server Objects which provide connectivity information
 * @property paths - The available paths and operations for the API
 * @property components - An element to hold various schemas for the specification
 * @property security - A declaration of which security mechanisms can be used across the API
 * @property tags - A list of tags used by the specification with additional metadata
 * @property externalDocs - Additional external documentation
 */
export interface OpenAPI {
  openapi: string;
  info: Info;
  servers?: Server[];
  paths: Paths;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}
