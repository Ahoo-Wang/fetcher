---
title: 开始使用 Fetcher
description: 从一个 HTTP 请求开始，按需组合服务、流和 React。
---

# 开始使用 Fetcher

Fetcher 是基于原生 Fetch API 的 TypeScript HTTP 客户端。核心包负责 URL、请求体、状态校验、拦截器和结果提取；其他包在你需要时加入。

## 先完成一个请求

1. [安装](./installation.md)：确认运行环境并安装核心包。
2. [第一个请求](./first-request.md)：创建客户端、读取 JSON 并处理失败。
3. [请求与结果](../learn/requests-and-results.md)：使用参数、请求体和不同结果类型。
4. [错误与超时](../learn/interceptors-errors-timeouts.md)：理解失败和取消的所有权。

## 按当前任务继续

| 你已经具备的输入  | 下一步                                        |
| ----------------- | --------------------------------------------- |
| 一个 HTTP 地址    | [Fetcher 参考](../reference/fetcher/index.md) |
| 一份 OpenAPI 文档 | [生成客户端](../recipes/openapi-client.md)    |
| 一个 SSE 接口     | [流式读取](../learn/streaming.md)             |
| 一个 React 页面   | [React 数据流](../learn/react-data-flow.md)   |
| 一个 Wow 服务     | [CQRS 实战](../recipes/wow-cqrs.md)           |

不确定包之间的关系时，查看[选择包](./choose-packages.md)。首次接入无需理解全部生态。
