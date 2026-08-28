---
title: Fetcher 参考
description: 配置 Fetcher、发送 HTTP 请求、提取结果并处理请求失败。
---

# `@ahoo-wang/fetcher`

核心包在平台 `fetch` 之上提供 URL 模板、拦截器、超时、状态校验和类型化结果提取。

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

## 创建客户端

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
```

### `FetcherOptions`

| 选项               | 默认值                | 用途                                 |
| ------------------ | --------------------- | ------------------------------------ |
| `baseURL`          | `''`                  | 相对请求 URL 的前缀                  |
| `headers`          | JSON 内容类型         | 合并到每个请求的请求头               |
| `timeout`          | 不超时                | 默认超时毫秒数                       |
| `urlTemplateStyle` | `UriTemplate`         | URI Template 或 Express 风格路径参数 |
| `interceptors`     | 新建默认管理器        | 替换完整拦截器链                     |
| `validateStatus`   | `200 <= status < 300` | 判断响应是否成功                     |

`validateStatus` 只配置默认拦截器管理器。显式传入 `interceptors` 后，该选项不再生效。

## 发送请求

```ts
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { api } from './api';

interface User {
  id: string;
  name: string;
}

const user = await api.get<User>(
  '/users/{id}',
  {
    urlParams: {
      path: { id: 'u-42' },
      query: { expand: 'team' },
    },
  },
  { resultExtractor: ResultExtractors.Json },
);
```

`fetch`、`get`、`post`、`put`、`patch`、`delete`、`head`、`options` 和
`trace` 默认返回 `Response`。已有完整 `FetchRequest` 时使用 `request()`；它默认
返回 `FetchExchange`。

单次请求的请求头和超时会覆盖客户端默认值。默认请求体拦截器会把普通对象序列化为 JSON。

## 提取结果

| 提取器                         | 结果                 |
| ------------------------------ | -------------------- |
| `ResultExtractors.Response`    | 原生 `Response`      |
| `ResultExtractors.Json`        | 已解析 JSON          |
| `ResultExtractors.Text`        | 文本正文             |
| `ResultExtractors.Blob`        | `Blob`               |
| `ResultExtractors.ArrayBuffer` | `ArrayBuffer`        |
| `ResultExtractors.Bytes`       | `Uint8Array`         |
| `ResultExtractors.Exchange`    | 完整 `FetchExchange` |

自定义 `ResultExtractor` 接收已完成的 exchange，并可返回同步值或 Promise。

## 拦截器与错误

`fetcher.interceptors` 暴露请求、响应和错误注册表。处理器名称唯一，按 `order`
升序运行；使用 `use()` 注册、`eject()` 移除。

当错误类型会影响用户体验时，可捕获以下公开类型：

- `HttpStatusValidationError`：响应未通过 `validateStatus`。
- `FetchTimeoutError`：达到配置的超时时间。
- `ExchangeError`：请求处理失败，并保留 exchange 上下文。
- `FetcherError`：Fetcher 专用错误的基类。

继续阅读[请求与结果](../learn/requests-and-results.md)和
[拦截器、错误与超时](../learn/interceptors-errors-timeouts.md)。
