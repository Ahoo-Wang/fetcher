#!/usr/bin/env node

import { Command } from 'commander';
import { parseOpenAPI } from './parser/openapiParser';
import { generateSchemas } from './generator/schemaGenerator';
import { generateClients } from './generator/clientGenerator';
import { resolve } from 'path';

const program = new Command();

program
  .name('fetcher-openapi-generator')
  .description('OpenAPI TypeScript Code Generator')
  .version('1.0.0');

program
  .option('-i, --input <input>', 'OpenAPI specification file path')
  .option('-o, --output <output>', 'Output directory path')
  .action(options => {
    if (!options.input || !options.output) {
      console.error('Error: Both input and output options are required');
      program.help();
      process.exit(1);
    }

    try {
      // 解析 OpenAPI 规范
      const openapi = parseOpenAPI(options.input);

      // 生成数据模型
      generateSchemas(openapi, resolve(options.output));

      // 生成 API 客户端
      generateClients(openapi, resolve(options.output));

      console.log('Code generation completed successfully!');
    } catch (error) {
      console.error('Error during code generation:', error);
      process.exit(1);
    }
  });

program.parse();
