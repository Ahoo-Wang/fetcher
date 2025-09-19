# @ahoo-wang/fetcher-openapi-generator

基于 OpenAPI 规范的 TypeScript 代码生成器，专注于生成数据模型（Schema）、 请求和响应体类型定义 以及 ApiClient。

## 功能特性

- 根据 OpenAPI 规范生成 生成数据模型（Schema）、 请求和响应体类型定义 以及 ApiClient
- 智能模块路径组织，根据命名规范自动分组
- 支持 $ref 引用解析
- 支持基本类型、数组、对象、联合类型和枚举类型
- 命令行支持,支持通过 npx 运行

## 技术栈

- vite
- vitest
- typescript
- @ahoo-wang/fetcher-openapi : 定义了 OpenAPI 规范类型
- @ahoo-wang/fetcher-decorator : Fetcher HTTP 客户端的装饰器支持。使用 TypeScript 装饰器实现简洁、声明式的 API 服务定义。
- @ahoo-wang/fetcher-wow : 内置的 Wow 类型定义系统，当识别 Wow 通用类型，替换为对应的类型
- ts-morph ：使用 ts-morph 生成 TypeScript 文件
- Commander.js ：通过 Commander.js 提供友好的命令行界面
- yaml

## 安装

```bash
npm install @ahoo-wang/fetcher-openapi-generator
```

## 使用

### 命令行使用

```bash
npx @ahoo-wang/fetcher-openapi-generator -i openapi.json -o src/generated
```

### API 使用

```typescript
import { generate } from '@ahoo-wang/fetcher-openapi-generator';

const openapiSpec = {
  // your OpenAPI specification
};

generate(openapiSpec, './src/generated');
```
