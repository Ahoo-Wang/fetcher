# @ahoo-wang/fetcher-decorator

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-decorator.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-decorator.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-decorator)](https://www.npmjs.com/package/@ahoo-wang/fetcher-decorator)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

Fetcher HTTP 客户端的装饰器支持。使用 TypeScript 装饰器实现简洁、声明式的 API 服务定义。

## 🌟 功能特性

- **🎨 简洁的 API 定义**：使用直观的装饰器定义 HTTP 服务
- **🧭 自动参数绑定**：路径、查询、头部和请求体参数自动绑定
- **⏱️ 可配置超时**：支持每方法和每类的超时设置
- **🔗 Fetcher 集成**：与 Fetcher 的命名 fetcher 系统无缝集成
- **🛡️ TypeScript 支持**：完整的 TypeScript 类型定义
- **⚡ 自动实现**：方法自动实现为 HTTP 调用
- **📦 元数据系统**：丰富的元数据支持，用于高级定制

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher-decorator

# 使用 pnpm
pnpm add @ahoo-wang/fetcher-decorator

# 使用 yarn
yarn add @ahoo-wang/fetcher-decorator
```

### 基本用法

```typescript
import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// 创建并注册 fetcher
const userFetcher = new NamedFetcher('user', {
  baseURL: 'https://api.user-service.com',
});

// 使用装饰器定义服务类
@api('/users', { fetcher: 'user', timeout: 10000 })
class UserService {
  @post('/', { timeout: 5000 })
  createUser(@body() user: User): Promise<Response> {
    throw new Error('实现将自动生成');
  }

  @get('/{id}')
  getUser(
    @path('id') id: number,
    @query('include') include: string,
  ): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}

// 使用服务
const userService = new UserService();
const response = await userService.createUser({ name: 'John' });
```

## 📚 API 参考

### 类装饰器

#### `@api(basePath, metadata)`

为类定义 API 元数据。

**参数：**

- `basePath`: 类中所有端点的基础路径
- `metadata`: API 的额外元数据
  - `headers`: 类中所有请求的默认头部
  - `timeout`: 类中所有请求的默认超时时间
  - `fetcher`: 要使用的 fetcher 实例名称（默认：'default'）

**示例：**

```typescript
@api('/api/v1', {
  headers: { 'X-API-Version': '1.0' },
  timeout: 5000,
  fetcher: 'api',
})
class ApiService {
  // ...
}
```

### 方法装饰器

#### `@get(path, metadata)`

定义 GET 端点。

#### `@post(path, metadata)`

定义 POST 端点。

#### `@put(path, metadata)`

定义 PUT 端点。

#### `@del(path, metadata)`

定义 DELETE 端点。

#### `@patch(path, metadata)`

定义 PATCH 端点。

#### `@head(path, metadata)`

定义 HEAD 端点。

#### `@options(path, metadata)`

定义 OPTIONS 端点。

**通用参数：**

- `path`: 端点路径（相对于类基础路径）
- `metadata`: 端点的额外元数据
  - `headers`: 请求的头部
  - `timeout`: 请求的超时时间
  - `fetcher`: 要使用的 fetcher 实例名称

**示例：**

```typescript
class UserService {
  @get('/{id}', { timeout: 3000 })
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('实现将自动生成');
  }

  @post('/', { headers: { 'Content-Type': 'application/json' } })
  createUser(@body() user: User): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}
```

### 参数装饰器

#### `@path(name)`

定义路径参数。

**参数：**

- `name`: 参数名称（在路径模板中使用）

#### `@query(name)`

定义查询参数。

**参数：**

- `name`: 参数名称（在查询字符串中使用）

#### `@body()`

定义请求体。

#### `@header(name)`

定义头部参数。

**参数：**

- `name`: 头部名称

**示例：**

```typescript
class UserService {
  @get('/search')
  searchUsers(
    @query('q') query: string,
    @query('limit') limit: number,
    @header('Authorization') auth: string,
  ): Promise<Response> {
    throw new Error('实现将自动生成');
  }

  @put('/{id}')
  updateUser(@path('id') id: number, @body() user: User): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}
```

## 🛠️ 高级用法

### 继承支持

```typescript
@api('/base')
class BaseService {
  @get('/status')
  getStatus(): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}

@api('/users')
class UserService extends BaseService {
  @get('/{id}')
  getUser(@path('id') id: number): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}
```

### 复杂参数处理

```typescript
@api('/api')
class ComplexService {
  @post('/batch')
  batchOperation(
    @body() items: Item[],
    @header('X-Request-ID') requestId: string,
    @query('dryRun') dryRun: boolean = false,
  ): Promise<Response> {
    throw new Error('实现将自动生成');
  }
}
```

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行带覆盖率的测试
pnpm test --coverage
```

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

Apache-2.0

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
