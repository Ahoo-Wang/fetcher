# @ahoo-wang/fetcher-openapi

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-openapi.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

[Fetcher](https://github.com/Ahoo-Wang/fetcher) 的 OpenAPI 规范 TypeScript 类型和工具 - 一个现代、超轻量级的 HTTP 客户端。

## 功能特性

- 📦 **超轻量级** - 最小化开销的 TypeScript 类型定义
- 🦺 **完整 TypeScript 支持** - OpenAPI 3.x 规范的完整类型定义
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