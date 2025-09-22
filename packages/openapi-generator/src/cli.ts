#!/usr/bin/env node

import { program } from 'commander';
import { openAPIParser } from '@/parser/openAPIParser.ts';
import { CodeGenerator } from '@/codeGenerator.ts';
import { Project } from 'ts-morph';
import { ModuleResolver } from '@/module/moduleResolver.ts';
import { ModuleInfoResolver } from '@/module/moduleInfoResolver.ts';
import { ModelResolver } from '@/model/modelResolver.ts';
import { ClientResolver } from '@/client/clientResolver.ts';

program
  .name('fetcher-openapi-generator')
  .description('OpenAPI Specification TypeScript code generator for Fetcher')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate TypeScript code from OpenAPI specification')
  .requiredOption('-i, --input <path>', 'Input OpenAPI specification file path')
  .requiredOption('-o, --output <path>', 'Output directory path')
  .action(options => {
    try {
      const openAPI = openAPIParser.parse(options.input);
      if (!openAPI) {
        throw new Error('OpenAPI specification is invalid');
      }
      const moduleResolver = new ModuleResolver(new ModuleInfoResolver(), new ModelResolver(new ModuleInfoResolver()), new ClientResolver());
      moduleResolver.resolve(openAPI);
      const codeGenerator = new CodeGenerator(options.output, new Project());
      codeGenerator.generate(moduleResolver.getModules());
      console.log('Code generation completed successfully!');
    } catch (error) {
      console.error('Error during code generation:', error);
      process.exit(1);
    }
  });

program.parse();
