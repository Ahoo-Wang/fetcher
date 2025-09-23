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
 * Extension support for OpenAPI Specification
 */

/**
 * Base interface for all OpenAPI objects that support extensions
 * Extensions are custom properties that start with "x-"
 */
export interface Extensible {
  /**
   * Extension properties that start with "x-"
   * These can be used to add custom functionality to the OpenAPI document
   */
  [extension: `x-${string}`]: any;
}

/**
 * Common extensions used in OpenAPI specifications
 */
export interface CommonExtensions {
  /** Marks an element as internal use only */
  'x-internal'?: boolean;
  /** Deprecation information with details */
  'x-deprecated'?: {
    message?: string;
    since?: string;
    removedIn?: string;
    replacement?: string;
  };
  /** Tags for categorization beyond standard tags */
  'x-tags'?: string[];
  /** Example values for documentation */
  'x-examples'?: any[];
  /** Order of display in documentation */
  'x-order'?: number;
  /** Groups for organizing in UI */
  'x-group'?: string;
}