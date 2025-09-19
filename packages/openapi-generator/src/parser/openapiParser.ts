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
    if (!schema || typeof schema !== 'object' || '$ref' in schema) continue;

    const { filePath, interfaceName } = parseSchemaKey(schemaKey);
    const isWowType = schemaKey.startsWith('wow.');
    const wowType = isWowType
      ? (WOW_TYPE_MAPPING as Record<string, string>)[schemaKey]
      : undefined;

    schemas[schemaKey] = {
      name: schemaKey,
      interfaceName,
      filePath,
      schema,
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
    if (part[0] === part[0]?.toUpperCase()) {
      interfaceName = parts.slice(i).join('');
      break;
    }
    filePathParts.push(part);
  }

  if (!interfaceName) {
    interfaceName = parts[parts.length - 1];
    filePathParts = parts.slice(0, -1);
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

      operations.push({
        path,
        method,
        operation,
        tags: operation.tags || [],
        parameters: pathItem.parameters ? [...pathItem.parameters] : [],
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
