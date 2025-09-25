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

import { OpenAPI, Schema, Reference } from '@ahoo-wang/fetcher-openapi';
import { Project, SourceFile } from 'ts-morph';
import { ModelInfo, resolveModelInfo } from '@/model/naming.ts';
import { isEnum } from '@/utils/schemas.ts';
import { GenerateContext } from '@/types.ts';
import { AggregateDefinition } from '@/aggregate';
import { IMPORT_WOW_PATH, WOW_TYPE_MAPPING } from '@/model/wowTypeMapping.ts';
import { extractComponentKey, isReference } from '@/utils';
import { addImport, addImportModelInfo, getOrCreateSourceFile } from '@/utils/sourceFiles.ts';


export class ModelGenerator implements GenerateContext {
  readonly project: Project;
  readonly openAPI: OpenAPI;
  readonly outputDir: string;
  readonly aggregates: Map<string, AggregateDefinition>;

  constructor(context: GenerateContext) {
    this.project = context.project;
    this.openAPI = context.openAPI;
    this.outputDir = context.outputDir;
    this.aggregates = context.aggregates;
  }

  private getOrCreateSourceFile(modelInfo: ModelInfo): SourceFile {
    return getOrCreateSourceFile(this.project, this.outputDir, modelInfo);
  }

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
    if (this.processEnum(modelInfo, sourceFile, schema)) {
      return;
    }
    if (this.processObject(modelInfo, sourceFile, schema)) {
      return;
    }
    if (this.processUnion(modelInfo, sourceFile, schema)) {
      return;
    }
    // Handle other schema types (arrays, primitives) as type aliases
    this.processTypeAlias(modelInfo, sourceFile, schema);
    sourceFile.organizeImports();
    sourceFile.fixMissingImports();
    sourceFile.fixUnusedIdentifiers();
  }

  processEnum(
    modelInfo: ModelInfo,
    sourceFile: SourceFile,
    schema: Schema,
  ): boolean {
    if (!isEnum(schema)) {
      return false;
    }
    sourceFile.addEnum({
      name: modelInfo.name,
      isExported: true,
      members: schema.enum
        .filter(value => typeof value === 'string' && value.length > 0)
        .map(value => ({
          name: value,
          initializer: `'${value}'`,
        })),
    });
    return true;
  }

  processObject(
    modelInfo: ModelInfo,
    sourceFile: SourceFile,
    schema: Schema,
  ): boolean {
    if (schema.type !== 'object' || !schema.properties) {
      return false;
    }
    const properties: Record<string, string> = {};
    const required = schema.required || [];

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propType = this.resolveType(modelInfo, sourceFile, propSchema);
      const isOptional = !required.includes(propName);
      properties[propName] = isOptional ? `${propType} | undefined` : propType;
    }

    sourceFile.addInterface({
      name: modelInfo.name,
      isExported: true,
      properties: Object.entries(properties).map(([name, type]) => ({
        name,
        type,
      })),
    });
    return true;
  }

  processUnion(
    modelInfo: ModelInfo,
    sourceFile: SourceFile,
    schema: Schema,
  ): boolean {
    let unionType: string | null = null;

    if (schema.allOf) {
      unionType = schema.allOf.map(s => this.resolveType(modelInfo, sourceFile, s)).join(' & ');
    } else if (schema.anyOf) {
      unionType = schema.anyOf.map(s => this.resolveType(modelInfo, sourceFile, s)).join(' | ');
    } else if (schema.oneOf) {
      unionType = schema.oneOf.map(s => this.resolveType(modelInfo, sourceFile, s)).join(' | ');
    }

    if (!unionType) {
      return false;
    }

    sourceFile.addTypeAlias({
      name: modelInfo.name,
      type: unionType,
      isExported: true,
    });
    return true;
  }

  processTypeAlias(
    modelInfo: ModelInfo,
    sourceFile: SourceFile,
    schema: Schema,
  ) {
    const type = this.resolveType(modelInfo, sourceFile, schema);
    sourceFile.addTypeAlias({
      name: modelInfo.name,
      type,
      isExported: true,
    });
  }

  private resolveType(modelInfo: ModelInfo, sourceFile: SourceFile, schema: Schema | Reference): string {
    if (isReference(schema)) {
      return this.resolveReference(modelInfo, sourceFile, schema);
    }

    if (schema.type === 'array') {
      const itemType = schema.items ? this.resolveType(modelInfo, sourceFile, schema.items) : 'any';
      return `${itemType}[]`;
    }

    if (schema.type === 'object' && !schema.properties) {
      return 'Record<string, any>';
    }

    if (Array.isArray(schema.type)) {
      return schema.type
        .map((t: string) => this.getPrimitiveType(t))
        .join(' | ');
    }

    if (schema.type) {
      return this.getPrimitiveType(schema.type);
    }

    // Handle nullable
    if (schema.nullable) {
      return `${this.resolveType(modelInfo, sourceFile, { ...schema, nullable: false })} | null`;
    }

    return 'any';
  }


  private resolveReference(modelInfo: ModelInfo, sourceFile: SourceFile, ref: Reference): string {
    const schemaKey = extractComponentKey(ref);
    const refModelInfo = resolveModelInfo(schemaKey);
    const mappedType =
      WOW_TYPE_MAPPING[schemaKey as keyof typeof WOW_TYPE_MAPPING];
    if (mappedType) {
      addImport(sourceFile, IMPORT_WOW_PATH, [mappedType]);
      return mappedType;
    }
    addImportModelInfo(modelInfo, sourceFile, this.outputDir, refModelInfo);
    return refModelInfo.name;
  }

  private getPrimitiveType(type: string): string {
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      default:
        return 'any';
    }
  }
}
