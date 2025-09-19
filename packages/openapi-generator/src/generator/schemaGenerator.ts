import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Project } from 'ts-morph';
import type { ParsedOpenAPI, ParsedSchema } from '../types';
import { IMPORT_WOW_PATH } from '../constants';

export function generateSchemas(
  openapi: ParsedOpenAPI,
  outputPath: string,
): void {
  const project = new Project();
  const schemaFiles = new Map<string, Set<ParsedSchema>>();

  for (const schema of Object.values(openapi.schemas)) {
    if (!schemaFiles.has(schema.filePath)) {
      schemaFiles.set(schema.filePath, new Set());
    }
    schemaFiles.get(schema.filePath)!.add(schema);
  }

  for (const [filePath, schemas] of schemaFiles) {
    const fullPath = join(outputPath, filePath);
    mkdirSync(dirname(fullPath), { recursive: true });

    const sourceFile = project.createSourceFile(fullPath, undefined, {
      overwrite: true,
    });

    const wowTypes = new Set<string>();

    for (const schema of schemas) {
      if (schema.isWowType && schema.wowType) {
        wowTypes.add(schema.wowType);
        sourceFile.addInterface({
          name: schema.interfaceName,
          isExported: true,
          extends: [schema.wowType],
        });
      } else {
        generateSchemaInterface(sourceFile, schema);
      }
    }

    if (wowTypes.size > 0) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: IMPORT_WOW_PATH,
        namedImports: Array.from(wowTypes),
      });
    }

    sourceFile.saveSync();
  }
}

function generateSchemaInterface(sourceFile: any, schema: ParsedSchema): void {
  const properties: any[] = [];

  if (schema.schema.properties) {
    for (const [propName, propSchema] of Object.entries(
      schema.schema.properties,
    )) {
      if (typeof propSchema !== 'object' || propSchema === null) continue;

      const property = {
        name: propName,
        type: getTypeFromSchema(propSchema),
        hasQuestionToken: !schema.schema.required?.includes(propName),
      };
      properties.push(property);
    }
  }

  sourceFile.addInterface({
    name: schema.interfaceName,
    isExported: true,
    properties,
  });
}

function getTypeFromSchema(schema: any): string {
  if (schema.type) {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        const itemsType = schema.items
          ? getTypeFromSchema(schema.items)
          : 'any';
        return `${itemsType}[]`;
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  if (schema.enum) {
    return schema.enum.map((val: any) => `'${val}'`).join(' | ');
  }

  if (schema.oneOf || schema.anyOf || schema.allOf) {
    const schemas = schema.oneOf || schema.anyOf || schema.allOf || [];
    return schemas.map((s: any) => getTypeFromSchema(s)).join(' | ');
  }

  return 'any';
}
