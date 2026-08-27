---
title: 选择包
description: 将每个 Fetcher 包映射到它负责的开发任务。
---

# 选择包

先使用核心客户端。只有当应用中出现对应任务时，才增加其他包。

| 开发任务                     | 包                               | 适用时机                                                       |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------- |
| 发送 HTTP 请求               | `@ahoo-wang/fetcher`             | 需要 URL 模板、查询参数、JSON 请求体、超时、拦截器或状态校验。 |
| 声明服务方法                 | `@ahoo-wang/fetcher-decorator`   | 装饰器服务类比重复的请求调用更易维护。                         |
| 发布类型事件                 | `@ahoo-wang/fetcher-eventbus`    | 组件或标签页需要串行、并行或广播事件。                         |
| 消费 SSE                     | `@ahoo-wang/fetcher-eventstream` | 响应通过流传递事件或 Token 片段。                              |
| 调用 OpenAI Chat Completions | `@ahoo-wang/fetcher-openai`      | 需要 Fetcher 生态的非流式与流式类型客户端。                    |
| 描述 OpenAPI 文档            | `@ahoo-wang/fetcher-openapi`     | 工具需要零运行时代码的 OpenAPI 3.x TypeScript 类型。           |
| 生成客户端                   | `@ahoo-wang/fetcher-generator`   | OpenAPI 是模型和 API 客户端的源契约。                          |
| 将请求绑定到 React           | `@ahoo-wang/fetcher-react`       | 组件需要加载、结果、错误、防抖、存储或 Wow 查询状态。          |
| 存储类型值                   | `@ahoo-wang/fetcher-storage`     | 浏览器与非浏览器代码需要统一的键值存储抽象。                   |
| 集成 CoSec                   | `@ahoo-wang/fetcher-cosec`       | 请求需要 CoSec Token、刷新、空间、设备或归属行为。             |
| 集成 Wow CQRS                | `@ahoo-wang/fetcher-wow`         | 客户端需要发送 Wow 命令或快照/事件查询。                       |
| 构建数据查看器               | `@ahoo-wang/fetcher-viewer`      | React 应用需要可复用的筛选、表格、视图或远程 Viewer 定义。     |

## 常见组合

### 类型安全 REST 客户端

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
```

### OpenAPI 生成客户端

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
pnpm add -D @ahoo-wang/fetcher-generator
```

### 流式 React 客户端

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-react react react-dom
```

### Wow 数据应用

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-react
```

只有需要其 Ant Design 数据界面时，才增加 `fetcher-viewer`。

## 何时核心包已经足够

对于小型请求模块，不要安装装饰器、代码生成、React 集成或 Viewer。`Fetcher` 已经返回原生 `Response` 并接受原生请求选项，直接使用核心客户端是最简单的默认选择。
