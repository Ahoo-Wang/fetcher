/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * OpenAPI TypeScript Code Generator 使用示例
 */

import { OpenAPI, Schema } from '@ahoo-wang/fetcher-openapi';
import { Project } from 'ts-morph';
import { SchemaGenerator } from './schemaGenerator';

// 示例 OpenAPI 文档
const exampleOpenAPI: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'Example API',
    version: '1.0.0',
  },
  paths: {},
  components: {
    schemas: {
      // 这些 schemas 将被生成到不同的模块文件中
      'prajna.bot.BotCreated': {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name'],
      } as Schema,

      'prajna.BotState': {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
          },
          botCreated: { $ref: '#/components/schemas/prajna.bot.BotCreated' },
        },
        required: ['id', 'status'],
      } as Schema,

      'prajna.AiMessage.Assistant': {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['assistant'] },
          content: { type: 'string' },
          toolCalls: {
            type: 'array',
            items: { $ref: '#/components/schemas/prajna.AiMessage.Assistant.ToolCall' },
          },
        },
        required: ['role', 'content'],
      } as Schema,

      'prajna.AiMessage.Assistant.ToolCall': {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          function: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              arguments: { type: 'string' },
            },
          },
        },
      } as Schema,

      'prajna.AiMessage.System': {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['system'] },
          content: { type: 'string' },
        },
        required: ['role', 'content'],
      } as Schema,

      // 测试联合类型
      'prajna.Message': {
        oneOf: [
          { $ref: '#/components/schemas/prajna.AiMessage.Assistant' },
          { $ref: '#/components/schemas/prajna.AiMessage.System' },
        ],
      } as Schema,
    },
  },
};

// 创建 ts-morph 项目
const project = new Project({
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    strict: true,
    esModuleInterop: true,
    outDir: 'dist',
  },
});

// 创建生成器实例
const generator = new SchemaGenerator({
  openAPI: exampleOpenAPI,
  project,
});

// 生成 TypeScript 类型定义
generator.generate();

// 保存生成的文件
project.saveSync();

console.log('TypeScript 类型定义生成完成！');