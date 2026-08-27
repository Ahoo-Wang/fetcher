---
title: 第一个请求
description: 在五分钟内安装 Fetcher 并发送一个类型安全的 HTTP 请求。
---

# 第一个请求

## 前置条件

使用 Node.js `>=18.20.8`，或具备原生 Fetch 支持的浏览器项目。

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

## 创建客户端

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5_000,
});
```

客户端选项会成为每个请求的默认值，请求级选项可以覆盖它们。

## 发送请求

```ts
const response = await api.get('/users/{id}', {
  urlParams: {
    path: { id: '42' },
    query: { include: 'profile' },
  },
});
```

Fetcher 会解析出以下 URL：

```text
https://api.example.com/users/42?include=profile
```

## 读取结果

HTTP 辅助方法默认返回原生 `Response`：

```ts
interface User {
  id: string;
  name: string;
}

const user = (await response.json()) as User;
console.log(user.name);
```

请在信任边界执行数据校验：TypeScript 类型断言不会验证服务端数据。

## 处理失败响应

默认状态校验器接受 `200` 到 `299`。被拒绝的状态或请求失败会进入 Fetcher 错误层次：

```ts
import { ExchangeError, FetcherError } from '@ahoo-wang/fetcher';

try {
  await api.get('/users/missing');
} catch (error) {
  if (error instanceof ExchangeError) {
    console.error(error.exchange.response?.status, error.message);
  } else if (error instanceof FetcherError) {
    console.error(error.message);
  } else {
    throw error;
  }
}
```

`ExchangeError.exchange` 将请求、响应、属性和底层错误保留在一起，便于定位问题。

## 下一步

- [选择包](./choose-packages.md)：查看可选能力。
- [配置](../guide/configuration.md)：查看客户端和请求选项。
- [Fetcher 核心](../architecture/fetcher-core.md)：理解拦截器管线。
- [Storybook](https://fetcher.ahoo.me/storybook/)：体验可交互请求行为。
