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

import { Project, ProjectOptions, SourceFile } from 'ts-morph';
import path from 'path';
import { FileUtils } from '../../utils/file-utils';
import { Logger } from '../../utils/logger';

export class ASTBuilder {
  private readonly project: Project;
  private readonly outputDir: string;

  constructor(outputDir: string, options?: ProjectOptions) {
    this.project = new Project(options);
    this.outputDir = outputDir;
  }

  async createSourceFile(filePath: string): Promise<SourceFile> {
    const fullPath = path.join(this.outputDir, `${filePath}.ts`);
    await FileUtils.ensureDirectoryExists(path.dirname(fullPath));
    return this.project.createSourceFile(fullPath, '', { overwrite: true });
  }

  addInterface(sourceFile: SourceFile, name: string, properties: any[]): void {
    sourceFile.addInterface({
      name,
      properties,
      isExported: true,
    });
  }

  addTypeAlias(sourceFile: SourceFile, name: string, type: string): void {
    sourceFile.addTypeAlias({
      name,
      type,
      isExported: true,
    });
  }

  addEnum(sourceFile: SourceFile, name: string, members: any[]): void {
    sourceFile.addEnum({
      name,
      members,
      isExported: true,
    });
  }

  addClass(sourceFile: SourceFile, name: string, methods: any[]): void {
    sourceFile.addClass({
      name,
      methods,
      isExported: true,
    });
  }

  addImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string, namedImports: string[]): void {
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: namedImports.map(name => ({ name })),
    });
  }

  async saveAll(): Promise<void> {
    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      await FileUtils.writeFile(filePath, sourceFile.getFullText());
      Logger.info(`Generated: ${filePath}`);
    }
  }
}