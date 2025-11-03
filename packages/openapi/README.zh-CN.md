# @ahoo-wang/fetcher-openapi

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-openapi.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/?path=/docs/openapi-introduction--docs)

[Fetcher](https://github.com/Ahoo-Wang/fetcher) 的 OpenAPI 规范 TypeScript 类型和工具 - 一个现代、超轻量级的 HTTP 客户端。

## 功能特性

- 📦 **超轻量级** - 零运行时开销，仅 TypeScript 类型（~2KB）
- 🦺 **完整 TypeScript 支持** - OpenAPI 3.0+ 规范的完整类型定义
- 🧩 **模块化设计** - 从特定模块按需导入所需功能
- 🎯 **框架无关** - 适用于任何与 OpenAPI 兼容的工具
- 🔧 **扩展支持** - 内置支持 OpenAPI 扩展（x-\* 属性）
- 📚 **全面覆盖** - 涵盖所有 OpenAPI 3.0+ 功能，包括模式、参数、响应、安全等
- 🏗️ **类型安全开发** - 利用 TypeScript 类型系统进行 API 开发

## 安装

```bash
npm install @ahoo-wang/fetcher-openapi
```

## 使用方法

### 基础类型

导入 OpenAPI 规范类型：

```typescript
import type {
  OpenAPI,
  Schema,
  Operation,
  Components,
} from '@ahoo-wang/fetcher-openapi';

const openAPI: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: '我的 API',
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        summary: '获取用户列表',
        operationId: 'getUsers',
        responses: {
          '200': {
            description: '用户列表',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name'],
      },
    },
  },
};
```

### 使用模式

使用完整的 OpenAPI Schema 支持定义复杂数据结构：

```typescript
import type { Schema, Discriminator, XML } from '@ahoo-wang/fetcher-openapi';

const userSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email'],
};

const polymorphicSchema: Schema = {
  oneOf: [
    { $ref: '#/components/schemas/Admin' },
    { $ref: '#/components/schemas/User' },
  ],
  discriminator: {
    propertyName: 'role',
    mapping: {
      admin: '#/components/schemas/Admin',
      user: '#/components/schemas/User',
    },
  },
};
```

### 扩展支持

使用 OpenAPI 扩展实现自定义功能：

```typescript
import type { Operation, CommonExtensions } from '@ahoo-wang/fetcher-openapi';

const operationWithExtensions: Operation & CommonExtensions = {
  summary: '获取用户资料',
  operationId: 'getUserProfile',
  'x-internal': false,
  'x-deprecated': {
    message: '请使用 getUser 替代',
    since: '2.0.0',
    removedIn: '3.0.0',
    replacement: 'getUser',
  },
  'x-tags': ['users', 'profile'],
  'x-order': 1,
  responses: {
    '200': {
      description: '用户资料',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UserProfile' },
        },
      },
    },
  },
};
```

## API 参考

### 核心类型

#### 文档结构

- `OpenAPI` - OpenAPI 根文档对象
- `Info` - API 元数据（标题、版本、描述等）
- `Contact` - API 联系信息
- `License` - 许可证信息
- `Server` - 带变量的服务器配置
- `Paths` - API 路径及其操作的集合
- `Components` - 可复用组件（模式、参数、响应等）
- `Tag` - API 分组和文档标签

#### 操作和参数

- `Operation` - 单个 API 操作（GET、POST 等）
- `Parameter` - 操作参数（查询、路径、头部、cookie）
- `RequestBody` - 带内容类型的请求体定义
- `Response` - 带状态码的响应定义
- `MediaType` - 带模式的媒体类型定义
- `Encoding` - 请求/响应体的序列化规则

#### 数据模式

- `Schema` - 基于 JSON Schema 的数据结构定义
- `Discriminator` - 带判别字段的多态支持
- `XML` - XML 序列化配置
- `Reference` - 可复用组件的 JSON 引用（$ref）

#### 安全

- `SecurityScheme` - 认证方案定义
- `SecurityRequirement` - 操作所需的安全方案

### 扩展和工具

#### 扩展支持

- `Extensible` - 支持扩展的对象基础接口
- `CommonExtensions` - 预定义扩展属性（x-internal、x-deprecated 等）

#### 类型工具

- `HTTPMethod` - 支持的 HTTP 方法（'get'、'post'、'put'、'delete' 等）
- `ParameterLocation` - 参数位置（'query'、'header'、'path'、'cookie'）
- `SchemaType` - JSON Schema 原始类型（'string'、'number'、'boolean' 等）

### 高级用法

#### 模块化导入

仅导入所需的类型以实现更好的树摇优化：

```typescript
// 导入特定类型
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

// 或从特定模块导入
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi/openAPI';
import type { Schema } from '@ahoo-wang/fetcher-openapi/schema';
import type { Operation } from '@ahoo-wang/fetcher-openapi/paths';
```

#### 类型安全 API 开发

使用这些类型构建类型安全的 API 客户端和文档：

```typescript
function validateOpenAPI(doc: OpenAPI): boolean {
  // TypeScript 会在编译时捕获类型错误
  return doc.openapi.startsWith('3.');
}

function createOperation(
  path: string,
  method: HTTPMethod,
  config: Partial<Operation>,
): Operation {
  return {
    operationId: `${method}${path.replace(/\//g, '')}`,
    ...config,
  };
}
```

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)
