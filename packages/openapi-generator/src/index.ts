import { parseOpenAPI } from './parser/openapiParser';
import { generateSchemas } from './generator/schemaGenerator';
import { generateClients } from './generator/clientGenerator';
import type { ParsedOpenAPI } from './types';

export type { ParsedOpenAPI };
export { parseOpenAPI, generateSchemas, generateClients };

/**
 * 生成 TypeScript 代码
 * @param inputPath OpenAPI 规范文件路径
 * @param outputPath 输出路径
 */
export function generate(inputPath: string, outputPath: string): void {
  try {
    // 解析 OpenAPI 规范
    const openapi = parseOpenAPI(inputPath);

    // 生成数据模型
    generateSchemas(openapi, outputPath);

    // 生成 API 客户端
    generateClients(openapi, outputPath);

    console.log('Code generation completed successfully!');
  } catch (error) {
    console.error('Error during code generation:', error);
    throw error;
  }
}
