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


import { Reference, Schema } from '@ahoo-wang/fetcher-openapi';
import { ModelDefinition } from '@/model/modelDefinition.ts';
import { ModuleInfoResolver } from '@/module/moduleInfoResolver.ts';
import { DependencyDefinition } from '@/module/dependencyDefinition.ts';
import { isReference } from '@/utils.ts';

export class ModelResolver {
  constructor(private readonly moduleInfoResolver: ModuleInfoResolver) {
  }

  resolve(key: string, schema: Schema): ModelDefinition {
    if (schema.type !== 'object') {
      throw new Error(`${key} is not object type.`);
    }
    const moduleInfo = this.moduleInfoResolver.resolve(key);
    if (!schema.properties) {
      return {
        name: moduleInfo.name,
        title: schema.title,
        description: schema.description,
        isReference: false,
        dependencies: [],
        type: schema.type,
      };
    }
    const dependencies: DependencyDefinition[] = [];
    const modelProperties = new Map<string, string>();

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (isReference(propSchema)) {
        const dependency = this.resolveReference(propSchema as Reference);
        dependencies.push(dependency);
        modelProperties.set(propName, dependency.namedImports);
      } else {
        modelProperties.set(propName, (propSchema as Schema).type);
      }
    }

    return {
      name: moduleInfo.name,
      title: schema.title,
      description: schema.description,
      isReference: false,
      dependencies,
      properties: modelProperties,
      type: schema.type,
    };
  }


  resolveReference(schema: Reference): DependencyDefinition {
    const moduleInfo = this.moduleInfoResolver.resolve(schema.$ref);
    return { moduleSpecifier: moduleInfo.path, namedImports: new Set([moduleInfo.name]) };
  }
}