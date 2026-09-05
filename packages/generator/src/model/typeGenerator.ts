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

import type { ModelInfo } from './modelInfo';
import { resolveReferenceModelInfo } from './modelInfo';
import type { InterfaceDeclaration, JSDocableNode, SourceFile } from 'ts-morph';
import type { Components, Reference, Schema } from '@ahoo-wang/fetcher-openapi';
import type {
  ArraySchema,
  CompositionSchema,
  EnumSchema,
  KeySchema,
  MapSchema,
  ObjectSchema,
} from '../utils';
import {
  addImportModelInfo,
  addMainSchemaJSDoc,
  addSchemaJSDoc,
  getEnumText,
  getMapKeySchema,
  isAllOf,
  isArray,
  isComposition,
  isEnum,
  isMap,
  isObject,
  isReadOnly,
  isReference,
  jsDoc,
  resolveEnumMemberName,
  resolvePrimitiveType,
  resolvePropertyName,
  schemaJSDoc,
  toArrayType,
} from '../utils';
import type { Generator } from '../generateContext';

export class TypeGenerator implements Generator {
  constructor(
    private readonly modelInfo: ModelInfo,
    private readonly sourceFile: SourceFile,
    private readonly keySchema: KeySchema,
    private readonly outputDir: string,
    private readonly components?: Components,
  ) {}

  generate(): void {
    const node = this.process();
    if (node) {
      addMainSchemaJSDoc(node, this.keySchema.schema, this.keySchema.key);
    }
  }

  private process(): JSDocableNode | undefined {
    const { schema } = this.keySchema;
    if (isEnum(schema) && !isComposition(schema)) {
      return schema.enum.every(value => typeof value === 'string')
        ? this.processEnum(schema)
        : this.processTypeAlias(schema);
    }
    if (
      (schema.nullable && schema.type) ||
      (isComposition(schema) &&
        (schema.type || schema.properties || schema.required))
    ) {
      return this.processTypeAlias(schema);
    }
    if (isObject(schema)) {
      return this.processInterface(schema);
    }
    if (isArray(schema)) {
      return this.processArray(schema);
    }
    if (isComposition(schema)) {
      return this.processComposition(schema);
    }
    return this.processTypeAlias(schema);
  }

  private resolveReference(schema: Reference) {
    const refModelInfo = resolveReferenceModelInfo(schema, this.components);
    addImportModelInfo(
      this.modelInfo,
      this.sourceFile,
      this.outputDir,
      refModelInfo,
    );
    return refModelInfo;
  }

  private resolveAdditionalProperties(schema: Schema): string {
    if (
      schema.additionalProperties === undefined ||
      schema.additionalProperties === false
    ) {
      return '';
    }

    if (schema.additionalProperties === true) {
      return '[key: string]: any';
    }

    return `[key: string]: ${this.resolveAdditionalPropertyType(schema)}`;
  }

  private resolveAdditionalPropertyType(schema: Schema): string {
    const valueType = this.resolveType(
      typeof schema.additionalProperties === 'object'
        ? schema.additionalProperties
        : {},
    );
    const hasOptionalProperty = Object.keys(schema.properties ?? {}).some(
      name => !schema.required?.includes(name),
    );
    return hasOptionalProperty && valueType !== 'any'
      ? `${valueType} | undefined`
      : valueType;
  }

  private resolveRequiredAdditionalPropertyType(schema: Schema): string {
    if (schema.additionalProperties === false) return 'never';
    if (typeof schema.additionalProperties === 'object') {
      return this.resolveType(schema.additionalProperties);
    }
    return '{} | null';
  }

  private resolvePropertyDefinitions(schema: ObjectSchema): string[] {
    const { properties } = schema;
    return Object.entries(properties).map(([propName, propSchema]) => {
      const type = this.resolveType(propSchema);
      const resolvedPropName =
        resolvePropertyName(propName) +
        (schema.required?.includes(propName) ? '' : '?');
      if (!isReference(propSchema)) {
        const jsDocDescriptions = schemaJSDoc(propSchema);
        const doc = jsDoc(jsDocDescriptions, '\n * ');
        if (doc) {
          return `
          /**
           * ${doc}
           */
          ${resolvedPropName}: ${type}
          `;
        }
      }
      return `${resolvedPropName}: ${type}`;
    });
  }

  private resolveObjectType(schema: Schema): string {
    const parts: string[] = [];
    if (isObject(schema)) {
      const propertyDefs = this.resolvePropertyDefinitions(schema);
      parts.push(...propertyDefs);
    }

    for (const name of schema.required ?? []) {
      if (!schema.properties || !(name in schema.properties)) {
        parts.push(
          `${resolvePropertyName(name)}: ${this.resolveRequiredAdditionalPropertyType(schema)}`,
        );
      }
    }
    const additionalProps = this.resolveAdditionalProperties(schema);
    if (additionalProps) {
      parts.push(additionalProps);
    }

    if (parts.length === 0) {
      return 'Record<string, any>';
    }

    return `{\n  ${parts.join(';\n  ')}; \n}`;
  }

  private resolveMapValueType(schema: MapSchema): string {
    if (
      schema.additionalProperties === undefined ||
      schema.additionalProperties === false ||
      schema.additionalProperties === true
    ) {
      return 'any';
    }
    return this.resolveType(schema.additionalProperties);
  }

  private resolveMapKeyType(schema: Schema): string {
    const mapKeySchema = getMapKeySchema(schema);
    if (!mapKeySchema) {
      return 'string';
    }
    return this.resolveType(mapKeySchema);
  }

