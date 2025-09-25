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

import { OpenAPI, Reference, Schema } from '@ahoo-wang/fetcher-openapi';
import { ModuleDefinition } from '@/module/moduleDefinition.ts';
import { ModelResolver } from '@/model/modelResolver.ts';
import { isReference } from '@/utils';
import { resolveModelInfo } from '@/model/naming.ts';

export class ModuleResolver {
  public readonly modules: Map<string, ModuleDefinition> = new Map<
    string,
    ModuleDefinition
  >();

  constructor(
    private readonly modelResolver: ModelResolver,
  ) {
  }

  private getOrCreateModule(key: string): ModuleDefinition {
    const moduleInfo = resolveModelInfo(key);
    let module = this.modules.get(moduleInfo.path);
    if (!module) {
      module = new ModuleDefinition(moduleInfo.name, moduleInfo.path);
      this.modules.set(moduleInfo.path, module);
    }
    return module;
  }

  resolve(openAPI: OpenAPI) {
    if (openAPI.components?.schemas) {
      Object.entries(openAPI.components?.schemas).forEach(([key, value]) => {
        this.resolveSchema(key, value);
      });
    }
  }

  resolveSchema(schemaKey: string, schema: Schema | Reference) {
    if (isReference(schema)) {
      return;
    }

    const module = this.getOrCreateModule(schemaKey);
    const model = this.modelResolver.resolve(schemaKey, schema as Schema);
    module.addModel(model);
  }

  getModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}
