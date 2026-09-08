---
title: 第一个请求
description: 安装、请求、JSON 结果与失败处理。
---

# 第一个请求

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

在支持 Fetch 的浏览器项目或 Node.js 环境运行下例。示例使用外部演示服务，执行需要网络；它不是你的生产 API。

## 创建客户端并读取用户

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

## 请求经过了什么

`baseURL` 与 `/users/{id}` 组合，`urlParams.path` 将 id 替换为 `1`。`get` 默认返回 `Response`；这里通过第三个参数选择 `JsonResultExtractor`，直接读取 JSON。

默认状态校验接受 200–299。HTTP 状态拒绝或传输失败可通过 `ExchangeError` 获取请求上下文；JSON 解析错误可能在结果提取阶段抛出，因此不能只处理一种错误。泛型 `User` 不校验服务端 JSON；生产边界需要实际校验。

## 改成你自己的接口

替换 baseURL、路径和 User 类型；需要查询参数时，在 urlParams 中加入 `query: { active: true }`。不要将私密服务凭据写入浏览器代码。

继续阅读[请求与结果](../learn/requests-and-results.md)，或查阅[客户端配置](../reference/fetcher/client.md)与[错误及取消](../reference/fetcher/errors-and-cancellation.md)。
