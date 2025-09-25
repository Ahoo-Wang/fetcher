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

import { Named } from '@ahoo-wang/fetcher-wow';
import { ModelDefinition } from '@/model/modelDefinition.ts';
import { DependencyDefinition } from '@/module/dependencyDefinition.ts';

export interface ModuleInfo extends Named {
  /**
   * Module file name
   */
  readonly name: string;
  /**
   * Module full file path
   */
  readonly path: string;
}

export class ModuleDefinition implements ModuleInfo {
  public readonly name: string;
  public readonly path: string;
  public readonly models: Map<string, ModelDefinition> = new Map<string, ModelDefinition>();
  public readonly dependencies: Map<string, DependencyDefinition> = new Map<string, DependencyDefinition>();

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }

  addDependency(dep: DependencyDefinition): void {
    let dependency = this.dependencies.get(dep.moduleSpecifier);
    if (!dependency) {
      dependency = { moduleSpecifier: dep.moduleSpecifier, namedImports: new Set(dep.namedImports) };
      this.dependencies.set(dep.moduleSpecifier, dependency);
    }

    console.log('before add', dep.moduleSpecifier, [...dependency.namedImports]);
    dep.namedImports.forEach((namedImport) => {
      dependency.namedImports.add(namedImport);
    });
    console.log('after add', dep.moduleSpecifier, [...dependency.namedImports]);
  }

  addDependencies(deps: DependencyDefinition[]): void {
    deps.forEach((dep) => {
      this.addDependency(dep);
    });
  }

  addModel(model: ModelDefinition): boolean {
    if (this.models.has(model.name)) {
      return false;
    }
    this.addDependencies(model.dependencies);
    this.models.set(model.name, model);
    return true;
  }

  /**
   * Get module dependencies
   */
  getDependencies(): DependencyDefinition[] {
    return Array.from(this.dependencies.values());
  }

  getModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

}