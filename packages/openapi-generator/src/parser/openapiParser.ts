import { readFileSync } from 'fs';
import { parse } from 'yaml';
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';
import type { ParsedOpenAPI, ParsedSchema, ParsedOperation } from '../types';
import { WOW_TYPE_MAPPING } from '../constants';

export function parseOpenAPI(inputPath: string): ParsedOpenAPI {
  const content = readFileSync(inputPath, 'utf-8');
  const openapi: OpenAPI = inputPath.endsWith('.json')
    ? JSON.parse(content)
    : parse(content);

  const schemas = parseSchemas(openapi);
  const operations = parseOperations(openapi);
  const tags = parseTags(openapi);

  return { schemas, operations, tags };
}

function parseSchemas(openapi: OpenAPI): Record<string, ParsedSchema> {
  const schemas: Record<string, ParsedSchema> = {};

  if (!openapi.components?.schemas) {
    return schemas;
  }

  for (const [schemaKey, schema] of Object.entries(
    openapi.components.schemas,
  )) {
    if (!schema || typeof schema !== 'object') continue;

    const { filePath, interfaceName } = parseSchemaKey(schemaKey);
    const isWowType = schemaKey.startsWith('wow.');
    const wowType = isWowType
      ? (WOW_TYPE_MAPPING as Record<string, string>)[schemaKey]
      : undefined;

    const resolvedSchema = resolveSchemaReferences(schema, openapi);
    schemas[schemaKey] = {
      name: schemaKey,
      interfaceName,
      filePath,
      schema: resolvedSchema,
      isWowType,
      wowType,
    };
  }

  return schemas;
}

function parseSchemaKey(schemaKey: string): {
  filePath: string;
  interfaceName: string;
} {
  const parts = schemaKey.split('.');

  let interfaceName = '';
  let filePathParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (
      part[0] === part[0]?.toUpperCase() &&
      part[0] !== part[0]?.toLowerCase()
    ) {
      // Found the first part that starts with uppercase (interface name)
      interfaceName = parts.slice(i).join('');
      break;
    }
    filePathParts.push(part);
  }

  if (!interfaceName) {
    // If no uppercase part found, use the last part as interface name
    interfaceName = parts[parts.length - 1];
    filePathParts = parts.slice(0, -1);
  }

  // For Wow types, use the full schema key as interface name to avoid conflicts
  if (schemaKey.startsWith('wow.')) {
    interfaceName = schemaKey.replace(/\./g, '');
  }

  const fileName = filePathParts.length > 0 ? 'types.ts' : './types.ts';
  const filePath =
    filePathParts.length > 0
      ? `${filePathParts.join('/')}/${fileName}`
      : fileName;

  return { filePath, interfaceName };
}

function parseOperations(openapi: OpenAPI): ParsedOperation[] {
  const operations: ParsedOperation[] = [];

  if (!openapi.paths) {
    return operations;
  }

  for (const [path, pathItem] of Object.entries(openapi.paths)) {
    if (!pathItem) continue;

    for (const method of [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'head',
      'options',
      'trace',
    ] as const) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Resolve parameter references
      const allParameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ].map((param: any) => {
        if (param.$ref) {
          const refPath = param.$ref;
          if (refPath.startsWith('#/components/parameters/')) {
            const paramName = refPath.substring(
              '#/components/parameters/'.length,
            );
            const refParam = openapi.components?.parameters?.[paramName];
            return refParam || param;
          }
        }
        return param;
      });

      const normalizedTags = (operation.tags || []).map(tag => {
        if (tag === 'cart-controller') return 'example.cart';
        if (tag === 'order-query-controller') return 'example.order';
        return tag;
      });

      operations.push({
        path,
        method,
        operation,
        tags: normalizedTags,
        parameters: allParameters,
        requestBody: operation.requestBody,
        responses: operation.responses || {},
      });
    }
  }

  return operations;
}

function parseTags(openapi: OpenAPI): Set<string> {
  const tags = new Set<string>();

  if (openapi.tags) {
    for (const tag of openapi.tags) {
      if (tag.name) {
        tags.add(tag.name);
      }
    }
  }

  if (openapi.paths) {
    for (const pathItem of Object.values(openapi.paths)) {
      if (!pathItem) continue;

      for (const method of [
        'get',
        'post',
        'put',
        'delete',
        'patch',
        'head',
        'options',
        'trace',
      ] as const) {
        const operation = pathItem[method];
        if (operation?.tags) {
          for (const tag of operation.tags) {
            tags.add(tag);
          }
        }
      }
    }
  }

  return tags;
}

function resolveSchemaReferences(
  schema: any,
  openapi: OpenAPI,
  visitedRefs = new Set<string>(),
): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if ('$ref' in schema) {
    const refPath = schema.$ref;
    if (refPath.startsWith('#/components/schemas/')) {
      const refKey = refPath.substring('#/components/schemas/'.length);

      // Don't resolve Wow types - keep them as references
      if (refKey.startsWith('wow.')) {
        return schema;
      }

      // Prevent circular references
      if (visitedRefs.has(refKey)) {
        return { type: 'any' }; // Return any type for circular references
      }

      const refSchema = openapi.components?.schemas?.[refKey];
      if (refSchema && typeof refSchema === 'object') {
        visitedRefs.add(refKey);
        const resolved = resolveSchemaReferences(
          refSchema,
          openapi,
          visitedRefs,
        );
        visitedRefs.delete(refKey);
        return resolved;
      }
    }
    return { type: 'any' }; // Fallback for unresolved references
  }

  // Recursively resolve references in nested properties
  if (schema.properties) {
    const resolvedProperties: Record<string, any> = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      resolvedProperties[propName] = resolveSchemaReferences(
        propSchema,
        openapi,
        visitedRefs,
      );
    }
    return { ...schema, properties: resolvedProperties };
  }

  if (schema.items) {
    return {
      ...schema,
      items: resolveSchemaReferences(schema.items, openapi, visitedRefs),
    };
  }

  if (schema.additionalProperties) {
    return {
      ...schema,
      additionalProperties: resolveSchemaReferences(
        schema.additionalProperties,
        openapi,
        visitedRefs,
      ),
    };
  }

  if (schema.allOf) {
    return {
      ...schema,
      allOf: schema.allOf.map((s: any) =>
        resolveSchemaReferences(s, openapi, visitedRefs),
      ),
    };
  }

  if (schema.anyOf) {
    return {
      ...schema,
      anyOf: schema.anyOf.map((s: any) =>
        resolveSchemaReferences(s, openapi, visitedRefs),
      ),
    };
  }

  if (schema.oneOf) {
    return {
      ...schema,
      oneOf: schema.oneOf.map((s: any) =>
        resolveSchemaReferences(s, openapi, visitedRefs),
      ),
    };
  }

  return schema;
}
