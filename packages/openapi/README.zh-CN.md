# @ahoo-wang/fetcher-openapi

[![NPM Version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![NPM Downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-openapi)](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)

[English](./README.md) | 简体中文

[Fetcher](https://github.com/Ahoo-Wang/fetcher) 的 OpenAPI 规范 TypeScript 类型和工具 - 一个现代、超轻量级的 HTTP 客户端。

## 功能特性

- 📦 **超轻量级** - 最小化开销的 TypeScript 类型定义
- 🦺 **完整 TypeScript 支持** - OpenAPI 3.x 规范的完整类型定义
- 🔍 **类型推断工具** - 从 OpenAPI 模式中提取 TypeScript 类型
- 🔄 **引用解析** - 解析 OpenAPI 文档中的 $ref 引用
- 🧩 **模块化设计** - 按需导入所需功能
- 🎯 **框架无关** - 适用于任何与 OpenAPI 兼容的工具

## 安装

```bash
npm install @ahoo-wang/fetcher-openapi
```

## 使用方法

### 基础类型

导入 OpenAPI 规范类型：

```typescript
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

const openAPI: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: '我的 API',
    version: '1.0.0'
  },
  paths: {
    '/users': {
      get: {
        summary: '获取用户列表',
        responses: {
          '200': {
            description: '用户列表',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
```

### 类型推断工具

该包提供了强大的类型推断工具，可以从 OpenAPI 模式中提取 TypeScript 类型：

```typescript
import type {
  ExtractSchemaType,
  ExtractRequestBodyType,
  ExtractOkResponseBodyType
} from '@ahoo-wang/fetcher-openapi';

// 从模式中提取类型
type User = ExtractSchemaType<{
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' }
  },
  required: ['id', 'name']
}>;

// 从操作中提取请求体类型
type CreateUserRequest = ExtractRequestBodyType<{
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        }
      }
    }
  }
}>;

// 从操作中提取响应体类型
type CreateUserResponse = ExtractOkResponseBodyType<{
  responses: {
    '201': {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User'
          }
        }
      }
    }
  }
}, {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }
  }
}>;
```

## 高级类型推断

### 处理复杂模式类型

类型推断工具支持复杂的 OpenAPI 模式结构：

```typescript
import type { ExtractSchemaType } from '@ahoo-wang/fetcher-openapi';

// 使用 oneOf 的联合类型
type UnionType = ExtractSchemaType<{
  oneOf: [
    { type: 'string' },
    { type: 'number' }
  ]
}>; // string | number

// 使用 allOf 的交集类型
type IntersectionType = ExtractSchemaType<{
  allOf: [
    {
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id']
    },
    {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    }
  ]
}>; // { id: number } & { name: string }

// 数组类型
type ArrayType = ExtractSchemaType<{
  type: 'array',
  items: { type: 'string' }
}>; // string[]
```

### 解析引用

该包还提供了用于解析 `$ref` 引用的工具：

```typescript
import type { ResolveReference } from '@ahoo-wang/fetcher-openapi';

type Resolved = ResolveReference<
  { $ref: '#/components/schemas/User' },
  {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      }
    }
  }
>; // { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' } }, required: ['id', 'name'] }
```

## API 参考

### 核心类型

- `OpenAPI` - 根文档对象
- `Info` - API 元数据
- `Server` - 服务器配置
- `Paths` - API 路径和操作
- `Operation` - 单个 API 操作
- `Schema` - 数据模式定义
- `Parameter` - 操作参数
- `RequestBody` - 请求体定义
- `Response` - 响应定义
- `Components` - 可复用组件
- `SecurityScheme` - 安全方案定义

### 工具类型

- `ExtractSchemaType<S>` - 从 OpenAPI Schema 中提取 TypeScript 类型
- `ExtractRequestBodyType<Op, Components>` - 从 Operation 中提取请求体类型
- `ExtractOkResponseBodyType<Op, Components>` - 从 Operation 中提取成功响应体类型
- `ResolveReference<R, Components>` - 解析 $ref 引用为实际类型

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)