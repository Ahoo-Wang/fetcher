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

import { ExternalDocumentation } from './base-types';

/**
 * Adds metadata to a single tag that is used by the Operation Object
 *
 * @property name - The name of the tag
 * @property description - A description for the tag
 * @property externalDocs - Additional external documentation for this tag
 */
export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}