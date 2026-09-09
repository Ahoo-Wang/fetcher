---
layout: home
title: 基于原生 Fetch 的 TypeScript HTTP 客户端
description: 使用 Fetcher 完成 HTTP、服务客户端、流和 React 数据交互。
hero:
  name: Fetcher
  text: 从一次请求到应用数据交互
  tagline: 在原生 Fetch 之上共享配置，明确处理结果与错误。
  image:
    src: /fetcher-logo.png
    alt: Fetcher 请求与响应标志
  actions:
    - theme: brand
      text: 开始接入
      link: ./start/
    - theme: alt
      text: 评估架构
      link: ./architecture/
features:
  - title: HTTP 请求
    details: 在原生 Fetch 之上共享配置、发送数据，明确处理结果与失败。
    link: /zh/guides/http/
    linkText: 了解更多
  - title: 服务客户端
    details: 声明服务方法，或从 OpenAPI 文档生成 TypeScript 客户端。
    link: /zh/guides/services/
    linkText: 了解更多
  - title: 流式消费
    details: 消费 SSE 事件，管理取消、连接生命周期与资源清理。
    link: /zh/guides/streaming/
    linkText: 了解更多
  - title: React 数据流
    details: 将请求执行、加载、错误与取消接入 React 组件。
    link: /zh/guides/react/
    linkText: 了解更多
  - title: 数据视图
    details: 选择 shadcn/Base UI View Engine 或 Ant Design Viewer，接入表格、筛选和已保存视图。
    link: /zh/start/first-view
    linkText: 了解更多
  - title: 架构与选型
    details: 评估包边界、运行环境要求与集成责任，选择适合应用的能力。
    link: /zh/architecture/
    linkText: 了解更多
---

## 明确请求与返回值

```ts
const user = await client.get<User>(
  '/users/1',
  {},
  {
    resultExtractor: ResultExtractors.Json,
  },
);
```

`client` 是配置好的 `Fetcher` 实例，`ResultExtractors` 从核心包导入。通过[第一个请求](./start/first-request.md)运行完整配置、本地服务和失败分支。
