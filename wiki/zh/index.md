---
layout: home
title: Fetcher
description: 从一个 HTTP 请求开始，按需组合服务、流和 React。
hero:
  name: Fetcher
  text: 从 HTTP 请求，到应用数据流
  tagline: 从一个 HTTP 请求开始，按需组合服务、流和 React。
  actions:
    - theme: brand
      text: 发送第一个请求
      link: /zh/start/first-request
    - theme: alt
      text: 查阅 API
      link: /zh/reference/
features:
  - title: 请求与结果
    details: 组合 URL、参数与请求体，明确选择 Response 或 JSON。
    link: /zh/learn/requests-and-results
  - title: 流与服务
    details: 读取 SSE，定义声明式服务，或从 OpenAPI 生成客户端。
    link: /zh/start/choose-packages
  - title: React 与数据视图
    details: 让加载、结果、错误和取消融入页面，再按需加入 Viewer。
    link: /zh/learn/react-data-flow
---

## 一个客户端，一个明确的结果

```ts
import {
  ExchangeError,
  Fetcher,
  JsonResultExtractor,
} from '@ahoo-wang/fetcher';

interface User {
  id: number;
  name: string;
}
const api = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5_000,
});

try {
  const user = await api.get<User>(
    '/users/{id}',
    {
      urlParams: { path: { id: 1 } },
    },
    { resultExtractor: JsonResultExtractor },
  );
  console.log(user.name);
} catch (error) {
  if (error instanceof ExchangeError) {
    console.error(error.exchange.response?.status, error.message);
  } else {
    throw error;
  }
}
```

泛型描述预期结构，不替代运行时校验。示例使用公开演示接口，执行需要网络。

[阅读完整入门](./start/index.md) · [选择适合的包](./start/choose-packages.md) · [Storybook](https://fetcher.ahoo.me/storybook/)
