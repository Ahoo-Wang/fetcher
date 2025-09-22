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
        generateSchemaInterface(sourceFile, schema, openapi.schemas);
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

function generateSchemaInterface(
  sourceFile: any,
  schema: ParsedSchema,
  schemas: Record<string, ParsedSchema>,
): void {
  const properties: any[] = [];
  const wowTypes = new Set<string>();

  if (schema.schema.properties) {
    for (const [propName, propSchema] of Object.entries(
      schema.schema.properties,
    )) {
      if (typeof propSchema !== 'object' || propSchema === null) continue;

      const property = {
        name: propName,
        type: getTypeFromSchema(propSchema, schemas, wowTypes),
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

  // Add imports for Wow types used in this interface
  if (wowTypes.size > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: IMPORT_WOW_PATH,
      namedImports: Array.from(wowTypes),
    });
  }
}

function getTypeFromSchema(
  schema: any,
  schemas: Record<string, ParsedSchema>,
  wowTypes?: Set<string>,
): string {
  if (!schema || typeof schema !== 'object') {
    return 'any';
  }

  // Handle $ref references
  if (schema.$ref) {
    const refKey = schema.$ref.replace('#/components/schemas/', '');
    const refSchema = schemas[refKey];
    if (refSchema) {
      // For Wow types, use the Wow type directly
      if (refSchema.isWowType && refSchema.wowType) {
        if (wowTypes) {
          wowTypes.add(refSchema.wowType);
        }
        return refSchema.wowType;
      }
      return refSchema.interfaceName;
    }
    return 'any';
  }

  if (schema.type) {
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map((val: any) => `'${val}'`).join(' | ');
        }
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        const itemsType = schema.items
          ? getTypeFromSchema(schema.items, schemas, wowTypes)
          : 'any';
        return `${itemsType}[]`;
      case 'object':
        if (schema.properties) {
          // Generate inline interface for complex objects
          const props = Object.entries(schema.properties)
            .map(([key, propSchema]: [string, any]) => {
              const isRequired = schema.required?.includes(key);
              const type = getTypeFromSchema(propSchema, schemas, wowTypes);
              return `${key}${isRequired ? '' : '?'}: ${type}`;
            })
            .join('; ');
          return `{ ${props} }`;
        }
        if (schema.additionalProperties) {
          const valueType = getTypeFromSchema(
            schema.additionalProperties,
            schemas,
            wowTypes,
          );
          return `Record<string, ${valueType}>`;
        }
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  if (schema.oneOf || schema.anyOf || schema.allOf) {
    const schemasList = schema.oneOf || schema.anyOf || schema.allOf || [];
    const types = schemasList.map((s: any) =>
      getTypeFromSchema(s, schemas, wowTypes),
    );
    const joiner = schema.oneOf ? ' | ' : schema.anyOf ? ' | ' : ' & ';
    return types.join(joiner);
  }

  return 'any';
}
