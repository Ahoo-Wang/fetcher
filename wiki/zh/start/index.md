---
title: 开始使用 Fetcher
description: 从核心 Fetch 客户端出发，为当前任务选择最短的 Fetcher 使用路径。
---

# 开始使用 Fetcher

Fetcher 是一组围绕 HTTP 请求及其应用工作流构建的 TypeScript 包。你可以只使用 `@ahoo-wang/fetcher`，其他包都是可选能力。

## 选择路径

| 目标                           | 从这里开始                                      |
| ------------------------------ | ----------------------------------------------- |
| 发送类型安全的 HTTP 请求       | [第一个请求](./first-request.md)                |
| 确认运行环境和 peer dependency | [安装](./installation.md)                       |
| 决定应用应该引入哪个包         | [选择包](./choose-packages.md)                  |
| 理解请求处理管线               | [请求生命周期](../learn/request-lifecycle.md)   |
| 体验 React 和 Viewer 行为      | [Storybook](https://fetcher.ahoo.me/storybook/) |

## 最小可用配置

```bash
pnpm add @ahoo-wang/fetcher
```

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const response = await api.get('/users/{id}', {
  urlParams: { path: { id: '42' } },
});

const user = await response.json();
```

Fetcher 在不隐藏原生请求/响应模型的前提下，补充 URL 模板、查询序列化、JSON 请求体、超时、状态校验、拦截器和结果提取。

## 只在任务出现时增加包

- 消费 SSE 或 LLM Token 流时，增加 `fetcher-eventstream`。
- 服务接口比零散请求更清晰时，增加 `fetcher-decorator`。
- OpenAPI 已经是契约时，增加 `fetcher-generator`。
- 请求状态属于 React 组件时，增加 `fetcher-react`。
- 只有使用对应集成时，才增加 `fetcher-wow`、`fetcher-cosec` 或 `fetcher-viewer`。

完整映射参见[选择包](./choose-packages.md)。
