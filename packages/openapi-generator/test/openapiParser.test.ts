import { describe, it, expect } from 'vitest';
import { parseOpenAPI } from '../src/parser/openapiParser';

describe('OpenAPI Parser', () => {
  it('should parse a valid OpenAPI JSON file', () => {
    // 创建一个简单的 OpenAPI 规范用于测试
    const openapiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          'example.User': {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
            },
          },
        },
      },
    };

    // 将规范写入临时文件
    const fs = require('fs');
    const path = require('path');
    const tempDir = fs.mkdtempSync('openapi-test-');
    const tempFile = path.join(tempDir, 'openapi.json');
    fs.writeFileSync(tempFile, JSON.stringify(openapiSpec));

    // 解析 OpenAPI 规范
    const parsed = parseOpenAPI(tempFile);

    expect(parsed.openapi).toBe('3.0.0');
    expect(parsed.info.title).toBe('Test API');
    expect(parsed.components?.schemas?.['example.User']).toBeDefined();

    // 清理临时文件
    fs.rmSync(tempDir, { recursive: true });
  });
});
