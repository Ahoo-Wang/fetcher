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

import { ModuleDefinition } from '@/module/moduleDefinition.ts';
import { Project, SourceFile } from 'ts-morph';
import { ModelDefinition } from '@/model/modelDefinition.ts';
import { join } from 'path';

export class CodeGenerator {
  constructor(
    private readonly outDir: string,
    private readonly project: Project,
  ) {
  }

  generate(modules: ModuleDefinition[]): void {
    modules.forEach(module => {
      this.generateModule(module);
    });
    this.project.saveSync();
  }

  generateModule(module: ModuleDefinition): void {
    const modulePath = join(this.outDir, module.path, 'types.ts');
    const moduleFile = this.project.createSourceFile(modulePath, '', {
      overwrite: true,
    });
    module.getDependencies().forEach(dep => {
      moduleFile.addImportDeclaration({
        moduleSpecifier: dep.moduleSpecifier,
        namedImports: [...dep.namedImports],
      });
    });
    module.getModels().forEach(model => {
      this.generateModel(moduleFile, model);
    });
  }

  generateModel(moduleFile: SourceFile, model: ModelDefinition): void {
    if (model.isReference) {
      return;
    }
    const modelInterface = moduleFile.addInterface({
      name: model.name,
      isExported: true,
    });
    if (model.description) {
      modelInterface.addJsDoc({
        description: model.description,
      });
    }
    if (model.properties) {
      model.properties.forEach((type, name) => {
        modelInterface.addProperty({
          name,
          type,
        });
      });
    }
  }
}
