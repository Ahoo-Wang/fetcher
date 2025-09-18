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
 * API metadata type definitions for OpenAPI Specification
 */

/**
 * Contact information for the exposed API
 *
 * @property name - The identifying name of the contact person/organization
 * @property url - The URL pointing to the contact information
 * @property email - The email address of the contact person/organization
 */
export interface Contact {
  name?: string;
  url?: string;
  email?: string;
}

/**
 * License information for the exposed API
 *
 * @property name - The license name used for the API
 * @property url - A URL to the license used for the API
 */
export interface License {
  name: string;
  url?: string;
}

/**
 * Metadata about the API
 *
 * @property title - The title of the API
 * @property description - A short description of the API
 * @property termsOfService - A URL to the Terms of Service for the API
 * @property contact - The contact information for the exposed API
 * @property license - The license information for the exposed API
 * @property version - The version of the OpenAPI document
 */
export interface Info {
  title?: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version?: string;
}