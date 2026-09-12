# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [文档](https://fetcher.ahoo.me/zh/) ·
[Skills](https://fetcher.ahoo.me/zh/skills/) ·
[Storybook](https://fetcher.ahoo.me/storybook/) ·
[npm](https://www.npmjs.com/package/@ahoo-wang/fetcher)

Fetcher 是围绕平台 `fetch` 构建的 TypeScript HTTP 客户端生态。先使用类型化请求、
拦截器、超时和流式响应；只有应用需要时，再添加 React、OpenAPI 生成、认证、Wow CQRS
或数据 Viewer 包。

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

需要 Node.js 18.20.8 或更高版本。

## 第一个请求

```ts
import { Fetcher, FetcherError } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
});

try {
  const response = await api.get('/users/{id}', {
    urlParams: {
      path: { id: 'u-42' },
      query: { include: 'team' },
    },
  });
  const user: User = await response.json();
  console.log(user.name);
} catch (error) {
  if (error instanceof FetcherError) {
    console.error(error.message);
  }
}
```

## 按任务选择包

| 任务                          | 包                                                                       |
| ----------------------------- | ------------------------------------------------------------------------ |
| HTTP 客户端与拦截器           | `@ahoo-wang/fetcher`                                                     |
| 声明式服务类                  | `@ahoo-wang/fetcher-decorator`                                           |
| 类型化事件                    | `@ahoo-wang/fetcher-eventbus`                                            |
| Server-Sent Events            | `@ahoo-wang/fetcher-eventstream`                                         |
| OpenAI Chat Completions       | `@ahoo-wang/fetcher-openai`                                              |
| OpenAPI TypeScript 类型       | `@ahoo-wang/fetcher-openapi`                                             |
| OpenAPI 客户端生成            | `@ahoo-wang/fetcher-generator`                                           |
| React Hooks                   | `@ahoo-wang/fetcher-react`                                               |
| 类型化存储                    | `@ahoo-wang/fetcher-storage`                                             |
| CoSec 认证                    | `@ahoo-wang/fetcher-cosec`                                               |
| Wow 命令与查询                | `@ahoo-wang/fetcher-wow`                                                 |
| 数据视图（新项目）            | [`@ahoo-wang/fetcher-view-engine`](packages/view-engine/README.zh-CN.md) |
| 旧版 Viewer（维护期，已弃用） | [`@ahoo-wang/fetcher-viewer`](packages/viewer/README.zh-CN.md)           |

[选择包](https://fetcher.ahoo.me/zh/architecture/package-boundaries)说明 peer 依赖和最小可用组合。

## 学习与构建

- [五分钟开始](https://fetcher.ahoo.me/zh/start/first-request)
- [理解请求生命周期](https://fetcher.ahoo.me/zh/architecture/request-lifecycle)
- [使用开发者实战指南](https://fetcher.ahoo.me/zh/guides/services/declarative-client)
- [使用理解包边界的 Agent Skills](https://fetcher.ahoo.me/zh/skills/)
- [查询包 API](https://fetcher.ahoo.me/zh/reference/)
- [体验交互工作流](https://fetcher.ahoo.me/storybook/)

## 参与贡献

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:unit
pnpm lint
```

聚焦包、集成、Wiki 和 Storybook 检查请参阅[贡献指南](https://fetcher.ahoo.me/zh/contributing/)。

## 许可证

[Apache License 2.0](./LICENSE)
