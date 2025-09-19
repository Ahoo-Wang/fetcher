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

export interface GeneratorOptions {
  readonly openAPI: OpenAPI;
  readonly project: Project;
}

export interface SchemaModule {
  filePath: string;
  schemas: Array<{ name: string; schema: Schema | Reference }>;
}

export class SchemaGenerator {
  constructor(public readonly options: GeneratorOptions) {

  }

  /**
   * 生成所有Schema类型定义
   */
  generate(): void {
    const { openAPI, project } = this.options;
    if (!openAPI.components?.schemas) {
      return;
    }

    // 按照模块分组schemas
    const schemaModules = this.groupSchemasIntoModules(openAPI.components.schemas);

    // 为每个模块生成文件
    for (const schemaModule of schemaModules) {
      this.generateModuleFile(schemaModule, project);
    }
  }

  /**
   * 将schemas按照模块路径分组
   * @param schemas
   * @returns
   */
  private groupSchemasIntoModules(schemas: Record<string, Schema | Reference>): SchemaModule[] {
    // 按模块路径分组
    const moduleMap = new Map<string, Array<{ name: string; schema: Schema | Reference }>>();

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const modulePath = this.getModuleFilePath(schemaName);

      if (!moduleMap.has(modulePath)) {
        moduleMap.set(modulePath, []);
      }

      moduleMap.get(modulePath)!.push({ name: schemaName, schema });
    }

    // 转换为数组格式
    return Array.from(moduleMap.entries()).map(([filePath, schemas]) => ({
      filePath,
      schemas,
    }));
  }

  /**
   * 根据schema名称获取模块文件路径
   * @param schemaName
   * @returns
   */
  private getModuleFilePath(schemaName: string): string {
    const parts = schemaName.split('.');
    const firstUpperIndex = parts.findIndex(part => /^[A-Z]/.test(part));

    // 如果没有找到大写字母开头的部分，或者是第一个就是大写字母开头
    if (firstUpperIndex <= 0) {
      return `${parts[0].toLowerCase()}.ts`;
    }

    // 构建模块路径直到第一个大写字母开头的部分
    const pathParts = parts.slice(0, firstUpperIndex);
    return `${pathParts.join('/')}.ts`;
  }

  /**
   * 生成模块文件
   * @param schemaModule
   * @param project
   */
  private generateModuleFile(schemaModule: SchemaModule, project: Project): void {
    // 确保目录存在
    const sourceFile = project.createSourceFile(`src/generated/${schemaModule.filePath}`, '', { overwrite: true });

    // 为每个schema生成接口
    for (const { name, schema } of schemaModule.schemas) {
      if (this.isReference(schema)) {
        // 处理引用类型
        this.generateReferenceInterface(sourceFile, name, schema as Reference);
      } else {
        // 处理普通schema
        this.generateSchemaInterface(sourceFile, name, schema as Schema);
      }
    }
  }

  /**
   * 判断是否为引用类型
   * @param schema
   * @returns
   */
  private isReference(schema: Schema | Reference): boolean {
    return !!(schema as Reference).$ref;
  }

  /**
   * 生成引用类型接口
   * @param sourceFile
   * @param schemaName
   * @param reference
   */
  private generateReferenceInterface(sourceFile: SourceFile, schemaName: string, reference: Reference): void {
    const interfaceName = this.extractInterfaceName(schemaName);
    sourceFile.addInterface({
      name: interfaceName,
      isExported: true,
      properties: [
        {
          name: '[key: string]',
          type: 'any',
          hasQuestionToken: true,
        },
      ],
      docs: [`Reference to ${reference.$ref}`],
    });
  }

  /**
   * 生成Schema接口
   * @param sourceFile
   * @param schemaName
   * @param schema
   */
  private generateSchemaInterface(sourceFile: SourceFile, schemaName: string, schema: Schema): void {
    const interfaceName = this.extractInterfaceName(schemaName);

    const properties = schema.properties ? Object.entries(schema.properties).map(([propName, propSchema]) => {
      return {
        name: propName,
        type: this.getPropertyType(propSchema),
        hasQuestionToken: !schema.required?.includes(propName),
        docs: propSchema.description ? [propSchema.description] : undefined,
      };
    }) : [];

    sourceFile.addInterface({
      name: interfaceName,
      isExported: true,
      properties,
      docs: schema.description ? [schema.description] : undefined,
    });
  }

  /**
   * 获取属性类型
   * @param schema
   * @returns
   */
  private getPropertyType(schema: Schema | Reference): string {
    if (this.isReference(schema)) {
      const ref = (schema as Reference).$ref;
      // 解析引用路径，提取引用的schema名称
      const refParts = ref.split('/');
      const refName = refParts[refParts.length - 1];
      return this.extractInterfaceName(refName);
    }

    const s = schema as Schema;
    if (s.type === 'string') {
      return 'string';
    } else if (s.type === 'number' || s.type === 'integer') {
      return 'number';
    } else if (s.type === 'boolean') {
      return 'boolean';
    } else if (s.type === 'array') {
      if (s.items) {
        return `${this.getPropertyType(s.items)}[]`;
      }
      return 'any[]';
    } else if (s.type === 'object') {
      if (s.properties) {
        const props = Object.entries(s.properties).map(([key, value]) => {
          return `${key}${s.required?.includes(key) ? '' : '?'}: ${this.getPropertyType(value)}`;
        });
        return `{ ${props.join('; ')} }`;
      }
      // 处理Record类型的对象
      if (s.additionalProperties) {
        if (typeof s.additionalProperties === 'boolean') {
          return 'Record<string, any>';
        } else {
          return `Record<string, ${this.getPropertyType(s.additionalProperties)}>`;
        }
      }
      return 'Record<string, any>';
    }

    // 处理联合类型
    if (Array.isArray(s.type)) {
      const types = s.type.map(type => {
        // 创建临时schema对象来处理每种类型
        const tempSchema: Schema = { ...s, type };
        return this.getPropertyType(tempSchema);
      });
      return types.join(' | ');
    }

    // 处理枚举类型
    if (s.enum) {
      return s.enum.map(value =>
        typeof value === 'string' ? `"${value}"` : String(value),
      ).join(' | ');
    }

    return 'any';
  }

  /**
   * 从完整schema名称中提取接口名称
   * @param schemaName
   * @returns
   */
  private extractInterfaceName(schemaName: string): string {
    const parts = schemaName.split('.');
    const firstUpperIndex = parts.findIndex(part => /^[A-Z]/.test(part));

    // 如果没有找到大写字母开头的部分或者第一个就是大写字母开头
    if (firstUpperIndex <= 0) {
      const lastPart = parts[parts.length - 1];
      // 首字母大写
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }

    // 从第一个大写字母开头的部分开始，连接成接口名
    return parts.slice(firstUpperIndex).map((part, index) => {
      // 第一个部分保持原样，其他部分首字母大写
      if (index === 0) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('');
  }
}