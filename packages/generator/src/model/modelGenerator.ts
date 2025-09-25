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

import { OpenAPI, Schema } from '@ahoo-wang/fetcher-openapi';
import { Project, SourceFile } from 'ts-morph';
import { ModelInfo, resolveModelInfo } from '@/model/naming.ts';
import { combineURLs } from '@ahoo-wang/fetcher';
import { isEnum } from '@/utils/schemas.ts';
import { GenerateContext } from '@/types.ts';

const MODEL_FILE_NAME = 'types.ts';

export class ModelGenerator implements GenerateContext {
  readonly project: Project;
  readonly openAPI: OpenAPI;
  readonly outputDir: string;

  constructor(context: GenerateContext) {
    this.project = context.project;
    this.openAPI = context.openAPI;
    this.outputDir = context.outputDir;
  }

  private getOrCreateSourceFile(modelInfo: ModelInfo): SourceFile {
    let fileName = combineURLs(modelInfo.path, MODEL_FILE_NAME);
    fileName = combineURLs(this.outputDir, fileName);
    const file = this.project.getSourceFile(fileName);
    if (file) {
      return file;
    }
    return this.project.createSourceFile(fileName, '', {
      overwrite: true,
    });
  };

  generate() {
    const schemas = this.openAPI.components?.schemas;
    if (!schemas) {
      return;
    }
    Object.entries(schemas).forEach(([schemaKey, schema]) => {
      if (schemaKey.startsWith('wow.')) {
        return;
      }
      this.generateKeyedSchema(schemaKey, schema);
    });
  }

  generateKeyedSchema(schemaKey: string, schema: Schema) {
    const modelInfo = resolveModelInfo(schemaKey);
    const sourceFile = this.getOrCreateSourceFile(modelInfo);
    if (isEnum(schema)) {
      sourceFile.addEnum({
        name: modelInfo.name,
        members: schema.enum.map(value => ({
          name: value,
          initializer: `'${value}'`,
        })),
      });
      return;
    }
  }


}
