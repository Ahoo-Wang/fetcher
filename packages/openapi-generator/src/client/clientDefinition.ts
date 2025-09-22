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

import { DescriptionCapable, Named } from '@ahoo-wang/fetcher-wow';
import { PartialBy } from '@ahoo-wang/fetcher';
import { HTTPMethod } from '@ahoo-wang/fetcher-openapi';
import { ModelDefinition } from '@/model/modelDefinition.ts';
import { DependencyDefinition } from '@/module/dependencyDefinition.ts';

export interface EndpointDefinition extends Named, PartialBy<DescriptionCapable, 'description'> {
  summary?: string;
  method: HTTPMethod;
  path: string;
  requestBody?: ModelDefinition;
  response?: ModelDefinition;
  dependencies: DependencyDefinition[];
}

export interface ClientDefinition extends Named, PartialBy<DescriptionCapable, 'description'> {
  name: string;
  endpoints: EndpointDefinition[];
}