  private resolveMapType(schema: MapSchema): string {
    const keyType = this.resolveMapKeyType(schema);
    const valueType = this.resolveMapValueType(schema);
    return `Record<${keyType},${valueType}>`;
  }

  resolveType(schema: Schema | Reference): string {
    if (isReference(schema)) {
      return this.resolveReference(schema).name;
    }
    if (isComposition(schema)) {
      const schemas = schema.oneOf || schema.anyOf || schema.allOf || [];
      const types = schemas.map(s => {
        const type = this.resolveType(s);
        return type === 'any'
          ? 'unknown'
          : /[|&]/.test(type)
            ? `(${type})`
            : type;
      });
      const separator = isAllOf(schema) ? ' & ' : ' | ';
      const composed = `(${types.join(separator)})`;
      const base = {
        ...schema,
        oneOf: undefined,
        anyOf: undefined,
        allOf: undefined,
      };
      return base.type || base.properties || base.required?.length || base.enum
        ? `(${composed} & (${this.resolveType(base)}))`
        : composed;
    }
    if (schema.nullable && schema.type && !isEnum(schema)) {
      return `(${this.resolveType({ ...schema, nullable: false })}) | null`;
    }
    if (isMap(schema) && !schema.required?.length) {
      return this.resolveMapType(schema);
    }
    if (schema.const) {
      return `'${schema.const}'`;
    }
    if (isEnum(schema)) {
      return schema.enum
        .map(value =>
          typeof value === 'string'
            ? `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
            : JSON.stringify(value),
        )
        .join(' | ');
    }

    if (isArray(schema)) {
      const itemType = this.resolveType(schema.items);
      return toArrayType(itemType);
    }
    if (schema.type === 'object') {
      return this.resolveObjectType(schema);
    }
    if (!schema.type) {
      if (schema.required?.length) {
        // required constrains objects; by itself it does not reject null or other JSON types.
        return `(${this.resolveObjectType({ ...schema, type: 'object' })} | null | string | number | boolean | unknown[])`;
      }
      return 'any';
    }
    return resolvePrimitiveType(schema.type);
  }

  private processEnum(schema: EnumSchema): JSDocableNode | undefined {
    const enumText = getEnumText(schema);
    if (enumText) {
      this.sourceFile.addEnum({
        name: this.modelInfo.name + 'EnumText',
        isExported: true,
        members: Object.entries(enumText).map(([name, text]) => {
          return {
            name: resolveEnumMemberName(name),
            initializer: `\`${text}\``,
          };
        }),
      });
    }
    return this.sourceFile.addEnum({
      name: this.modelInfo.name,
      isExported: true,
      members: schema.enum
        .filter(value => typeof value === 'string')
        .map(value => ({
          name: resolveEnumMemberName(value),
          initializer: `\`${value}\``,
        })),
    });
  }

  private addPropertyToInterface(
    interfaceDeclaration: InterfaceDeclaration,
    propName: string,
    propSchema: Schema | Reference,
    required: boolean = true,
  ): void {
    const propType = this.resolveType(propSchema);
    const resolvedPropName = resolvePropertyName(propName);
    let propertySignature = interfaceDeclaration.getProperty(resolvedPropName);
    if (propertySignature) {
      propertySignature.setType(propType);
      if (required) propertySignature.setHasQuestionToken(false);
    } else {
      propertySignature = interfaceDeclaration.addProperty({
        name: resolvedPropName,
        type: propType,
        isReadonly: isReadOnly(propSchema),
        hasQuestionToken: !required,
      });
    }
    addSchemaJSDoc(propertySignature, propSchema);
  }

  private processInterface(schema: ObjectSchema): JSDocableNode | undefined {
    const interfaceDeclaration = this.sourceFile.addInterface({
      name: this.modelInfo.name,
      isExported: true,
    });

    const properties = schema.properties || {};

    Object.entries(properties).forEach(([propName, propSchema]) => {
      this.addPropertyToInterface(
        interfaceDeclaration,
        propName,
        propSchema,
        schema.required?.includes(propName) ?? false,
      );
    });

    for (const name of schema.required ?? []) {
      if (!(name in properties)) {
        interfaceDeclaration.addProperty({
          name: resolvePropertyName(name),
          type: this.resolveRequiredAdditionalPropertyType(schema),
        });
      }
    }

    if (schema.additionalProperties) {
      const indexSignature = interfaceDeclaration.addIndexSignature({
        keyName: 'key',
        keyType: 'string',
        returnType: this.resolveAdditionalPropertyType(schema),
      });
      indexSignature.addJsDoc('Additional properties');
    }
    return interfaceDeclaration;
  }

  private processArray(schema: ArraySchema): JSDocableNode | undefined {
    const itemType = this.resolveType(schema.items);
    return this.sourceFile.addTypeAlias({
      name: this.modelInfo.name,
      type: `Array<${itemType}>`,
      isExported: true,
    });
  }

  private processComposition(
    schema: CompositionSchema,
  ): JSDocableNode | undefined {
    return this.sourceFile.addTypeAlias({
      name: this.modelInfo.name,
      type: this.resolveType(schema),
      isExported: true,
    });
  }

  private processTypeAlias(schema: Schema): JSDocableNode | undefined {
    return this.sourceFile.addTypeAlias({
      name: this.modelInfo.name,
      type: this.resolveType(schema),
      isExported: true,
    });
  }
}
