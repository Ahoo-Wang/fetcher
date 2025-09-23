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
 * Server configuration type definitions for OpenAPI Specification
 */

import { Extensible } from './extensions';

/**
 * Server variable for URL template substitution
 *
 * @property enum - An enumeration of string values to be used if the substitution options are from a limited set
 * @property default - The default value to use for substitution
 * @property description - An optional description for the server variable
 */
export interface ServerVariable extends Extensible {
  enum?: string[];
  default: string;
  description?: string;
}

/**
 * Server configuration details
 *
 * @property url - A URL to the target host
 * @property description - An optional string describing the host designated by the URL
 * @property variables - A map between a variable name and its value
 */
export interface Server extends Extensible {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}
