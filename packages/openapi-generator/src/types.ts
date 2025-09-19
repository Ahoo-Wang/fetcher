import type { Schema } from '@ahoo-wang/fetcher-openapi';

export interface ParsedSchema {
  name: string;
  interfaceName: string;
  filePath: string;
  schema: Schema;
  isWowType: boolean;
  wowType?: string;
}

export interface ParsedOperation {
  path: string;
  method: string;
  operation: any;
  tags: string[];
  parameters: any[];
  requestBody?: any;
  responses: any;
}

export interface ParsedOpenAPI {
  schemas: Record<string, ParsedSchema>;
  operations: ParsedOperation[];
  tags: Set<string>;
}

export interface ModuleInfo {
  filePath: string;
  interfaceName: string;
  importPath?: string;
}

export interface SchemaGenerationOptions {
  outputPath: string;
  wowTypeMapping: Record<string, string>;
}
