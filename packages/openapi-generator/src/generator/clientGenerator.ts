import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Project } from 'ts-morph';
import type { ParsedOpenAPI } from '../types';

export function generateClients(
  openapi: ParsedOpenAPI,
  outputPath: string,
): void {
  const project = new Project();
  const clientFiles = new Map<string, Set<string>>();
  const tagOperations = new Map<string, any[]>();

  for (const operation of openapi.operations) {
    for (const tag of operation.tags) {
      if (!tagOperations.has(tag)) {
        tagOperations.set(tag, []);
      }
      tagOperations.get(tag)!.push(operation);
    }
  }

  for (const [tag, operations] of tagOperations) {
    const { filePath, interfaceName } = parseTagName(tag);
    const fullPath = join(outputPath, filePath);
    mkdirSync(dirname(fullPath), { recursive: true });

    if (!clientFiles.has(filePath)) {
      clientFiles.set(filePath, new Set());
    }
    clientFiles.get(filePath)!.add(interfaceName);

    const sourceFile = project.createSourceFile(fullPath, undefined, {
      overwrite: true,
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: '@ahoo-wang/fetcher-decorator',
      namedImports: [
        'Api',
        'Get',
        'Post',
        'Put',
        'Delete',
        'Patch',
        'Head',
        'Options',
      ],
    });

    sourceFile.addClass({
      name: interfaceName,
      isExported: true,
      decorators: [
        {
          name: 'Api',
          arguments: [`'${tag}'`],
        },
      ],
      methods: operations.map(operation => ({
        name: getOperationMethodName(operation),
        returnType: 'Promise<any>',
        decorators: [
          {
            name: getHttpMethodDecorator(operation.method),
            arguments: [`'${operation.path}'`],
          },
        ],
        parameters: getOperationParameters(operation),
      })),
    });

    sourceFile.saveSync();
  }
}

function parseTagName(tag: string): {
  filePath: string;
  interfaceName: string;
} {
  const parts = tag.split('.');

  if (parts.length === 1) {
    return {
      filePath: `./${parts[0]}Client.ts`,
      interfaceName: `${parts[0]}Client`,
    };
  }

  const interfaceName = parts[parts.length - 1];
  const filePath =
    parts.length > 1
      ? `${parts.slice(0, -1).join('/')}/${interfaceName}Client.ts`
      : `./${interfaceName}Client.ts`;

  return { filePath, interfaceName: `${interfaceName}Client` };
}

function getOperationMethodName(operation: any): string {
  if (operation.operation.operationId) {
    return operation.operation.operationId;
  }

  const pathParts = operation.path.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || 'item';

  return `${operation.method}${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`;
}

function getHttpMethodDecorator(method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1);
}

function getOperationParameters(operation: any): any[] {
  const parameters: any[] = [];

  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (param.in === 'path' || param.in === 'query') {
        parameters.push({
          name: param.name,
          type: 'string',
          hasQuestionToken: !param.required,
        });
      }
    }
  }

  if (operation.requestBody) {
    parameters.push({
      name: 'body',
      type: 'any',
      hasQuestionToken: false,
    });
  }

  return parameters;
}
