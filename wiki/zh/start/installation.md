---
title: 安装
description: 安装 Fetcher 包，并配置所需的运行环境与 peer dependency。
---

# 安装

## 运行环境要求

- Node.js `>=18.20.8`，或具备当前功能所需 Fetch、Streams、AbortController API 的现代浏览器。
- 推荐使用 TypeScript；所有包均发布类型声明和 ES Module。
- 只有包含 React 组件或 Hooks 的包，才要求 React 和 Ant Design peer dependency。

## 安装核心客户端

```bash
pnpm add @ahoo-wang/fetcher
```

等价的 npm 命令：

```bash
npm install @ahoo-wang/fetcher
```

## 安装可选包

只安装代码需要的包和 peer dependency。例如，React 请求状态需要核心包与 React 包：

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-react react react-dom
```

Viewer 应用还需要提供 Ant Design 以及该版本声明的 Fetcher peer 包：

```bash
pnpm add @ahoo-wang/fetcher-viewer antd @ant-design/icons dayjs react react-dom
```

包管理器会报告当前版本仍缺少的 Fetcher peer dependency。

## 副作用模块

导入 `@ahoo-wang/fetcher-eventstream` 后，它会为 `Response` 增加事件流辅助方法。在使用这些方法前导入一次：

```ts
import '@ahoo-wang/fetcher-eventstream';
```

装饰器服务需要元数据支持，以及本仓库使用的 TypeScript 装饰器选项：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 验证安装

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher();
console.log(api.urlBuilder.build('/health'));
```

输出应为 `/health`。接下来完成[第一个请求](./first-request.md)。
